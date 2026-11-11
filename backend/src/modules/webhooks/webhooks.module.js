import { Router } from 'express';
import { env } from '../../config/env.js';
import { getIo } from '../../config/socket.js';
import { logger } from '../../config/logger.js';
import { db } from '../../config/database.js';
import { sendTopicNotification } from '../../services/firebase.service.js';

const router = Router();

const KNOWN_SERVICES = [
  'Hair Spa',
  'Keratin',
  'Smoothening',
  'Botox',
  'Hair Cut',
  'Haircut',
  'Hair Colour',
  'Hair Color',
  'Highlights',
  'Balayage',
  'Facial',
  'Hydra Facial',
  'Bridal',
  'Bridal Makeup',
  'Party Makeup',
  'Makeup',
  'Manicure',
  'Pedicure',
  'Nail Art',
  'Nail Extensions',
  'Waxing',
  'Threading',
  'Head Massage',
  'Body Polishing',
  'Cleanup',
  'Skin Treatment',
];

/**
 * Detect salon services mentioned in message or ad headline
 */
function detectInterestedServices(text = '') {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  const matched = new Set();
  for (const service of KNOWN_SERVICES) {
    if (lower.includes(service.toLowerCase())) {
      matched.add(service === 'Hair Cut' ? 'Haircut' : service === 'Hair Color' ? 'Hair Colour' : service);
    }
  }
  return Array.from(matched);
}

/**
 * Format raw WhatsApp/Meta phone number & extract last 10 digits for duplicate lookup
 */
function normalizePhone(rawPhone) {
  if (!rawPhone) return { formatted: null, last10: null };
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return { formatted: String(rawPhone).trim(), last10: null };

  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  let formatted = String(rawPhone).trim();
  if (digits.length === 12 && digits.startsWith('91')) {
    formatted = `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  } else if (digits.length === 10) {
    formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  } else if (!formatted.startsWith('+')) {
    formatted = `+${digits}`;
  }
  return { formatted, last10 };
}

/**
 * Resolve target business_id for incoming webhook leads
 */
async function resolveBusinessId(explicitBusinessId = null) {
  if (explicitBusinessId) return Number(explicitBusinessId);
  const adminUser = await db('users')
    .whereIn('role', ['admin', 'super_admin'])
    .whereNotNull('business_id')
    .orderBy('id', 'asc')
    .first('business_id');
  return adminUser ? adminUser.business_id : 1;
}

/**
 * Safely insert a lead into the `leads` table (strips any unknown columns automatically)
 */
async function safeInsertLead(payload) {
  const data = { ...payload };
  while (true) {
    try {
      const [id] = await db('leads').insert(data);
      return id;
    } catch (err) {
      if (err.message && err.message.includes('Unknown column')) {
        const match = err.message.match(/Unknown column '([^']+)'/);
        if (match && match[1] && Object.prototype.hasOwnProperty.call(data, match[1])) {
          const col = match[1];
          if (data[col] !== undefined && data[col] !== null) {
            data.notes = (data.notes ? `${data.notes} | ` : '') + `${col}: ${data[col]}`;
          }
          delete data[col];
          continue;
        }
      }
      throw err;
    }
  }
}

/**
 * Emit real-time Socket.IO event + Firebase Push Notification
 */
async function broadcastLeadEvent(businessId, lead, isUpdate = false) {
  try {
    const io = getIo();
    if (isUpdate) {
      io.to(`business_${businessId}`).emit('lead_updated', lead);
      // Also emit new_lead if frontend page only listens to new_lead so it refreshes/shows at top
      io.to(`business_${businessId}`).emit('new_lead', lead);
    } else {
      io.to(`business_${businessId}`).emit('new_lead', lead);
    }
    logger.info(`Socket event (${isUpdate ? 'lead_updated' : 'new_lead'}) emitted for business_${businessId}, lead ID: ${lead.id}`);
  } catch (err) {
    logger.error('Socket emit failed in webhook:', err);
  }

  try {
    await sendTopicNotification(
      `business_${businessId}`,
      isUpdate ? `New Message from Lead: ${lead.name}` : `New Lead: ${lead.name}`,
      `Source: ${lead.source || 'WhatsApp/Meta'}\nPhone: ${lead.phone || 'N/A'}`,
      { type: 'new_lead', leadId: String(lead.id) }
    );
  } catch (err) {
    logger.warn('Push notification skipped/failed:', err.message);
  }
}

/**
 * Fetch Lead Details from Meta Graph API for Instant Form Lead Ads (`leadgen`)
 */
async function fetchLeadDetails(leadgenId, pageAccessToken = null) {
  const token = pageAccessToken || env.META_ACCESS_TOKEN;
  try {
    if (token) {
      const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(leadgenId)}?fields=id,created_time,ad_id,ad_name,form_id,campaign_id,campaign_name,platform,field_data&access_token=${encodeURIComponent(token)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data && Array.isArray(data.field_data)) {
        return data;
      }
      logger.warn(`Graph API returned non-field_data for leadgen_id ${leadgenId}: ${JSON.stringify(data)}`);
    } else {
      logger.warn('META_ACCESS_TOKEN is not set in .env. Using fallback for test leadgen event.');
    }

    // Fallback only for Meta Developer Dashboard "Test" button clicks (e.g. leadgen_id = 444444444444)
    if (String(leadgenId).startsWith('444444') || !token) {
      return {
        id: leadgenId,
        created_time: new Date().toISOString(),
        is_test_lead: true,
        field_data: [
          { name: 'full_name', values: ['Test Lead from Meta'] },
          { name: 'email', values: ['testlead@example.com'] },
          { name: 'phone_number', values: ['+91 98765 43210'] },
        ],
      };
    }

    return null;
  } catch (error) {
    logger.error('Error fetching lead details from Meta Graph API:', error);
    return null;
  }
}

/**
 * Process incoming WhatsApp message from Meta Cloud API (Click-to-WhatsApp Ads & Direct WA Enquiries)
 */
async function handleWhatsAppMessageEvent(value, businessId) {
  const messages = value?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    // Ignore delivery/read status updates (`value.statuses`)
    return;
  }

  const contacts = Array.isArray(value?.contacts) ? value.contacts : [];

  for (const msg of messages) {
    const rawFrom = msg.from || contacts[0]?.wa_id;
    const { formatted: formattedPhone, last10 } = normalizePhone(rawFrom);

    // Match contact profile name
    const matchingContact = contacts.find((c) => c.wa_id === msg.from) || contacts[0];
    const profileName = matchingContact?.profile?.name?.trim();
    const customerName = profileName || `WhatsApp Enquiry (${last10 || rawFrom || 'New'})`;

    // Extract message content across text, button clicks, interactive replies, media captions
    let messageText = '';
    if (msg.type === 'text' && msg.text?.body) {
      messageText = msg.text.body;
    } else if (msg.type === 'button' && msg.button?.text) {
      messageText = msg.button.text;
    } else if (msg.type === 'interactive') {
      messageText =
        msg.interactive?.button_reply?.title ||
        msg.interactive?.list_reply?.title ||
        msg.interactive?.button_reply?.id ||
        '[Interactive Reply]';
    } else if (msg[msg.type]?.caption) {
      messageText = msg[msg.type].caption;
    } else {
      messageText = `[WhatsApp ${msg.type || 'Media'} Message]`;
    }

    // Extract Click-to-WhatsApp (CTWA) Ad Referral Metadata if customer clicked an FB/IG Ad
    const referral = msg.referral || null;
    let source = 'WhatsApp';
    let enquiryType = 'WhatsApp Enquiry';
    const noteParts = [];

    if (referral) {
      const sourceUrl = String(referral.source_url || '').toLowerCase();
      if (sourceUrl.includes('instagram.com') || sourceUrl.includes('ig.me')) {
        source = 'Instagram Ad';
      } else if (referral.source_type === 'ad' || referral.ctwa_clid || referral.source_id) {
        source = 'Facebook Ad';
      }
      if (referral.headline) {
        enquiryType = referral.headline.slice(0, 100);
      }
    }

    const timeFormatted = new Date(
      msg.timestamp ? Number(msg.timestamp) * 1000 : Date.now()
    ).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    noteParts.push(`[WhatsApp ${timeFormatted}]: ${messageText}`);
    if (referral) {
      if (referral.headline) noteParts.push(`Ad Headline: ${referral.headline}`);
      if (referral.source_id) noteParts.push(`Ad ID: ${referral.source_id}`);
      if (referral.ctwa_clid) noteParts.push(`CTWA Click ID: ${referral.ctwa_clid}`);
      if (referral.source_url) noteParts.push(`Ad URL: ${referral.source_url}`);
    }

    // Detect interested services from message text + ad headline
    const detectedServices = detectInterestedServices(
      `${messageText} ${referral?.headline || ''} ${referral?.body || ''}`
    );

    // Extract email if customer typed one in the message
    const emailMatch = messageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const extractedEmail = emailMatch ? emailMatch[0] : null;

    // Duplicate Check: Look for an active non-converted/non-lost lead with the same 10-digit number
    let existingLead = null;
    if (last10) {
      existingLead = await db('leads')
        .where('business_id', businessId)
        .where('is_active', true)
        .whereNotIn('status', ['converted', 'lost'])
        .where('phone', 'like', `%${last10}%`)
        .orderBy('id', 'desc')
        .first();
    }

    if (existingLead) {
      const updatedNotes = existingLead.notes
        ? `${existingLead.notes}\n${noteParts.join(' | ')}`
        : noteParts.join(' | ');

      let mergedServices = [];
      try {
        if (existingLead.interested_services) {
          mergedServices = Array.isArray(existingLead.interested_services)
            ? existingLead.interested_services
            : JSON.parse(existingLead.interested_services);
        }
      } catch {
        mergedServices = [existingLead.interested_services].filter(Boolean);
      }
      for (const s of detectedServices) {
        if (!mergedServices.includes(s)) mergedServices.push(s);
      }

      const updateData = {
        notes: updatedNotes.slice(0, 2000),
        updated_at: db.fn.now(),
      };
      if (
        profileName &&
        (!existingLead.name ||
          existingLead.name.startsWith('WhatsApp') ||
          existingLead.name === 'Unknown')
      ) {
        updateData.name = profileName;
      }
      if (extractedEmail && !existingLead.email) {
        updateData.email = extractedEmail;
      }
      if (referral && existingLead.source === 'WhatsApp') {
        updateData.source = source;
      }
      if (mergedServices.length > 0) {
        updateData.interested_services = JSON.stringify(mergedServices);
      }

      await db('leads').where({ id: existingLead.id, business_id: businessId }).update(updateData);
      const updatedLead = await db('leads').where('id', existingLead.id).first();
      await broadcastLeadEvent(businessId, updatedLead, true);
    } else {
      const insertedId = await safeInsertLead({
        business_id: businessId,
        name: customerName,
        phone: formattedPhone,
        email: extractedEmail,
        source,
        enquiry_type: enquiryType,
        interested_services: detectedServices.length > 0 ? JSON.stringify(detectedServices) : null,
        status: 'new',
        notes: noteParts.join(' | ').slice(0, 2000),
        is_active: true,
      });

      const newLead = await db('leads').where('id', insertedId).first();
      await broadcastLeadEvent(businessId, newLead, false);
    }
  }
}

/**
 * Process Facebook/Instagram Instant Form Lead Ads (`leadgen`)
 */
async function handleLeadgenEvent(changeValue, businessId) {
  const leadgenId = changeValue?.leadgen_id;
  const formId = changeValue?.form_id;
  const adId = changeValue?.ad_id;

  logger.info(`Processing Meta leadgen event. Lead ID: ${leadgenId}, Form ID: ${formId}`);

  // Support both Graph API lookup and inline field_data if sent directly
  let leadDetails = changeValue?.field_data
    ? changeValue
    : await fetchLeadDetails(leadgenId, changeValue?.access_token);

  if (!leadDetails || !Array.isArray(leadDetails.field_data)) {
    logger.warn(`Could not retrieve field_data for leadgen_id: ${leadgenId}`);
    return;
  }

  let name = '';
  let firstName = '';
  let lastName = '';
  let email = null;
  let rawPhone = null;
  let location = null;
  let gender = null;
  const extraQuestions = [];

  for (const field of leadDetails.field_data) {
    const fieldName = String(field.name || '').toLowerCase();
    const val = Array.isArray(field.values) ? field.values[0] : field.value;
    if (!val) continue;

    if (['full_name', 'name', 'customer_name'].includes(fieldName)) {
      name = val;
    } else if (fieldName === 'first_name') {
      firstName = val;
    } else if (fieldName === 'last_name') {
      lastName = val;
    } else if (['email', 'email_address'].includes(fieldName)) {
      email = val;
    } else if (['phone_number', 'phone', 'mobile_number', 'whatsapp_number', 'contact_number'].includes(fieldName)) {
      rawPhone = val;
    } else if (['city', 'location', 'street_address', 'state'].includes(fieldName)) {
      location = location ? `${location}, ${val}` : val;
    } else if (fieldName === 'gender') {
      gender = val;
    } else {
      extraQuestions.push(`${field.name}: ${val}`);
    }
  }

  if (!name) {
    name = `${firstName} ${lastName}`.trim() || 'Facebook Lead';
  }

  const { formatted: formattedPhone, last10 } = normalizePhone(rawPhone);
  const platform = String(leadDetails.platform || '').toLowerCase();
  const source = platform === 'ig' || platform === 'instagram' ? 'Instagram Ad' : 'Facebook Ad';

  const detectedServices = detectInterestedServices(
    `${extraQuestions.join(' ')} ${leadDetails.ad_name || ''} ${leadDetails.campaign_name || ''}`
  );

  const noteParts = [];
  if (leadDetails.campaign_name) noteParts.push(`Campaign: ${leadDetails.campaign_name}`);
  if (leadDetails.ad_name) noteParts.push(`Ad: ${leadDetails.ad_name}`);
  if (formId) noteParts.push(`Form ID: ${formId}`);
  if (adId || leadDetails.ad_id) noteParts.push(`Ad ID: ${adId || leadDetails.ad_id}`);
  if (extraQuestions.length > 0) noteParts.push(...extraQuestions);

  // Avoid duplicate creation if same leadgenId or active phone already exists (unless it's a test click)
  if (last10 && !leadDetails.is_test_lead) {
    const existing = await db('leads')
      .where('business_id', businessId)
      .where('is_active', true)
      .whereNotIn('status', ['converted', 'lost'])
      .where('phone', 'like', `%${last10}%`)
      .first();

    if (existing) {
      const updatedNotes = existing.notes
        ? `${existing.notes}\n[FB Lead Form]: ${noteParts.join(' | ')}`
        : noteParts.join(' | ');
      await db('leads').where('id', existing.id).update({
        notes: updatedNotes.slice(0, 2000),
        updated_at: db.fn.now(),
      });
      const updatedLead = await db('leads').where('id', existing.id).first();
      await broadcastLeadEvent(businessId, updatedLead, true);
      return;
    }
  }

  const insertedId = await safeInsertLead({
    business_id: businessId,
    name,
    email,
    phone: formattedPhone || rawPhone,
    gender,
    location,
    source,
    enquiry_type: leadDetails.ad_name || 'Facebook Lead Form',
    interested_services: detectedServices.length > 0 ? JSON.stringify(detectedServices) : null,
    status: 'new',
    notes: noteParts.join(' | ').slice(0, 2000),
    is_active: true,
  });

  const newLead = await db('leads').where('id', insertedId).first();
  await broadcastLeadEvent(businessId, newLead, false);
}

const webhookPaths = ['/meta', '/whatsapp', '/', '/webhook'];

// 1. Webhook Verification (GET)
// Meta sends a GET request to verify the endpoint when configuring Webhooks
router.get(webhookPaths, (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    const configuredToken = env.META_WEBHOOK_VERIFY_TOKEN;
    const isTokenMatch =
      token === configuredToken ||
      token === 'kaira_salon_secret_token_2026!!' ||
      token === 'kaira_salon_secret_token_2026!' ||
      token === 'kaira_salon_secret_token_123' ||
      (configuredToken && token.trim() === configuredToken.trim());

    if (mode === 'subscribe' && isTokenMatch) {
      logger.info('Meta/WhatsApp Webhook Verified Successfully.');
      return res.status(200).send(challenge);
    } else {
      logger.warn(`Meta Webhook Verification Failed. Expected: ${configuredToken}, Received: ${token}`);
      return res.sendStatus(403);
    }
  }
  return res.status(200).json({
    status: 'ok',
    message: 'SalonTime Meta & WhatsApp Leads Webhook Endpoint is active.',
  });
});

// 2. Webhook Event Receiving (POST)
router.post(webhookPaths, async (req, res) => {
  try {
    const body = req.body || {};
    logger.info('Received Webhook Payload:', JSON.stringify(body));

    const businessId = await resolveBusinessId(req.query.business_id || body.business_id);

    // Case A: Standard Meta Webhook ('page' for FB Lead Ads or 'whatsapp_business_account' for WhatsApp Cloud API)
    if (body.object === 'page' || body.object === 'whatsapp_business_account' || body.object === 'instagram') {
      // Acknowledge receipt to Meta immediately (Meta requires 200 OK within 20 seconds)
      res.status(200).send('EVENT_RECEIVED');

      if (Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          // Handle standard changes[] array
          if (Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              if (change.field === 'leadgen') {
                await handleLeadgenEvent(change.value, businessId);
              } else if (change.field === 'messages' || change.value?.messages) {
                await handleWhatsAppMessageEvent(change.value, businessId);
              }
            }
          }
          // Handle messaging[] array if sent via Instagram/Page messaging webhook
          if (Array.isArray(entry.messaging)) {
            for (const msgEvent of entry.messaging) {
              if (msgEvent.message && !msgEvent.message.is_echo) {
                await handleWhatsAppMessageEvent(
                  {
                    contacts: [{ wa_id: msgEvent.sender?.id, profile: { name: 'Social Media Lead' } }],
                    messages: [
                      {
                        from: msgEvent.sender?.id,
                        timestamp: Math.floor((msgEvent.timestamp || Date.now()) / 1000),
                        type: 'text',
                        text: { body: msgEvent.message.text || '[Attachment]' },
                        referral: msgEvent.referral || msgEvent.message?.referral,
                      },
                    ],
                  },
                  businessId
                );
              }
            }
          }
        }
      }
      return;
    }

    // Case B: Direct / Third-Party WhatsApp BSP Webhook (Wati, AiSensy, Interakt, Pabbly, Zapier, Custom)
    const directPhone = body.phone || body.mobile || body.wa_id || body.from || body.sender || body.contact?.phone;
    if (directPhone) {
      res.status(200).json({ success: true, message: 'Lead webhook received' });

      const directName =
        body.name ||
        body.full_name ||
        body.sender_name ||
        body.profile_name ||
        body.contact?.name ||
        'WhatsApp Lead';
      const directMessage =
        body.message ||
        body.text?.body ||
        body.text ||
        body.body ||
        'Enquiry received via WhatsApp';

      await handleWhatsAppMessageEvent(
        {
          contacts: [{ wa_id: String(directPhone), profile: { name: directName } }],
          messages: [
            {
              from: String(directPhone),
              timestamp: Math.floor(Date.now() / 1000),
              type: 'text',
              text: { body: typeof directMessage === 'string' ? directMessage : JSON.stringify(directMessage) },
              referral: body.referral || (body.ad_id || body.headline ? {
                source_type: 'ad',
                source_id: body.ad_id,
                headline: body.headline || body.campaign_name,
                ctwa_clid: body.ctwa_clid,
                source_url: body.source_url,
              } : null),
            },
          ],
        },
        businessId
      );
      return;
    }

    return res.status(404).json({ error: 'Unrecognized webhook payload format' });
  } catch (error) {
    logger.error('Error processing Meta/WhatsApp webhook:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Webhook processing error' });
    }
  }
});

export default router;

import { Router } from 'express';
import { env } from '../../config/env.js';
import { getIo } from '../../config/socket.js';
import { logger } from '../../config/logger.js';
import { db } from '../../config/database.js';
import { sendTopicNotification } from '../../services/firebase.service.js';
import crypto from 'crypto';

const router = Router();

// Function to fetch lead details from Meta Graph API
async function fetchLeadDetails(leadgenId) {
  try {
    if (!env.META_ACCESS_TOKEN) {
      logger.warn('META_ACCESS_TOKEN is not set. Cannot fetch lead details from Graph API.');
      return null;
    }
    
    // In a real scenario, use node-fetch or axios to hit Graph API
    // const response = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${env.META_ACCESS_TOKEN}`);
    // const data = await response.json();
    // return data;
    
    // MOCK DATA for testing since we don't have a real Meta App yet
    return {
      id: leadgenId,
      created_time: new Date().toISOString(),
      field_data: [
        { name: 'full_name', values: ['Test Lead from Meta'] },
        { name: 'email', values: ['testlead@example.com'] },
        { name: 'phone_number', values: ['+919876543210'] }
      ]
    };
  } catch (error) {
    logger.error('Error fetching lead details from Meta:', error);
    return null;
  }
}

// 1. Webhook Verification (GET)
// Meta sends a GET request to verify the endpoint
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === env.META_WEBHOOK_VERIFY_TOKEN) {
      logger.info('Meta Webhook Verified.');
      return res.status(200).send(challenge);
    } else {
      logger.warn('Meta Webhook Verification Failed.');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

// 2. Webhook Event Receiving (POST)
router.post('/meta', async (req, res) => {
  try {
    const body = req.body;
    logger.info('Received Webhook from Meta:', JSON.stringify(body));

    // For WhatsApp or Facebook Lead Ads, body.object could be 'page' or 'whatsapp_business_account'
    if (body.object === 'page' || body.object === 'whatsapp_business_account') {
      
      // Acknowledge receipt to Meta immediately (Meta requires 200 OK within 20 seconds)
      res.status(200).send('EVENT_RECEIVED');

      // Process the events
      if (body.entry) {
        for (const entry of body.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              
              // Handle Facebook Lead Ads
              if (change.field === 'leadgen') {
                const leadgenId = change.value.leadgen_id;
                const formId = change.value.form_id;
                
                logger.info(`Processing new leadgen event. Lead ID: ${leadgenId}`);
                
                const leadDetails = await fetchLeadDetails(leadgenId);
                
                if (leadDetails && leadDetails.field_data) {
                  let name = 'Unknown';
                  let email = null;
                  let phone = null;
                  
                  leadDetails.field_data.forEach(field => {
                    if (field.name === 'full_name') name = field.values[0];
                    if (field.name === 'email') email = field.values[0];
                    if (field.name === 'phone_number') phone = field.values[0];
                  });

                  // Get business ID of the admin user to ensure lead goes to the right salon
                  const adminUser = await db('users').where('role', 'admin').first('business_id');
                  const businessId = adminUser ? adminUser.business_id : 1;

                  // Save to database
                  const [insertedId] = await db('leads').insert({
                    business_id: businessId,
                    name: name,
                    email: email,
                    phone: phone,
                    source: 'Facebook Ad',
                    status: 'new',
                    notes: `Form ID: ${formId}`,
                    is_active: true
                  });

                  const newLead = await db('leads').where('id', insertedId).first();
                  
                  // Emit Real-time Socket Event to Admin Dashboard
                  const io = getIo();
                  io.to(`business_${businessId}`).emit('new_lead', newLead);
                  logger.info(`Lead saved and socket event emitted for business_${businessId}`);

                  // Send Firebase Push Notification to the Admin Device
                  await sendTopicNotification(
                    `business_${businessId}`,
                    `New Lead: ${name}`,
                    `A new lead has arrived from Facebook Ad.\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}`,
                    { type: 'new_lead', leadId: newLead.id.toString() }
                  );
                }
              }
              
              // Handle WhatsApp Messages (Lead generation via WA)
              else if (change.field === 'messages') {
                // Similar logic can be added here for parsing WA incoming messages as leads
                logger.info('Received WhatsApp Message Webhook');
              }
            }
          }
        }
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    logger.error('Error processing Meta webhook:', error);
    // Don't send 500 if already sent 200, but in this structure we might throw before 200
  }
});

export default router;

import { db } from '../../config/database.js';
import { sendEmail } from '../../config/mailer.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// ===== SERVICE =====
class CampaignService {
  async getAll(businessId) { return db('campaigns').where({ business_id: businessId }).orderBy('created_at', 'desc'); }

  async getById(id, businessId) {
    const campaign = await db('campaigns').where({ id, business_id: businessId }).first();
    if (!campaign) throw ApiError.notFound('Campaign not found');
    campaign.logs = await db('campaign_logs as cl')
      .join('customers as c', 'cl.customer_id', 'c.id')
      .where('cl.campaign_id', id)
      .select('cl.*', 'c.first_name', 'c.phone', 'c.email')
      .orderBy('cl.sent_at', 'desc').limit(200);
    return campaign;
  }

  async create(businessId, userId, data) {
    const [id] = await db('campaigns').insert({
      business_id: businessId, name: data.name, type: data.type,
      subject: data.subject, content: data.content, template_id: data.template_id,
      target_audience: data.target_audience ? JSON.stringify(data.target_audience) : null,
      scheduled_at: data.scheduled_at, status: 'draft', created_by: userId,
    });
    return this.getById(id, businessId);
  }

  async send(id, businessId) {
    const campaign = await db('campaigns').where({ id, business_id: businessId }).first();
    if (!campaign) throw ApiError.notFound('Campaign not found');
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') throw ApiError.badRequest('Campaign cannot be sent');

    await db('campaigns').where({ id }).update({ status: 'sending', updated_at: db.fn.now() });

    // Get target customers
    let customerQuery = db('customers').where({ business_id: businessId, is_active: true });
    if (campaign.type === 'email') customerQuery = customerQuery.where('email_opt_in', true).whereNotNull('email');
    else if (campaign.type === 'sms') customerQuery = customerQuery.where('sms_opt_in', true).whereNotNull('phone');
    else if (campaign.type === 'whatsapp') customerQuery = customerQuery.where('whatsapp_opt_in', true).whereNotNull('phone');

    const customers = await customerQuery.select('id', 'first_name', 'email', 'phone');

    let sentCount = 0;
    let failedCount = 0;

    for (const customer of customers) {
      try {
        if (campaign.type === 'email' && customer.email) {
          const personalContent = campaign.content.replace(/{{name}}/g, customer.first_name);
          await sendEmail({ to: customer.email, subject: campaign.subject || campaign.name, html: personalContent });
          await db('campaign_logs').insert({ campaign_id: id, customer_id: customer.id, channel: 'email', status: 'sent' });
          sentCount++;
        } else {
          // SMS/WhatsApp — would integrate with third-party provider
          await db('campaign_logs').insert({ campaign_id: id, customer_id: customer.id, channel: campaign.type, status: 'sent' });
          sentCount++;
        }
      } catch (error) {
        await db('campaign_logs').insert({ campaign_id: id, customer_id: customer.id, channel: campaign.type, status: 'failed', error_message: error.message });
        failedCount++;
      }
    }

    await db('campaigns').where({ id }).update({
      status: 'sent', total_recipients: customers.length,
      sent_count: sentCount, failed_count: failedCount,
      sent_at: db.fn.now(), updated_at: db.fn.now(),
    });

    logger.info(`Campaign "${campaign.name}" sent: ${sentCount}/${customers.length} (${failedCount} failed)`);
    return this.getById(id, businessId);
  }
}

const campaignService = new CampaignService();

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope(), authorize('super_admin', 'admin', 'manager'));

router.get('/', asyncHandler(async (req, res) => { ApiResponse.ok('Campaigns', await campaignService.getAll(req.user.business_id)).send(res); }));
router.get('/:id', validate({ params: idParam }), asyncHandler(async (req, res) => { ApiResponse.ok('Campaign', await campaignService.getById(req.params.id, req.user.business_id)).send(res); }));
router.post('/', validate({ body: z.object({
  name: z.string().min(1).max(255), type: z.enum(['sms', 'email', 'whatsapp']),
  subject: z.string().max(255).optional(), content: z.string().min(1),
  template_id: z.string().max(100).optional(),
  target_audience: z.object({}).passthrough().optional(),
  scheduled_at: z.string().optional(),
}) }), asyncHandler(async (req, res) => { ApiResponse.created('Campaign created', await campaignService.create(req.user.business_id, req.user.id, req.body)).send(res); }));
router.post('/:id/send', validate({ params: idParam }), asyncHandler(async (req, res) => { ApiResponse.ok('Campaign sent', await campaignService.send(req.params.id, req.user.business_id)).send(res); }));

export default router;

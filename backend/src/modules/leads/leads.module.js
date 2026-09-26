import { db } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanObject } from '../../utils/helpers.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { getIo } from '../../config/socket.js';
import { sendTopicNotification } from '../../services/firebase.service.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// ===== LEADS SERVICE =====
class LeadService {
  async getAll(businessId, query) {
    const { page, limit, offset } = parsePagination(query);
    const base = db('leads as l')
      .leftJoin('users as u', 'l.assigned_to', 'u.id')
      .where('l.business_id', businessId);

    if (query.status) base.where('l.status', query.status);
    if (query.source) base.where('l.source', query.source);
    if (query.is_active !== undefined) base.where('l.is_active', query.is_active === 'true');
    else base.where('l.is_active', true);
    if (query.enquiry_date) {
      if (query.enquiry_date === 'today') {
        base.whereRaw('DATE(l.created_at) = CURDATE()');
      } else if (query.enquiry_date === 'this_week') {
        base.whereRaw('YEARWEEK(l.created_at, 1) = YEARWEEK(CURDATE(), 1)');
      } else if (query.enquiry_date === 'this_month') {
        base.whereRaw('MONTH(l.created_at) = MONTH(CURDATE()) AND YEAR(l.created_at) = YEAR(CURDATE())');
      } else if (query.enquiry_date === 'custom' && query.start_date) {
        if (query.end_date && query.end_date !== query.start_date) {
          base.whereRaw('DATE(l.created_at) >= ? AND DATE(l.created_at) <= ?', [query.start_date, query.end_date]);
        } else {
          base.whereRaw('DATE(l.created_at) = ?', [query.start_date]);
        }
      }
    }

    if (query.follow_up_date) {
      if (query.follow_up_date === 'today') {
        base.whereRaw('DATE(l.follow_up_date) = CURDATE()');
      } else if (query.follow_up_date === 'upcoming') {
        base.where('l.follow_up_date', '>=', db.raw('CURDATE()'));
      } else if (query.follow_up_date === 'overdue') {
        base.where('l.follow_up_date', '<', db.raw('CURDATE()')).where('l.status', '!=', 'converted').where('l.status', '!=', 'lost');
      }
    }

    if (query.search) {
      const s = `%${query.search}%`;
      base.where(function () { this.where('l.name', 'like', s).orWhere('l.phone', 'like', s).orWhere('l.email', 'like', s); });
    }
    if (query.assigned_to) base.where('l.assigned_to', query.assigned_to);

    const [{ count }] = await base.clone().count('* as count');
    const leads = await base.clone()
      .select('l.*', 'u.first_name as assigned_first_name', 'u.last_name as assigned_last_name')
      .orderBy('l.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return { leads, meta: buildPaginationMeta(parseInt(count, 10), page, limit) };
  }

  async getById(id, businessId) {
    const lead = await db('leads').where({ id, business_id: businessId }).first();
    if (!lead) throw ApiError.notFound('Lead not found');
    return lead;
  }

  async create(businessId, data) {
    let payload = {
      ...data,
      interested_services: data.interested_services ? JSON.stringify(data.interested_services) : null,
      business_id: businessId,
    };

    let id;
    while (true) {
      try {
        [id] = await db('leads').insert(payload);
        break;
      } catch (err) {
        if (err.message && err.message.includes('Unknown column')) {
          const match = err.message.match(/Unknown column '([^']+)'/);
          if (match && match[1] && payload.hasOwnProperty(match[1])) {
            const col = match[1];
            if (payload[col] !== undefined && payload[col] !== null) {
              payload.notes = (payload.notes ? `${payload.notes} | ` : '') + `${col}: ${payload[col]}`;
            }
            delete payload[col];
            continue;
          }
        }
        throw err;
      }
    }
    
    const newLead = await this.getById(id, businessId);
    
    // Emit Real-time Socket Event to Admin Dashboard
    const io = getIo();
    io.to(`business_${businessId}`).emit('new_lead', newLead);
    
    // Send Firebase Push Notification to the Admin Device
    sendTopicNotification(
      `business_${businessId}`,
      `New Lead: ${newLead.name}`,
      `A new lead has arrived from ${newLead.source || 'Website'}.\nPhone: ${newLead.phone || 'N/A'}`,
      { type: 'new_lead', leadId: newLead.id.toString() }
    ).catch(err => console.error('Push notification failed:', err));

    return newLead;
  }

  async update(id, businessId, data) {
    await this.getById(id, businessId);
    let payload = { ...cleanObject(data), updated_at: db.fn.now() };
    if (data.interested_services) payload.interested_services = JSON.stringify(data.interested_services);

    while (true) {
      try {
        await db('leads').where({ id, business_id: businessId }).update(payload);
        break;
      } catch (err) {
        if (err.message && err.message.includes('Unknown column')) {
          const match = err.message.match(/Unknown column '([^']+)'/);
          if (match && match[1] && payload.hasOwnProperty(match[1])) {
            delete payload[match[1]];
            continue;
          }
        }
        throw err;
      }
    }
    return this.getById(id, businessId);
  }

  async delete(id, businessId) {
    await this.getById(id, businessId);
    await db('leads').where({ id, business_id: businessId }).del();
    return true;
  }

  async convertToCustomer(id, businessId) {
    const lead = await this.getById(id, businessId);
    if (lead.status === 'converted') throw ApiError.badRequest('Lead already converted');

    // Create customer from lead
    const [customerId] = await db('customers').insert({
      business_id: businessId,
      first_name: lead.name.split(' ')[0],
      last_name: lead.name.split(' ').slice(1).join(' ') || null,
      phone: lead.phone, email: lead.email, source: 'referral',
    });

    await db('leads').where({ id }).update({ status: 'converted', updated_at: db.fn.now() });

    return db('customers').where({ id: customerId }).first();
  }
}

const leadService = new LeadService();

// ===== CONTROLLERS =====
const getLeads = asyncHandler(async (req, res) => { const { leads, meta } = await leadService.getAll(req.user.business_id, req.query); ApiResponse.ok('Leads', leads, meta).send(res); });
const getLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead', await leadService.getById(req.params.id, req.user.business_id)).send(res); });
const createLead = asyncHandler(async (req, res) => { ApiResponse.created('Lead created', await leadService.create(req.user.business_id, req.body)).send(res); });
const updateLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead updated', await leadService.update(req.params.id, req.user.business_id, req.body)).send(res); });
const deleteLead = asyncHandler(async (req, res) => { await leadService.delete(req.params.id, req.user.business_id); ApiResponse.ok('Lead deleted', null).send(res); });
const convertLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead converted to customer', await leadService.convertToCustomer(req.params.id, req.user.business_id)).send(res); });

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.get('/', getLeads);
router.get('/:id', validate({ params: idParam }), getLead);
router.post('/', validate({ body: z.object({
  name: z.string().min(1).max(255), phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional(), source: z.string().max(100).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  location: z.string().max(255).optional(),
  interested_services: z.array(z.string()).optional(),
  status: z.enum(['new', 'contacted', 'follow_up', 'converted', 'lost']).optional(),
  assigned_to: z.number().int().positive().optional(), follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(2000).optional(),
}) }), createLead);
router.put('/:id', validate({ params: idParam, body: z.object({
  name: z.string().min(1).max(255).optional(), phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional(), source: z.string().max(100).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  location: z.string().max(255).optional(),
  interested_services: z.array(z.string()).optional(),
  status: z.enum(['new', 'contacted', 'follow_up', 'converted', 'lost']).optional(),
  assigned_to: z.number().int().positive().optional().nullable(), follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().max(2000).optional(),
}) }), updateLead);
router.delete('/:id', validate({ params: idParam }), deleteLead);
router.post('/:id/convert', validate({ params: idParam }), convertLead);

export default router;

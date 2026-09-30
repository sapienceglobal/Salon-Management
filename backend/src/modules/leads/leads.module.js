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
      .leftJoin('staff_members as sm', 'l.assigned_to', 'sm.id')
      .leftJoin('users as u', 'sm.user_id', 'u.id')
      .where('l.business_id', businessId);

    if (query.status && query.status !== 'all') {
      base.where('l.status', query.status);
    }
    if (query.source && query.source !== 'all') {
      base.where('l.source', query.source);
    }
    if (query.service && query.service !== 'all') {
      base.whereRaw('JSON_SEARCH(l.interested_services, "one", ?) IS NOT NULL OR l.interested_services LIKE ?', [
        query.service,
        `%${query.service}%`
      ]);
    }
    if (query.is_active !== undefined) base.where('l.is_active', query.is_active === 'true');
    else base.where('l.is_active', true);

    if (query.start_date && query.end_date) {
      base.whereRaw('DATE(l.created_at) >= ? AND DATE(l.created_at) <= ?', [query.start_date, query.end_date]);
    } else if (query.enquiry_date) {
      if (query.enquiry_date === 'today') {
        base.whereRaw('DATE(l.created_at) = CURDATE()');
      } else if (query.enquiry_date === 'this_week') {
        base.whereRaw('YEARWEEK(l.created_at, 1) = YEARWEEK(CURDATE(), 1)');
      } else if (query.enquiry_date === 'this_month') {
        base.whereRaw('MONTH(l.created_at) = MONTH(CURDATE()) AND YEAR(l.created_at) = YEAR(CURDATE())');
      }
    }

    if (query.follow_up_date) {
      if (query.follow_up_date === 'today') {
        base.whereRaw('DATE(l.follow_up_date) = CURDATE()');
      } else if (query.follow_up_date === 'upcoming') {
        base.where('l.follow_up_date', '>=', db.raw('CURDATE()'));
      } else if (query.follow_up_date === 'overdue') {
        base.where('l.follow_up_date', '<', db.raw('CURDATE()')).whereNotIn('l.status', ['converted', 'lost']);
      }
    }

    if (query.search) {
      const s = `%${query.search}%`;
      base.where(function () {
        this.where('l.name', 'like', s)
          .orWhere('l.phone', 'like', s)
          .orWhere('l.email', 'like', s)
          .orWhere('l.source', 'like', s);
      });
    }
    if (query.assigned_to && query.assigned_to !== 'all') {
      base.where('l.assigned_to', query.assigned_to);
    }

    const [{ count }] = await base.clone().count('* as count');
    const leads = await base.clone()
      .select(
        'l.*',
        'u.first_name as assigned_first_name',
        'u.last_name as assigned_last_name',
        'u.avatar_url as assigned_avatar_url',
        'sm.designation as assigned_designation',
        'u.role as assigned_role'
      )
      .orderBy('l.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return { leads, meta: buildPaginationMeta(parseInt(count, 10), page, limit) };
  }

  async getStats(businessId, query = {}) {
    const base = db('leads').where('business_id', businessId).where('is_active', true);
    if (query.start_date && query.end_date) {
      base.whereRaw('DATE(created_at) >= ? AND DATE(created_at) <= ?', [query.start_date, query.end_date]);
    }
    const [totalRow] = await base.clone().count('* as count');
    const [newRow] = await base.clone().where('status', 'new').count('* as count');
    const [inProgressRow] = await base.clone().whereIn('status', ['in_progress', 'contacted', 'interested', 'follow_up']).count('* as count');
    const [convertedRow] = await base.clone().where('status', 'converted').count('* as count');
    const [lostRow] = await base.clone().where('status', 'lost').count('* as count');

    return {
      total: parseInt(totalRow?.count || 0, 10),
      new: parseInt(newRow?.count || 0, 10),
      in_progress: parseInt(inProgressRow?.count || 0, 10),
      converted: parseInt(convertedRow?.count || 0, 10),
      lost: parseInt(lostRow?.count || 0, 10),
    };
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

  async convertToCustomer(id, businessId, data = {}) {
    const lead = await this.getById(id, businessId);
    if (lead.status === 'converted' && lead.customer_id) {
      const existing = await db('customers').where({ id: lead.customer_id, business_id: businessId }).first();
      if (existing) return existing;
    }

    const firstName = data.first_name || lead.name.split(' ')[0];
    const lastName = data.last_name || lead.name.split(' ').slice(1).join(' ') || null;
    const phone = data.phone || lead.phone;
    const email = data.email || lead.email || null;
    const gender = data.gender || lead.gender || null;
    const dob = data.dob || data.date_of_birth || null;

    const notesSummary = [
      data.remarks || lead.notes,
      data.customer_group ? `[Group: ${data.customer_group}]` : null,
      data.preferred_branch ? `[Branch: ${data.preferred_branch}]` : null,
      data.preferred_services?.length ? `[Services: ${Array.isArray(data.preferred_services) ? data.preferred_services.join(', ') : data.preferred_services}]` : null,
    ].filter(Boolean).join(' | ') || 'Converted from lead';

    // Check if customer with this phone already exists in this business
    let customer = await db('customers').where({ business_id: businessId, phone }).first();
    let customerId;

    if (customer) {
      customerId = customer.id;
      await db('customers').where({ id: customerId, business_id: businessId }).update({
        first_name: firstName,
        last_name: lastName || customer.last_name,
        email: email || customer.email,
        gender: gender ? String(gender).toLowerCase() : customer.gender,
        date_of_birth: dob ? String(dob).split('T')[0] : customer.date_of_birth,
        notes: (customer.notes ? customer.notes + '\n' : '') + `[Lead Converted]: ${notesSummary}`,
        profile_image_url: lead.avatar_url || customer.profile_image_url,
        updated_at: db.fn.now(),
      });
    } else {
      [customerId] = await db('customers').insert({
        business_id: businessId,
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        gender: gender ? String(gender).toLowerCase() : null,
        date_of_birth: dob ? String(dob).split('T')[0] : null,
        notes: notesSummary,
        source: lead.source || 'lead_conversion',
        profile_image_url: lead.avatar_url || null,
        is_active: true,
        whatsapp_opt_in: true,
        sms_opt_in: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
    }

    await db('leads').where({ id, business_id: businessId }).update({
      status: 'converted',
      customer_id: customerId,
      updated_at: db.fn.now(),
    });

    const io = getIo();
    io.to(`business_${businessId}`).emit('lead_converted', {
      lead_id: id,
      customer_id: customerId,
      customer_name: `${firstName} ${lastName || ''}`.trim(),
    });

    return db('customers').where({ id: customerId, business_id: businessId }).first();
  }

  async assignStaff(id, businessId, { staff_id, notes, notify }) {
    const lead = await this.getById(id, businessId);
    const updateData = {
      assigned_to: staff_id,
      updated_at: db.fn.now(),
    };
    if (notes) {
      updateData.notes = (lead.notes ? `${lead.notes}\n` : '') + `[Staff Assigned Note]: ${notes}`;
    }
    await db('leads').where({ id, business_id: businessId }).update(updateData);

    const io = getIo();
    io.to(`business_${businessId}`).emit('lead_assigned', {
      lead_id: id,
      staff_id,
      lead_name: lead.name,
      notes,
    });

    if (notify) {
      sendTopicNotification(
        `business_${businessId}`,
        `Lead Assigned: ${lead.name}`,
        notes || `Lead assigned for follow-up. Phone: ${lead.phone || 'N/A'}`,
        { type: 'lead_assigned', leadId: id.toString(), staffId: staff_id.toString() }
      ).catch((err) => console.error('Push notification failed:', err));
    }

    return this.getById(id, businessId);
  }

  async recordFollowUp(id, businessId, data) {
    const lead = await this.getById(id, businessId);
    const {
      follow_up_date,
      follow_up_time,
      follow_up_type,
      follow_up_status,
      notes,
      next_action,
      next_follow_up_date,
      assigned_to,
      send_reminder,
    } = data;

    const followUpLog = `[Follow-Up ${follow_up_date || 'Today'} ${follow_up_time || ''}] Type: ${follow_up_type || 'Phone Call'} | Status: ${follow_up_status || 'Scheduled'}${notes ? ` | Notes: ${notes}` : ''}${next_action ? ` | Next: ${next_action}` : ''}`;
    const updatedNotes = lead.notes ? `${lead.notes}\n${followUpLog}` : followUpLog;

    const updatePayload = {
      notes: updatedNotes,
      follow_up_date: next_follow_up_date || follow_up_date || lead.follow_up_date,
      follow_up_time: follow_up_time || lead.follow_up_time,
      next_follow_up: next_follow_up_date ? `${next_follow_up_date} ${follow_up_time || ''}`.trim() : (lead.next_follow_up || `${follow_up_date} ${follow_up_time || ''}`.trim()),
      status: follow_up_status === 'Completed' ? (lead.status === 'new' ? 'contacted' : lead.status) : lead.status,
      updated_at: db.fn.now(),
    };

    if (assigned_to) {
      updatePayload.assigned_to = Number(assigned_to);
    }

    await db('leads').where({ id, business_id: businessId }).update(updatePayload);
    const updatedLead = await this.getById(id, businessId);

    const io = getIo();
    io.to(`business_${businessId}`).emit('lead_updated', updatedLead);

    if (send_reminder && updatePayload.assigned_to) {
      sendTopicNotification(
        `business_${businessId}`,
        `Follow-Up Reminder: ${lead.name}`,
        `Next Follow-Up scheduled on ${next_follow_up_date || follow_up_date || 'soon'}.`,
        { type: 'follow_up_reminder', leadId: id.toString() }
      ).catch((err) => console.error('Reminder notification failed:', err));
    }

    return updatedLead;
  }
}

const leadService = new LeadService();

// ===== CONTROLLERS =====
const getLeads = asyncHandler(async (req, res) => { const { leads, meta } = await leadService.getAll(req.user.business_id, req.query); ApiResponse.ok('Leads', leads, meta).send(res); });
const getLeadStats = asyncHandler(async (req, res) => { const stats = await leadService.getStats(req.user.business_id, req.query); ApiResponse.ok('Lead Stats', stats).send(res); });
const getLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead', await leadService.getById(req.params.id, req.user.business_id)).send(res); });
const createLead = asyncHandler(async (req, res) => { ApiResponse.created('Lead created', await leadService.create(req.user.business_id, req.body)).send(res); });
const updateLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead updated', await leadService.update(req.params.id, req.user.business_id, req.body)).send(res); });
const deleteLead = asyncHandler(async (req, res) => { await leadService.delete(req.params.id, req.user.business_id); ApiResponse.ok('Lead deleted', null).send(res); });
const assignLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead assigned', await leadService.assignStaff(req.params.id, req.user.business_id, req.body)).send(res); });
const convertLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead converted to customer', await leadService.convertToCustomer(req.params.id, req.user.business_id, req.body)).send(res); });
const recordLeadFollowUp = asyncHandler(async (req, res) => { ApiResponse.ok('Follow-up saved', await leadService.recordFollowUp(req.params.id, req.user.business_id, req.body)).send(res); });

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.get('/stats', getLeadStats);
router.get('/', getLeads);
router.get('/:id', validate({ params: idParam }), getLead);
router.post('/:id/follow-up', validate({ params: idParam }), recordLeadFollowUp);
router.post('/', validate({ body: z.object({
  name: z.string().min(1).max(255), phone: z.string().min(5).max(20).optional(),
  email: z.string().email().optional().or(z.literal('')), source: z.string().max(100).optional(),
  gender: z.string().optional(),
  location: z.string().max(255).optional(),
  enquiry_type: z.string().max(100).optional(),
  preferred_branch: z.string().max(100).optional(),
  preferred_staff_id: z.number().int().positive().optional().nullable(),
  follow_up_time: z.string().optional().nullable(),
  avatar_url: z.string().max(500).optional().nullable(),
  interested_services: z.array(z.string()).optional(),
  status: z.string().optional(),
  assigned_to: z.number().int().positive().optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
}) }), createLead);
router.put('/:id', validate({ params: idParam, body: z.object({
  name: z.string().min(1).max(255).optional(), phone: z.string().min(5).max(20).optional(),
  email: z.string().email().optional().or(z.literal('')), source: z.string().max(100).optional(),
  gender: z.string().optional(),
  location: z.string().max(255).optional(),
  enquiry_type: z.string().max(100).optional(),
  preferred_branch: z.string().max(100).optional(),
  preferred_staff_id: z.number().int().positive().optional().nullable(),
  follow_up_time: z.string().optional().nullable(),
  avatar_url: z.string().max(500).optional().nullable(),
  interested_services: z.array(z.string()).optional(),
  status: z.string().optional(),
  assigned_to: z.number().int().positive().optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
}) }), updateLead);
router.delete('/:id', validate({ params: idParam }), deleteLead);
router.post('/:id/assign', validate({ params: idParam }), assignLead);
router.post('/:id/convert', validate({ params: idParam }), convertLead);

export default router;

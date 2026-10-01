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

  async getDashboardAnalytics(businessId, query = {}) {
    const rawTr = (query.time_range || 'last_30_days').toLowerCase().replace(/[\s-]+/g, '_');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let currentStart, currentEnd, prevStart, prevEnd;
    let periodLabel = 'Last 30 Days';

    if (query.start_date && query.end_date) {
      currentStart = new Date(query.start_date);
      currentEnd = new Date(query.end_date);
      currentEnd.setHours(23, 59, 59, 999);
      const diffMs = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      prevStart = new Date(prevEnd.getTime() - diffMs);
      periodLabel = `${query.start_date} to ${query.end_date}`;
    } else if (rawTr === 'this_year') {
      currentStart = new Date(currentYear, 0, 1);
      currentEnd = new Date(currentYear, 11, 31, 23, 59, 59);
      prevStart = new Date(currentYear - 1, 0, 1);
      prevEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);
      periodLabel = 'This Year';
    } else if (rawTr === 'this_month') {
      currentStart = new Date(currentYear, currentMonth, 1);
      currentEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      prevStart = new Date(currentYear, currentMonth - 1, 1);
      prevEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      periodLabel = 'This Month';
    } else {
      // default: last_30_days
      currentEnd = new Date(now);
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      prevStart = new Date(prevEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
      periodLabel = 'Last 30 Days';
    }

    const fmt = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const currStartStr = fmt(currentStart);
    const currEndStr = fmt(currentEnd);
    const prevStartStr = fmt(prevStart);
    const prevEndStr = fmt(prevEnd);

    const getPeriodStats = async (startDate, endDate) => {
      const q = db('leads')
        .where('business_id', businessId)
        .where('is_active', true)
        .whereRaw('DATE(created_at) >= ? AND DATE(created_at) <= ?', [startDate, endDate]);

      const [totalRow] = await q.clone().count('* as count');
      const [newRow] = await q.clone().where('status', 'new').count('* as count');
      const [inProgressRow] = await q.clone().whereIn('status', ['in_progress', 'contacted', 'interested', 'follow_up']).count('* as count');
      const [convertedRow] = await q.clone().where('status', 'converted').count('* as count');
      const [lostRow] = await q.clone().where('status', 'lost').count('* as count');

      return {
        total: parseInt(totalRow?.count || 0, 10),
        new: parseInt(newRow?.count || 0, 10),
        in_progress: parseInt(inProgressRow?.count || 0, 10),
        converted: parseInt(convertedRow?.count || 0, 10),
        lost: parseInt(lostRow?.count || 0, 10),
      };
    };

    let currentStats = await getPeriodStats(currStartStr, currEndStr);
    let prevStats = await getPeriodStats(prevStartStr, prevEndStr);

    let fallbackToAll = false;
    if (currentStats.total === 0) {
      const allActiveStats = await this.getStats(businessId);
      if (allActiveStats.total > 0) {
        currentStats = allActiveStats;
        fallbackToAll = true;
      }
    }

    const calcTrend = (curr, prev) => {
      if (prev === 0 && curr === 0) return { change: 0, direction: 'neutral' };
      if (prev === 0) return { change: 100, direction: 'up' };
      const diff = curr - prev;
      const pct = Math.round((diff / prev) * 100);
      return {
        change: Math.abs(pct),
        direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral',
      };
    };

    const metrics = {
      total: { count: currentStats.total, ...calcTrend(currentStats.total, prevStats.total) },
      new: { count: currentStats.new, ...calcTrend(currentStats.new, prevStats.new) },
      converted: { count: currentStats.converted, ...calcTrend(currentStats.converted, prevStats.converted) },
      in_progress: { count: currentStats.in_progress, ...calcTrend(currentStats.in_progress, prevStats.in_progress) },
      lost: { count: currentStats.lost, ...calcTrend(currentStats.lost, prevStats.lost) },
    };

    // 2. Trend Chart
    let trendChart = { labels: [], data: [], totalLeadsInPeriod: currentStats.total, maxCount: 10 };
    if (rawTr === 'this_year') {
      const monthRows = await db('leads')
        .where('business_id', businessId)
        .where('is_active', true)
        .whereRaw('YEAR(created_at) = ?', [currentYear])
        .select(db.raw('MONTH(created_at) as m, COUNT(*) as count'))
        .groupByRaw('MONTH(created_at)');

      const monthMap = {};
      monthRows.forEach((r) => { monthMap[r.m] = parseInt(r.count, 10); });
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      trendChart.labels = monthNames;
      trendChart.data = monthNames.map((_, idx) => monthMap[idx + 1] || 0);
      trendChart.maxCount = Math.max(...trendChart.data, 10);
    } else {
      const dateCondition = fallbackToAll
        ? db.raw('1=1')
        : db.raw('DATE(created_at) >= ? AND DATE(created_at) <= ?', [currStartStr, currEndStr]);

      const dayRows = await db('leads')
        .where('business_id', businessId)
        .where('is_active', true)
        .where(dateCondition)
        .select(db.raw('DATE(created_at) as d, COUNT(*) as count'))
        .groupByRaw('DATE(created_at)')
        .orderBy('d', 'asc');

      const dayMap = {};
      dayRows.forEach((r) => {
        let key = '';
        if (typeof r.d === 'string') {
          key = r.d.split('T')[0];
        } else if (r.d instanceof Date) {
          key = fmt(r.d);
        } else {
          key = String(r.d);
        }
        dayMap[key] = parseInt(r.count, 10);
      });

      if (fallbackToAll && dayRows.length > 0) {
        trendChart.labels = dayRows.map((r) => {
          const dObj = new Date(r.d);
          return `${dObj.getDate()} ${dObj.toLocaleDateString('en-GB', { month: 'short' })}`;
        });
        trendChart.data = dayRows.map((r) => parseInt(r.count, 10));
        trendChart.maxCount = Math.max(...trendChart.data, 10);
      } else {
        const labels = [];
        const data = [];
        const cur = new Date(currentStart);
        const end = new Date(currentEnd);
        while (cur <= end) {
          const dKey = fmt(cur);
          labels.push(`${cur.getDate()} ${cur.toLocaleDateString('en-GB', { month: 'short' })}`);
          data.push(dayMap[dKey] || 0);
          cur.setDate(cur.getDate() + 1);
        }
        trendChart.labels = labels;
        trendChart.data = data;
        trendChart.maxCount = Math.max(...data, 10);
      }
    }

    // 3. Leads by Source
    const sourceQuery = db('leads')
      .where('business_id', businessId)
      .where('is_active', true);
    if (!fallbackToAll) {
      sourceQuery.whereRaw('DATE(created_at) >= ? AND DATE(created_at) <= ?', [currStartStr, currEndStr]);
    }

    const sourceRows = await sourceQuery
      .select(db.raw("COALESCE(NULLIF(source, ''), 'Website') as source, COUNT(*) as count"))
      .groupByRaw("COALESCE(NULLIF(source, ''), 'Website')")
      .orderBy('count', 'desc');

    const sourceColors = {
      Website: '#2563EB',
      Instagram: '#9333EA',
      'Walk-in': '#F97316',
      Referral: '#EC4899',
      'Google Ads': '#14B8A6',
      Facebook: '#6366F1',
      'Phone Call': '#0284C7',
      Other: '#64748B',
    };

    const totalSourcesCount = sourceRows.reduce((sum, r) => sum + parseInt(r.count, 10), 0) || currentStats.total || 1;
    const sources = sourceRows.map((r) => {
      const c = parseInt(r.count, 10);
      return {
        source: r.source,
        count: c,
        percentage: Math.round((c / totalSourcesCount) * 100),
        color: sourceColors[r.source] || '#E91E63',
      };
    });

    // 4. Conversion Funnel
    const funnelQuery = db('leads')
      .where('business_id', businessId)
      .where('is_active', true);
    if (!fallbackToAll) {
      funnelQuery.whereRaw('DATE(created_at) >= ? AND DATE(created_at) <= ?', [currStartStr, currEndStr]);
    }
    const allLeadsInPeriod = await funnelQuery.select('status');

    let funnelContacted = 0;
    let funnelInterested = 0;
    let funnelInProgress = 0;
    let funnelConverted = 0;

    allLeadsInPeriod.forEach((l) => {
      const st = l.status;
      if (['contacted', 'interested', 'in_progress', 'converted'].includes(st)) funnelContacted++;
      if (['interested', 'in_progress', 'converted'].includes(st)) funnelInterested++;
      if (['in_progress', 'converted'].includes(st)) funnelInProgress++;
      if (st === 'converted') funnelConverted++;
    });

    const funnel = {
      total: allLeadsInPeriod.length,
      contacted: funnelContacted,
      interested: funnelInterested,
      trial_or_visit: funnelInProgress,
      converted: funnelConverted,
    };

    return {
      timeRange: rawTr,
      periodLabel,
      metrics,
      trendChart,
      sources,
      funnel,
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

  async bulkDelete(ids, businessId) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    return db('leads').where('business_id', businessId).whereIn('id', ids).del();
  }

  async bulkUpdateStatus(ids, businessId, status) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    return db('leads').where('business_id', businessId).whereIn('id', ids).update({ status, updated_at: db.fn.now() });
  }

  async bulkAssign(ids, businessId, assignedTo) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    return db('leads').where('business_id', businessId).whereIn('id', ids).update({
      assigned_to: assignedTo ? Number(assignedTo) : null,
      updated_at: db.fn.now()
    });
  }
}

const leadService = new LeadService();

// ===== CONTROLLERS =====
const getLeads = asyncHandler(async (req, res) => { const { leads, meta } = await leadService.getAll(req.user.business_id, req.query); ApiResponse.ok('Leads', leads, meta).send(res); });
const getLeadStats = asyncHandler(async (req, res) => { const stats = await leadService.getStats(req.user.business_id, req.query); ApiResponse.ok('Lead Stats', stats).send(res); });
const getDashboardAnalytics = asyncHandler(async (req, res) => { const analytics = await leadService.getDashboardAnalytics(req.user.business_id, req.query); ApiResponse.ok('Dashboard Analytics', analytics).send(res); });
const getLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead', await leadService.getById(req.params.id, req.user.business_id)).send(res); });
const createLead = asyncHandler(async (req, res) => { ApiResponse.created('Lead created', await leadService.create(req.user.business_id, req.body)).send(res); });
const updateLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead updated', await leadService.update(req.params.id, req.user.business_id, req.body)).send(res); });
const deleteLead = asyncHandler(async (req, res) => { await leadService.delete(req.params.id, req.user.business_id); ApiResponse.ok('Lead deleted', null).send(res); });
const assignLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead assigned', await leadService.assignStaff(req.params.id, req.user.business_id, req.body)).send(res); });
const convertLead = asyncHandler(async (req, res) => { ApiResponse.ok('Lead converted to customer', await leadService.convertToCustomer(req.params.id, req.user.business_id, req.body)).send(res); });
const recordLeadFollowUp = asyncHandler(async (req, res) => { ApiResponse.ok('Follow-up saved', await leadService.recordFollowUp(req.params.id, req.user.business_id, req.body)).send(res); });
const bulkDeleteLeads = asyncHandler(async (req, res) => { const count = await leadService.bulkDelete(req.body.ids, req.user.business_id); ApiResponse.ok(`${count} leads deleted`, { count }).send(res); });
const bulkStatusLeads = asyncHandler(async (req, res) => { const count = await leadService.bulkUpdateStatus(req.body.ids, req.user.business_id, req.body.status); ApiResponse.ok(`${count} leads status updated`, { count }).send(res); });
const bulkAssignLeads = asyncHandler(async (req, res) => { const count = await leadService.bulkAssign(req.body.ids, req.user.business_id, req.body.assigned_to); ApiResponse.ok(`${count} leads assigned`, { count }).send(res); });

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.get('/stats', getLeadStats);
router.get('/dashboard-analytics', getDashboardAnalytics);
router.get('/', getLeads);
router.post('/bulk-delete', bulkDeleteLeads);
router.post('/bulk-status', bulkStatusLeads);
router.post('/bulk-assign', bulkAssignLeads);
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

export { leadService };
export default router;

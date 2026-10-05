import { db } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanObject } from '../../utils/helpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { singleImage, singleDocument, deleteUploadedFile } from '../../utils/fileUpload.js';

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// ===== VALIDATION =====
const createStaffSchema = {
  body: z.object({
    user_id: z.coerce.number().int().positive(),
    designation: z.string().max(100).optional(),
    specializations: z.any().optional(),
    joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    salary: z.coerce.number().nonnegative().optional(),
    commission_profile_id: z.coerce.number().int().positive().optional(),
    bio: z.string().max(2000).optional(),
    is_active: z.coerce.boolean().optional(),
    avatar_url: z.string().max(500).optional().nullable(),
    color_code: z.string().max(50).optional().nullable(),
    shift_schedule: z.string().max(50).optional().nullable(),
  }),
};
const updateStaffSchema = { body: createStaffSchema.body.partial(), params: idParam };

const markAttendanceSchema = {
  body: z.object({
    staff_member_id: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['present', 'absent', 'half_day', 'weekly_off', 'holiday', 'leave']),
    check_in_time: z.string().regex(/^\d{2}:\d{2}/).optional(),
    check_out_time: z.string().regex(/^\d{2}:\d{2}/).optional(),
    notes: z.string().max(500).optional(),
  }),
};

// Helper to safely parse specializations in any format (JSON array, string, comma-separated)
const parseSpecializations = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') {
        return parsed.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    } catch {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

// ===== SERVICE =====
class StaffService {
  async getAll(businessId, activeOnly = false) {
    let query = db('staff_members as sm')
      .join('users as u', 'sm.user_id', 'u.id')
      .leftJoin('commission_profiles as cp', 'sm.commission_profile_id', 'cp.id')
      .where('sm.business_id', businessId);

    if (activeOnly) {
      query = query.where('u.is_active', true);
    }

    const list = await query.select('sm.*', 'u.first_name', 'u.last_name', 'u.email', 'u.phone', 'u.role', 'u.avatar_url', 'u.is_active', 'cp.name as commission_profile_name');

    return list.map(item => ({
      ...item,
      specializations: parseSpecializations(item.specializations),
    }));
  }

  async getById(id, businessId) {
    const staff = await db('staff_members as sm')
      .join('users as u', 'sm.user_id', 'u.id')
      .where({ 'sm.id': id, 'sm.business_id': businessId })
      .select('sm.*', 'u.first_name', 'u.last_name', 'u.email', 'u.phone', 'u.role', 'u.avatar_url', 'u.is_active')
      .first();
    if (!staff) throw ApiError.notFound('Staff member not found');

    staff.specializations = parseSpecializations(staff.specializations);
    staff.working_hours = await db('staff_working_hours').where({ staff_member_id: id }).orderBy('day_of_week');
    return staff;
  }

  async create(businessId, data) {
    const user = await db('users').where({ id: data.user_id, business_id: businessId }).first();
    if (!user) throw ApiError.notFound('User not found in this business');
    const existing = await db('staff_members').where({ user_id: data.user_id }).first();
    if (existing) throw ApiError.conflict('Staff profile already exists for this user');

    const specs = parseSpecializations(data.specializations);
    const staffData = { ...data };
    delete staffData.is_active;
    delete staffData.first_name;
    delete staffData.last_name;
    delete staffData.email;
    delete staffData.phone;
    delete staffData.role;
    delete staffData.password;
    delete staffData.image;
    delete staffData.avatar_url;

    const [id] = await db('staff_members').insert({
      ...cleanObject(staffData),
      specializations: specs.length > 0 ? JSON.stringify(specs) : null,
      business_id: businessId,
    });

    if (data.avatar_url) {
      await db('users').where({ id: data.user_id }).update({ avatar_url: data.avatar_url, updated_at: db.fn.now() });
    }

    return this.getById(id, businessId);
  }

  async update(id, businessId, data) {
    const staff = await this.getById(id, businessId);
    if (data.specializations !== undefined) {
      const specs = parseSpecializations(data.specializations);
      data.specializations = specs.length > 0 ? JSON.stringify(specs) : null;
    }

    // Sync user fields if provided
    const userUpdates = {};
    if (data.is_active !== undefined) userUpdates.is_active = !!data.is_active;
    if (data.avatar_url !== undefined) userUpdates.avatar_url = data.avatar_url;
    if (data.first_name !== undefined) userUpdates.first_name = data.first_name;
    if (data.last_name !== undefined) userUpdates.last_name = data.last_name;
    if (data.phone !== undefined) userUpdates.phone = data.phone;
    if (data.email !== undefined) userUpdates.email = data.email;
    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updated_at = db.fn.now();
      await db('users').where({ id: staff.user_id }).update(userUpdates);
    }

    const staffData = { ...data };
    delete staffData.is_active;
    delete staffData.first_name;
    delete staffData.last_name;
    delete staffData.email;
    delete staffData.phone;
    delete staffData.role;
    delete staffData.password;
    delete staffData.image;
    delete staffData.avatar_url;

    await db('staff_members').where({ id, business_id: businessId }).update({ ...cleanObject(staffData), updated_at: db.fn.now() });
    return this.getById(id, businessId);
  }

  async setWorkingHours(staffId, businessId, hours) {
    await this.getById(staffId, businessId);
    await db('staff_working_hours').where({ staff_member_id: staffId }).del();
    if (hours.length > 0) {
      const rows = hours.map(h => ({ staff_member_id: staffId, ...h }));
      await db('staff_working_hours').insert(rows);
    }
    return this.getById(staffId, businessId);
  }

  async markAttendance(businessId, userId, data) {
    const staff = await db('staff_members').where({ id: data.staff_member_id, business_id: businessId }).first();
    if (!staff) throw ApiError.notFound('Staff member not found');

    const existing = await db('staff_attendance').where({ staff_member_id: data.staff_member_id, date: data.date }).first();
    if (existing) {
      await db('staff_attendance').where({ id: existing.id }).update({ ...cleanObject(data), marked_by: userId });
      return db('staff_attendance').where({ id: existing.id }).first();
    }
    const [id] = await db('staff_attendance').insert({ ...data, business_id: businessId, marked_by: userId });
    return db('staff_attendance').where({ id }).first();
  }

  async getAttendance(businessId, query) {
    const base = db('staff_attendance as sa')
      .join('staff_members as sm', 'sa.staff_member_id', 'sm.id')
      .join('users as u', 'sm.user_id', 'u.id')
      .where('sa.business_id', businessId)
      .select('sa.*', 'u.first_name', 'u.last_name');
    if (query.staff_member_id) base.where('sa.staff_member_id', query.staff_member_id);
    if (query.date) base.where('sa.date', query.date);
    if (query.month) base.whereRaw('MONTH(sa.date) = ?', [query.month]);
    if (query.year) base.whereRaw('YEAR(sa.date) = ?', [query.year]);
    return base.orderBy('sa.date', 'desc');
  }

  async getCommissions(businessId, query) {
    const base = db('staff_commissions as sc')
      .join('staff_members as sm', 'sc.staff_member_id', 'sm.id')
      .join('users as u', 'sm.user_id', 'u.id')
      .join('invoices as i', 'sc.invoice_id', 'i.id')
      .where('sc.business_id', businessId)
      .select('sc.*', 'u.first_name', 'u.last_name', 'i.invoice_number');
    if (query.staff_member_id) base.where('sc.staff_member_id', query.staff_member_id);
    if (query.status) base.where('sc.status', query.status);
    return base.orderBy('sc.created_at', 'desc');
  }

  async getPerformance(staffId, businessId, startDate, endDate) {
    const [appointmentStats] = await db('appointments as a')
      .leftJoin('appointment_services as aps', 'aps.appointment_id', 'a.id')
      .where('a.business_id', businessId)
      .where(function() {
        this.where('a.staff_member_id', staffId).orWhere('aps.staff_member_id', staffId);
      })
      .whereBetween('a.appointment_date', [startDate, endDate])
      .select(
        db.raw('COUNT(DISTINCT a.id) as total_appointments'),
        db.raw("COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments"),
        db.raw("COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) as cancelled_appointments"),
        db.raw("COUNT(DISTINCT CASE WHEN a.status = 'no_show' THEN a.id END) as noshow_appointments"),
        db.raw("COUNT(DISTINCT CASE WHEN a.status IN ('planned', 'ongoing') THEN a.id END) as upcoming_appointments"),
        db.raw('COALESCE(SUM(aps.price), 0) as total_revenue')
      );

    const [commissionStats] = await db('staff_commissions')
      .where({ staff_member_id: staffId, business_id: businessId })
      .whereBetween('created_at', [startDate, `${endDate} 23:59:59`])
      .select(
        db.raw('COALESCE(SUM(commission_amount), 0) as total_commission'),
        db.raw("SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_commission")
      );

    const attendanceStats = await db('staff_attendance')
      .where({ staff_member_id: staffId, business_id: businessId })
      .whereBetween('date', [startDate, endDate])
      .select(
        db.raw("SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days"),
        db.raw("SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days"),
        db.raw("SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_days"),
        db.raw("SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days"),
        db.raw('COALESCE(SUM(total_hours), 0) as total_hours')
      )
      .first();

    let feedbackStats = null;
    try {
      feedbackStats = await db('customer_feedback')
        .where({ staff_member_id: staffId, business_id: businessId })
        .select(
          db.raw('AVG(rating) as avg_rating'),
          db.raw('COUNT(id) as total_reviews')
        )
        .first();
    } catch {
      // feedback table might be empty or null
    }

    return {
      ...appointmentStats,
      ...commissionStats,
      ...attendanceStats,
      avg_rating: feedbackStats?.avg_rating ? parseFloat(feedbackStats.avg_rating).toFixed(1) : null,
      total_reviews: parseInt(feedbackStats?.total_reviews || 0, 10),
    };
  }

  // Profile - Services
  async getServices(staffId, businessId) {
    const staff = await db('staff_members').where({ id: staffId, business_id: businessId }).first();
    const userId = staff ? staff.user_id : staffId;

    // Return all salon services and annotate if assigned to this staff
    const allServices = await db('salon_services as ss')
      .leftJoin('service_categories as sc', 'ss.category_id', 'sc.id')
      .where('ss.business_id', businessId)
      .select('ss.*', 'sc.name as category_name');
    
    const assigned = await db('staff_services')
      .where(function() {
        this.where('staff_id', staffId).orWhere('staff_id', userId);
      })
      .where('is_assigned', true);
    
    return allServices.map(s => {
      const match = assigned.find(a => a.service_id === s.id);
      return {
        ...s,
        is_assigned: !!match,
        duration_mins: match && match.duration_mins ? match.duration_mins : s.duration_minutes,
        price: match && match.price ? match.price : s.price
      };
    });
  }

  async updateServices(staffId, businessId, data) {
    const staff = await db('staff_members').where({ id: staffId, business_id: businessId }).first();
    const targetUserId = staff ? staff.user_id : staffId;
    await db('staff_services')
      .where(function() {
        this.where('staff_id', staffId).orWhere('staff_id', targetUserId);
      })
      .del();

    const rows = (data || []).filter(d => d.is_assigned).map(d => ({
      staff_id: targetUserId,
      service_id: d.service_id,
      duration_mins: d.duration_mins || null,
      price: d.price || null,
      is_assigned: true
    }));
    if (rows.length > 0) {
      await db('staff_services').insert(rows);
    }
    return this.getServices(staffId, businessId);
  }

  // Profile - Schedule
  async getSchedule(staffId, businessId) {
    const staff = await db('staff_members').where({ id: staffId, business_id: businessId }).first();
    const targetUserId = staff ? staff.user_id : staffId;
    const list = await db('staff_schedules')
      .where(function() {
        this.where('staff_id', staffId).orWhere('staff_id', targetUserId);
      })
      .orderBy('day_of_week');
    if (list.length > 0) return list;
    return db('staff_working_hours').where({ staff_member_id: staffId }).orderBy('day_of_week');
  }

  async updateSchedule(staffId, businessId, schedules) {
    const staff = await db('staff_members').where({ id: staffId, business_id: businessId }).first();
    const targetUserId = staff ? staff.user_id : staffId;
    await db('staff_schedules')
      .where(function() {
        this.where('staff_id', staffId).orWhere('staff_id', targetUserId);
      })
      .del();
    if (schedules && schedules.length > 0) {
      const rows = schedules.map(s => ({
        staff_id: targetUserId,
        day_of_week: s.day_of_week,
        is_working: !!s.is_working,
        start_time: s.start_time || null,
        end_time: s.end_time || null,
        break_start: s.break_start || null,
        break_end: s.break_end || null,
      }));
      await db('staff_schedules').insert(rows);
    }
    return this.getSchedule(staffId, businessId);
  }

  // Profile - Leaves
  async getLeaves(staffId, businessId) {
    return db('staff_leaves').where({ staff_id: staffId }).orderBy('date', 'desc');
  }

  async addLeave(staffId, businessId, data) {
    const [id] = await db('staff_leaves').insert({ staff_id: staffId, ...data });
    return db('staff_leaves').where({ id }).first();
  }
  async deleteStaff(id, businessId) {
    const staff = await this.getById(id, businessId);

    // 1. Clean up documents files & records
    try {
      const docs = await db('staff_documents').where({ staff_member_id: id, business_id: businessId });
      for (const doc of docs) {
        if (doc.file_url) deleteUploadedFile(doc.file_url);
      }
      await db('staff_documents').where({ staff_member_id: id, business_id: businessId }).del();
    } catch {
      // ignore if documents table not populated
    }

    // 2. Delete schedule, working hours, leaves, assigned services, attendance, commissions
    await db('staff_working_hours').where({ staff_member_id: id }).del();
    await db('staff_leaves').where({ staff_id: staff.user_id }).del();
    await db('staff_schedules').where({ staff_id: staff.user_id }).del();
    await db('staff_services').where({ staff_id: staff.user_id }).del();
    await db('staff_attendance').where({ staff_member_id: id, business_id: businessId }).del();
    await db('staff_commissions').where({ staff_member_id: id, business_id: businessId }).del();

    // 3. Gracefully dissociate references in appointments, invoice items, feedback, leads
    await db('appointments').where({ staff_member_id: id }).update({ staff_member_id: null });
    await db('appointment_services').where({ staff_member_id: id }).update({ staff_member_id: null });
    await db('invoice_items').where({ staff_member_id: id }).update({ staff_member_id: null });
    await db('customer_feedback').where({ staff_member_id: id }).update({ staff_member_id: null });
    await db('leads').where({ assigned_to: id }).update({ assigned_to: null });

    // 4. Delete staff profile row
    await db('staff_members').where({ id, business_id: businessId }).del();

    // 5. Clean up user references & remove user account
    if (staff.avatar_url && !staff.avatar_url.startsWith('http') && !staff.avatar_url.startsWith('icon:')) {
      deleteUploadedFile(staff.avatar_url);
    }
    await db('audit_logs').where({ user_id: staff.user_id }).update({ user_id: null });
    await db('expenses').where({ created_by: staff.user_id }).update({ created_by: null });
    await db('invoices').where({ created_by: staff.user_id }).update({ created_by: null });
    await db('appointments').where({ created_by: staff.user_id }).update({ created_by: null });
    await db('staff_attendance').where({ marked_by: staff.user_id }).update({ marked_by: null });
    await db('campaigns').where({ created_by: staff.user_id }).update({ created_by: null });
    await db('refresh_tokens').where({ user_id: staff.user_id }).del();
    await db('users').where({ id: staff.user_id, business_id: businessId }).del();

    return { success: true, id };
  }

  async toggleActive(id, businessId) {
    const staff = await this.getById(id, businessId);
    const newStatus = !staff.is_active;
    await db('users').where({ id: staff.user_id }).update({ is_active: newStatus, updated_at: db.fn.now() });
    return this.getById(id, businessId);
  }

  async bulkUpdateStatus(ids, businessId, isActive) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const staffList = await db('staff_members')
      .where('business_id', businessId)
      .whereIn('id', ids)
      .select('id', 'user_id');
    const userIds = staffList.map(s => s.user_id).filter(Boolean);
    if (userIds.length > 0) {
      await db('users')
        .whereIn('id', userIds)
        .update({ is_active: Boolean(isActive), updated_at: db.fn.now() });
    }
    return staffList.length;
  }

  async bulkDelete(ids, businessId) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    let count = 0;
    for (const id of ids) {
      try {
        await this.deleteStaff(id, businessId);
        count++;
      } catch (err) {
        console.error(`Failed to delete staff id ${id}:`, err);
      }
    }
    return count;
  }

  async getDocuments(staffId, businessId) {
    await this.getById(staffId, businessId);
    return db('staff_documents')
      .where({ staff_member_id: staffId, business_id: businessId })
      .orderBy('created_at', 'desc');
  }

  async addDocument(staffId, businessId, file, data) {
    await this.getById(staffId, businessId);
    if (!file) throw ApiError.badRequest('Please upload a document file (PDF, PNG, JPG, WebP)');

    const fileUrl = `/uploads/${file.filename}`;
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const fileSizeStr = file.size > 1024 * 1024 ? `${fileSizeMb} MB` : `${Math.round(file.size / 1024)} KB`;

    const [id] = await db('staff_documents').insert({
      staff_member_id: staffId,
      business_id: businessId,
      document_name: data.document_name || file.originalname,
      document_type: data.document_type || 'Identity Proof',
      file_url: fileUrl,
      file_size: fileSizeStr,
      file_type: file.mimetype,
    });

    return db('staff_documents').where({ id }).first();
  }

  async deleteDocument(staffId, docId, businessId) {
    await this.getById(staffId, businessId);
    const doc = await db('staff_documents')
      .where({ id: docId, staff_member_id: staffId, business_id: businessId })
      .first();
    if (!doc) throw ApiError.notFound('Document not found');

    if (doc.file_url) {
      deleteUploadedFile(doc.file_url);
    }
    await db('staff_documents').where({ id: docId }).del();
    return { success: true };
  }
}

const staffService = new StaffService();

// ===== CONTROLLER =====
const getStaff = asyncHandler(async (req, res) => {
  const activeOnly = req.query.active_only === 'true' || req.query.is_active === 'true';
  const staff = await staffService.getAll(req.user.business_id, activeOnly);
  ApiResponse.ok('Staff fetched', staff).send(res);
});
const getStaffMember = asyncHandler(async (req, res) => {
  const staff = await staffService.getById(req.params.id, req.user.business_id);
  ApiResponse.ok('Staff member fetched', staff).send(res);
});
const createStaffMember = asyncHandler(async (req, res) => {
  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : req.body.avatar_url;
  if (avatarUrl && req.body.user_id) {
    await db('users').where({ id: req.body.user_id }).update({ avatar_url: avatarUrl });
  }
  const payload = { ...req.body };
  if (avatarUrl) payload.avatar_url = avatarUrl;
  const staff = await staffService.create(req.user.business_id, payload);
  ApiResponse.created('Staff member created', staff).send(res);
});
const updateStaffMember = asyncHandler(async (req, res) => {
  const staffRec = await staffService.getById(req.params.id, req.user.business_id);
  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : req.body.avatar_url;
  if (req.file && staffRec?.avatar_url && staffRec.avatar_url !== avatarUrl) {
    deleteUploadedFile(staffRec.avatar_url);
  }
  if (avatarUrl !== undefined && avatarUrl !== null && staffRec?.user_id) {
    await db('users').where({ id: staffRec.user_id }).update({ avatar_url: avatarUrl });
  }
  const payload = { ...req.body };
  if (avatarUrl !== undefined) payload.avatar_url = avatarUrl;
  const staff = await staffService.update(req.params.id, req.user.business_id, payload);
  ApiResponse.ok('Staff member updated', staff).send(res);
});
const deleteStaffMember = asyncHandler(async (req, res) => {
  const result = await staffService.deleteStaff(req.params.id, req.user.business_id);
  ApiResponse.ok('Staff member deleted successfully', result).send(res);
});
const toggleStaffActive = asyncHandler(async (req, res) => {
  const staff = await staffService.toggleActive(req.params.id, req.user.business_id);
  ApiResponse.ok('Staff status updated', staff).send(res);
});
const bulkStatusStaff = asyncHandler(async (req, res) => {
  const { ids, is_active } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('No staff IDs provided');
  }
  const count = await staffService.bulkUpdateStatus(ids, req.user.business_id, is_active);
  ApiResponse.ok(`${count} staff member(s) status updated`, { count }).send(res);
});
const bulkDeleteStaff = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('No staff IDs provided');
  }
  const count = await staffService.bulkDelete(ids, req.user.business_id);
  ApiResponse.ok(`${count} staff member(s) deleted`, { count }).send(res);
});
const markAttendance = asyncHandler(async (req, res) => {
  const record = await staffService.markAttendance(req.user.business_id, req.user.id, req.body);
  ApiResponse.ok('Attendance marked', record).send(res);
});
const getAttendance = asyncHandler(async (req, res) => {
  const records = await staffService.getAttendance(req.user.business_id, req.query);
  ApiResponse.ok('Attendance fetched', records).send(res);
});
const getCommissions = asyncHandler(async (req, res) => {
  const records = await staffService.getCommissions(req.user.business_id, req.query);
  ApiResponse.ok('Commissions fetched', records).send(res);
});
const getPerformance = asyncHandler(async (req, res) => {
  const startDate = req.query.start_date || new Date(new Date().setDate(1)).toISOString().split('T')[0];
  const endDate = req.query.end_date || new Date().toISOString().split('T')[0];
  const perf = await staffService.getPerformance(req.params.id, req.user.business_id, startDate, endDate);
  ApiResponse.ok('Performance fetched', perf).send(res);
});
const getStaffServices = asyncHandler(async (req, res) => {
  const data = await staffService.getServices(req.params.id, req.user.business_id);
  ApiResponse.ok('Services fetched', data).send(res);
});
const updateStaffServices = asyncHandler(async (req, res) => {
  const data = await staffService.updateServices(req.params.id, req.user.business_id, req.body.services);
  ApiResponse.ok('Services updated', data).send(res);
});
const getStaffSchedule = asyncHandler(async (req, res) => {
  const data = await staffService.getSchedule(req.params.id, req.user.business_id);
  ApiResponse.ok('Schedule fetched', data).send(res);
});
const updateStaffSchedule = asyncHandler(async (req, res) => {
  const data = await staffService.updateSchedule(req.params.id, req.user.business_id, req.body.schedules);
  ApiResponse.ok('Schedule updated', data).send(res);
});
const getStaffLeaves = asyncHandler(async (req, res) => {
  const data = await staffService.getLeaves(req.params.id, req.user.business_id);
  ApiResponse.ok('Leaves fetched', data).send(res);
});
const addStaffLeave = asyncHandler(async (req, res) => {
  const data = await staffService.addLeave(req.params.id, req.user.business_id, req.body);
  ApiResponse.created('Leave added', data).send(res);
});
const getStaffDocuments = asyncHandler(async (req, res) => {
  const docs = await staffService.getDocuments(req.params.id, req.user.business_id);
  ApiResponse.ok('Staff documents fetched', docs).send(res);
});
const uploadStaffDocument = asyncHandler(async (req, res) => {
  const doc = await staffService.addDocument(
    req.params.id,
    req.user.business_id,
    req.file,
    req.body
  );
  ApiResponse.created('Document uploaded successfully', doc).send(res);
});
const deleteStaffDocument = asyncHandler(async (req, res) => {
  const result = await staffService.deleteDocument(
    req.params.id,
    req.params.docId,
    req.user.business_id
  );
  ApiResponse.ok('Document deleted successfully', result).send(res);
});

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.get('/', getStaff);
router.get('/attendance', getAttendance);
router.get('/commissions', authorize('super_admin', 'admin', 'manager'), getCommissions);
router.post('/bulk-status', authorize('super_admin', 'admin', 'manager'), bulkStatusStaff);
router.post('/bulk-delete', authorize('super_admin', 'admin'), bulkDeleteStaff);
router.get('/:id', validate({ params: idParam }), getStaffMember);
router.get('/:id/performance', validate({ params: idParam }), getPerformance);
router.get('/:id/services', validate({ params: idParam }), getStaffServices);
router.post('/:id/services', validate({ params: idParam }), updateStaffServices);
router.get('/:id/schedule', validate({ params: idParam }), getStaffSchedule);
router.post('/:id/schedule', validate({ params: idParam }), updateStaffSchedule);
router.get('/:id/leaves', validate({ params: idParam }), getStaffLeaves);
router.post('/:id/leaves', validate({ params: idParam }), addStaffLeave);
router.get('/:id/documents', validate({ params: idParam }), getStaffDocuments);
router.post('/:id/documents', authorize('super_admin', 'admin', 'manager'), singleDocument('document'), validate({ params: idParam }), uploadStaffDocument);
router.delete('/:id/documents/:docId', authorize('super_admin', 'admin'), deleteStaffDocument);
router.post('/', authorize('super_admin', 'admin'), singleImage('image'), validate(createStaffSchema), createStaffMember);
router.put('/:id', authorize('super_admin', 'admin', 'manager'), singleImage('image'), validate(updateStaffSchema), updateStaffMember);
router.delete('/:id', authorize('super_admin', 'admin'), validate({ params: idParam }), deleteStaffMember);
router.patch('/:id/toggle-active', authorize('super_admin', 'admin'), validate({ params: idParam }), toggleStaffActive);
router.post('/attendance', authorize('super_admin', 'admin', 'manager', 'receptionist'), validate(markAttendanceSchema), markAttendance);

export default router;

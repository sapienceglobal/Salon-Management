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
import { singleImage } from '../../utils/fileUpload.js';

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

// ===== SERVICE =====
class StaffService {
  async getAll(businessId) {
    return db('staff_members as sm')
      .join('users as u', 'sm.user_id', 'u.id')
      .leftJoin('commission_profiles as cp', 'sm.commission_profile_id', 'cp.id')
      .where('sm.business_id', businessId)
      .select('sm.*', 'u.first_name', 'u.last_name', 'u.email', 'u.phone', 'u.role', 'u.avatar_url', 'u.is_active', 'cp.name as commission_profile_name');
  }

  async getById(id, businessId) {
    const staff = await db('staff_members as sm')
      .join('users as u', 'sm.user_id', 'u.id')
      .where({ 'sm.id': id, 'sm.business_id': businessId })
      .select('sm.*', 'u.first_name', 'u.last_name', 'u.email', 'u.phone', 'u.role', 'u.avatar_url', 'u.is_active')
      .first();
    if (!staff) throw ApiError.notFound('Staff member not found');

    staff.working_hours = await db('staff_working_hours').where({ staff_member_id: id }).orderBy('day_of_week');
    return staff;
  }

  async create(businessId, data) {
    const user = await db('users').where({ id: data.user_id, business_id: businessId }).first();
    if (!user) throw ApiError.notFound('User not found in this business');
    const existing = await db('staff_members').where({ user_id: data.user_id }).first();
    if (existing) throw ApiError.conflict('Staff profile already exists for this user');

    const [id] = await db('staff_members').insert({
      ...data,
      specializations: data.specializations ? JSON.stringify(data.specializations) : null,
      business_id: businessId,
    });
    return this.getById(id, businessId);
  }

  async update(id, businessId, data) {
    await this.getById(id, businessId);
    if (data.specializations) data.specializations = JSON.stringify(data.specializations);
    await db('staff_members').where({ id, business_id: businessId }).update({ ...cleanObject(data), updated_at: db.fn.now() });
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
    const [appointmentStats] = await db('appointment_services')
      .join('appointments as a', 'appointment_services.appointment_id', 'a.id')
      .where({ 'appointment_services.staff_member_id': staffId, 'a.business_id': businessId })
      .whereBetween('a.appointment_date', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as total_services'),
        db.raw("SUM(CASE WHEN appointment_services.status = 'completed' THEN 1 ELSE 0 END) as completed_services"),
        db.raw('SUM(appointment_services.price) as total_revenue')
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
        db.raw('COALESCE(SUM(total_hours), 0) as total_hours')
      )
      .first();

    return { ...appointmentStats, ...commissionStats, ...attendanceStats };
  }

  // Profile - Services
  async getServices(staffId, businessId) {
    // Return all salon services and annotate if assigned to this staff
    const allServices = await db('salon_services as ss')
      .leftJoin('service_categories as sc', 'ss.category_id', 'sc.id')
      .where('ss.business_id', businessId)
      .select('ss.*', 'sc.name as category_name');
    
    const assigned = await db('staff_services').where({ staff_id: staffId, is_assigned: true });
    
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
    // data is array of { service_id, is_assigned, duration_mins, price }
    await db('staff_services').where({ staff_id: staffId }).del();
    const rows = data.filter(d => d.is_assigned).map(d => ({
      staff_id: staffId,
      service_id: d.service_id,
      duration_mins: d.duration_mins,
      price: d.price
    }));
    if (rows.length > 0) {
      await db('staff_services').insert(rows);
    }
    return this.getServices(staffId, businessId);
  }

  // Profile - Schedule
  async getSchedule(staffId, businessId) {
    return db('staff_schedules').where({ staff_id: staffId }).orderBy('day_of_week');
  }

  async updateSchedule(staffId, businessId, schedules) {
    await db('staff_schedules').where({ staff_id: staffId }).del();
    if (schedules.length > 0) {
      const rows = schedules.map(s => ({ staff_id: staffId, ...s }));
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
    // Soft delete by deactivating the user account
    await db('users').where({ id: staff.user_id }).update({ is_active: false, updated_at: db.fn.now() });
    await db('staff_members').where({ id, business_id: businessId }).update({ updated_at: db.fn.now() });
    return { success: true };
  }

  async toggleActive(id, businessId) {
    const staff = await this.getById(id, businessId);
    const newStatus = !staff.is_active;
    await db('users').where({ id: staff.user_id }).update({ is_active: newStatus, updated_at: db.fn.now() });
    return this.getById(id, businessId);
  }
}

const staffService = new StaffService();

// ===== CONTROLLER =====
const getStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.getAll(req.user.business_id);
  ApiResponse.ok('Staff fetched', staff).send(res);
});
const getStaffMember = asyncHandler(async (req, res) => {
  const staff = await staffService.getById(req.params.id, req.user.business_id);
  ApiResponse.ok('Staff member fetched', staff).send(res);
});
const createStaffMember = asyncHandler(async (req, res) => {
  const staff = await staffService.create(req.user.business_id, req.body);
  if (req.file) {
    await db('users').where({ id: req.body.user_id }).update({ avatar_url: `/uploads/${req.file.filename}` });
  }
  ApiResponse.created('Staff member created', staff).send(res);
});
const updateStaffMember = asyncHandler(async (req, res) => {
  const staff = await staffService.update(req.params.id, req.user.business_id, req.body);
  if (req.file) {
    const staffRec = await staffService.getById(req.params.id, req.user.business_id);
    await db('users').where({ id: staffRec.user_id }).update({ avatar_url: `/uploads/${req.file.filename}` });
  }
  ApiResponse.ok('Staff member updated', staff).send(res);
});
const deleteStaffMember = asyncHandler(async (req, res) => {
  const result = await staffService.deleteStaff(req.params.id, req.user.business_id);
  ApiResponse.ok('Staff member deactivated', result).send(res);
});
const toggleStaffActive = asyncHandler(async (req, res) => {
  const staff = await staffService.toggleActive(req.params.id, req.user.business_id);
  ApiResponse.ok('Staff status updated', staff).send(res);
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

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.get('/', getStaff);
router.get('/attendance', getAttendance);
router.get('/commissions', authorize('super_admin', 'admin', 'manager'), getCommissions);
router.get('/:id', validate({ params: idParam }), getStaffMember);
router.get('/:id/performance', validate({ params: idParam }), getPerformance);
router.get('/:id/services', validate({ params: idParam }), getStaffServices);
router.post('/:id/services', validate({ params: idParam }), updateStaffServices);
router.get('/:id/schedule', validate({ params: idParam }), getStaffSchedule);
router.post('/:id/schedule', validate({ params: idParam }), updateStaffSchedule);
router.get('/:id/leaves', validate({ params: idParam }), getStaffLeaves);
router.post('/:id/leaves', validate({ params: idParam }), addStaffLeave);
router.post('/', authorize('super_admin', 'admin'), singleImage('image'), validate(createStaffSchema), createStaffMember);
router.put('/:id', authorize('super_admin', 'admin', 'manager'), singleImage('image'), validate(updateStaffSchema), updateStaffMember);
router.delete('/:id', authorize('super_admin', 'admin'), validate({ params: idParam }), deleteStaffMember);
router.patch('/:id/toggle-active', authorize('super_admin', 'admin'), validate({ params: idParam }), toggleStaffActive);
router.post('/attendance', authorize('super_admin', 'admin', 'manager', 'receptionist'), validate(markAttendanceSchema), markAttendance);

export default router;

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

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// ===== VALIDATION =====
const createStaffSchema = {
  body: z.object({
    user_id: z.number().int().positive(),
    designation: z.string().max(100).optional(),
    specializations: z.array(z.string()).optional(),
    joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    salary: z.number().nonnegative().optional(),
    commission_profile_id: z.number().int().positive().optional(),
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
      .select('sm.*', 'u.first_name', 'u.last_name', 'u.email', 'u.phone', 'u.role', 'u.avatar_url')
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
  ApiResponse.created('Staff member created', staff).send(res);
});
const updateStaffMember = asyncHandler(async (req, res) => {
  const staff = await staffService.update(req.params.id, req.user.business_id, req.body);
  ApiResponse.ok('Staff member updated', staff).send(res);
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

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.get('/', getStaff);
router.get('/attendance', getAttendance);
router.get('/commissions', authorize('super_admin', 'admin', 'manager'), getCommissions);
router.get('/:id', validate({ params: idParam }), getStaffMember);
router.get('/:id/performance', validate({ params: idParam }), getPerformance);
router.post('/', authorize('super_admin', 'admin'), validate(createStaffSchema), createStaffMember);
router.put('/:id', authorize('super_admin', 'admin', 'manager'), validate(updateStaffSchema), updateStaffMember);
router.post('/attendance', authorize('super_admin', 'admin', 'manager', 'receptionist'), validate(markAttendanceSchema), markAttendance);

export default router;

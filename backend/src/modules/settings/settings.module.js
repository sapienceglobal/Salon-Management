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

// ===== SETTINGS SERVICE =====
class SettingsService {
  async get(businessId) {
    const settings = await db('business_settings').where({ business_id: businessId }).first();
    const business = await db('businesses').where({ id: businessId }).first();
    if (!settings || !business) throw ApiError.notFound('Settings not found');
    return { business, settings };
  }

  async updateBusiness(businessId, data) {
    await db('businesses').where({ id: businessId }).update({ ...cleanObject(data), updated_at: db.fn.now() });
    return db('businesses').where({ id: businessId }).first();
  }

  async updateSettings(businessId, data) {
    await db('business_settings').where({ business_id: businessId }).update({ ...cleanObject(data), updated_at: db.fn.now() });
    return db('business_settings').where({ business_id: businessId }).first();
  }

  // Commission profiles
  async getCommissionProfiles(businessId) { return db('commission_profiles').where({ business_id: businessId }).orderBy('created_at', 'desc'); }
  async createCommissionProfile(businessId, data) {
    const [id] = await db('commission_profiles').insert({
      business_id: businessId, name: data.name, type: data.type,
      value: data.value, rules: data.rules ? JSON.stringify(data.rules) : null,
    });
    return db('commission_profiles').where({ id }).first();
  }
  async updateCommissionProfile(id, businessId, data) {
    const profile = await db('commission_profiles').where({ id, business_id: businessId }).first();
    if (!profile) throw ApiError.notFound('Commission profile not found');
    if (data.rules) data.rules = JSON.stringify(data.rules);
    await db('commission_profiles').where({ id }).update({ ...cleanObject(data), updated_at: db.fn.now() });
    return db('commission_profiles').where({ id }).first();
  }

  // Service rooms
  async getServiceRooms(businessId) { return db('service_rooms').where({ business_id: businessId, is_active: true }); }
  async createServiceRoom(businessId, data) {
    const [id] = await db('service_rooms').insert({ business_id: businessId, name: data.name, capacity: data.capacity || 1 });
    return db('service_rooms').where({ id }).first();
  }

  // Notification templates
  async getNotificationTemplates(businessId) { return db('notification_templates').where({ business_id: businessId }).orderBy('event_type'); }
  async upsertNotificationTemplate(businessId, data) {
    const existing = await db('notification_templates')
      .where({ business_id: businessId, event_type: data.event_type, channel: data.channel }).first();
    if (existing) {
      await db('notification_templates').where({ id: existing.id }).update({ subject: data.subject, body: data.body, is_active: data.is_active ?? true, updated_at: db.fn.now() });
      return db('notification_templates').where({ id: existing.id }).first();
    }
    const [id] = await db('notification_templates').insert({ business_id: businessId, ...data });
    return db('notification_templates').where({ id }).first();
  }

  // Users management
  async getUsers(businessId) {
    return db('users').where({ business_id: businessId }).select('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_active', 'last_login_at', 'created_at').orderBy('created_at');
  }
  async createUser(businessId, data) {
    const existing = await db('users').where({ email: data.email }).first();
    if (existing) throw ApiError.conflict('Email already exists');
    const bcrypt = (await import('bcryptjs')).default;
    const hash = await bcrypt.hash(data.password, 12);
    const [id] = await db('users').insert({ business_id: businessId, email: data.email, password_hash: hash, first_name: data.first_name, last_name: data.last_name, phone: data.phone, role: data.role });
    return db('users').where({ id }).select('id', 'email', 'first_name', 'last_name', 'role', 'is_active').first();
  }
  async updateUser(userId, businessId, data) {
    const user = await db('users').where({ id: userId, business_id: businessId }).first();
    if (!user) throw ApiError.notFound('User not found');
    await db('users').where({ id: userId }).update({ ...cleanObject(data), updated_at: db.fn.now() });
    return db('users').where({ id: userId }).select('id', 'email', 'first_name', 'last_name', 'role', 'is_active').first();
  }
}

const settingsService = new SettingsService();
const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope(), authorize('super_admin', 'admin'));

// Business & Settings
router.get('/', asyncHandler(async (req, res) => { ApiResponse.ok('Settings', await settingsService.get(req.user.business_id)).send(res); }));
router.put('/business', validate({ body: z.object({
  name: z.string().min(1).max(255).optional(), address: z.string().max(1000).optional(), city: z.string().max(100).optional(),
  state: z.string().max(100).optional(), pincode: z.string().max(10).optional(), phone: z.string().max(20).optional(),
  email: z.string().email().optional(), gst_number: z.string().max(20).optional(),
}) }), asyncHandler(async (req, res) => { ApiResponse.ok('Business updated', await settingsService.updateBusiness(req.user.business_id, req.body)).send(res); }));
router.put('/config', validate({ body: z.object({
  tax_enabled: z.boolean().optional(), default_cgst: z.number().min(0).max(100).optional(), default_sgst: z.number().min(0).max(100).optional(),
  invoice_prefix: z.string().max(20).optional(), reward_points_per_100: z.number().int().nonnegative().optional(),
  reward_points_value: z.number().nonnegative().optional(), appointment_slot_duration: z.number().int().positive().optional(),
  booking_advance_days: z.number().int().positive().optional(), cancellation_policy: z.string().max(2000).optional(),
  feedback_enabled: z.boolean().optional(), auto_feedback_after_visit: z.boolean().optional(),
  working_hours_start: z.string().regex(/^\d{2}:\d{2}/).optional(), working_hours_end: z.string().regex(/^\d{2}:\d{2}/).optional(),
  weekly_off_day: z.number().int().min(0).max(6).optional(),
}) }), asyncHandler(async (req, res) => { ApiResponse.ok('Settings updated', await settingsService.updateSettings(req.user.business_id, req.body)).send(res); }));

// Commission profiles
router.get('/commission-profiles', asyncHandler(async (req, res) => { ApiResponse.ok('Profiles', await settingsService.getCommissionProfiles(req.user.business_id)).send(res); }));
router.post('/commission-profiles', validate({ body: z.object({
  name: z.string().min(1), type: z.enum(['flat', 'percentage', 'tiered']), value: z.number().nonnegative().optional(), rules: z.any().optional(),
}) }), asyncHandler(async (req, res) => { ApiResponse.created('Profile created', await settingsService.createCommissionProfile(req.user.business_id, req.body)).send(res); }));

// Service rooms
router.get('/rooms', asyncHandler(async (req, res) => { ApiResponse.ok('Rooms', await settingsService.getServiceRooms(req.user.business_id)).send(res); }));
router.post('/rooms', validate({ body: z.object({ name: z.string().min(1).max(100), capacity: z.number().int().positive().optional() }) }),
  asyncHandler(async (req, res) => { ApiResponse.created('Room created', await settingsService.createServiceRoom(req.user.business_id, req.body)).send(res); }));

// Notification templates
router.get('/notifications', asyncHandler(async (req, res) => { ApiResponse.ok('Templates', await settingsService.getNotificationTemplates(req.user.business_id)).send(res); }));
router.post('/notifications', validate({ body: z.object({
  event_type: z.string().min(1).max(100), channel: z.enum(['sms', 'email', 'whatsapp']),
  subject: z.string().max(255).optional(), body: z.string().min(1), is_active: z.boolean().optional(),
}) }), asyncHandler(async (req, res) => { ApiResponse.ok('Template saved', await settingsService.upsertNotificationTemplate(req.user.business_id, req.body)).send(res); }));

// Users management
router.get('/users', asyncHandler(async (req, res) => { ApiResponse.ok('Users', await settingsService.getUsers(req.user.business_id)).send(res); }));
router.post('/users', validate({ body: z.object({
  email: z.string().email(), password: z.string().min(8), first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(), phone: z.string().max(20).optional(),
  role: z.enum(['admin', 'manager', 'staff', 'receptionist']),
}) }), asyncHandler(async (req, res) => { ApiResponse.created('User created', await settingsService.createUser(req.user.business_id, req.body)).send(res); }));
router.put('/users/:id', validate({ params: idParam, body: z.object({
  first_name: z.string().min(1).max(100).optional(), last_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(), role: z.enum(['admin', 'manager', 'staff', 'receptionist']).optional(), is_active: z.boolean().optional(),
}) }), asyncHandler(async (req, res) => { ApiResponse.ok('User updated', await settingsService.updateUser(req.params.id, req.user.business_id, req.body)).send(res); }));

export default router;

import { db } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// ===== SERVICE =====
class FeedbackService {
  async getAll(businessId, query) {
    const base = db('customer_feedback as f')
      .join('customers as c', 'f.customer_id', 'c.id')
      .leftJoin('staff_members as sm', 'f.staff_member_id', 'sm.id')
      .leftJoin('users as u', 'sm.user_id', 'u.id')
      .where('f.business_id', businessId)
      .select('f.*', 'c.first_name as customer_name', 'c.phone as customer_phone', 'u.first_name as staff_name');
    if (query.rating) base.where('f.rating', query.rating);
    if (query.staff_member_id) base.where('f.staff_member_id', query.staff_member_id);
    return base.orderBy('f.created_at', 'desc').limit(100);
  }

  async create(businessId, data) {
    const customer = await db('customers').where({ id: data.customer_id, business_id: businessId }).first();
    if (!customer) throw ApiError.notFound('Customer not found');
    const [id] = await db('customer_feedback').insert({ ...data, business_id: businessId });
    return db('customer_feedback').where({ id }).first();
  }

  async getStats(businessId) {
    const stats = await db('customer_feedback').where({ business_id: businessId }).select(
      db.raw('COUNT(*) as total_feedback'),
      db.raw('ROUND(AVG(rating), 1) as average_rating'),
      db.raw("SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_count"),
      db.raw("SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_count"),
    ).first();
    const distribution = await db('customer_feedback').where({ business_id: businessId })
      .select('rating', db.raw('COUNT(*) as count')).groupBy('rating').orderBy('rating');
    return { ...stats, distribution };
  }
}

const feedbackService = new FeedbackService();

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.get('/', asyncHandler(async (req, res) => { ApiResponse.ok('Feedback', await feedbackService.getAll(req.user.business_id, req.query)).send(res); }));
router.get('/stats', asyncHandler(async (req, res) => { ApiResponse.ok('Feedback stats', await feedbackService.getStats(req.user.business_id)).send(res); }));
router.post('/', validate({ body: z.object({
  customer_id: z.number().int().positive(), rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(), invoice_id: z.number().int().positive().optional(),
  appointment_id: z.number().int().positive().optional(), staff_member_id: z.number().int().positive().optional(),
}) }), asyncHandler(async (req, res) => { ApiResponse.created('Feedback submitted', await feedbackService.create(req.user.business_id, req.body)).send(res); }));

export default router;

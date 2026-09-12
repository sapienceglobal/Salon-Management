import { db } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanObject } from '../../utils/helpers.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// ===== SERVICE =====
class ExpenseService {
  async getAll(businessId, query) {
    const { page, limit, offset } = parsePagination(query);
    const base = db('expenses as e')
      .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
      .leftJoin('users as u', 'e.created_by', 'u.id')
      .where('e.business_id', businessId)
      .select('e.*', 'ec.name as category_name', 'u.first_name as created_by_name');

    if (query.category_id) base.where('e.category_id', query.category_id);
    if (query.start_date) base.where('e.expense_date', '>=', query.start_date);
    if (query.end_date) base.where('e.expense_date', '<=', query.end_date);
    if (query.payment_method) base.where('e.payment_method', query.payment_method);

    const [{ count }] = await base.clone().count('* as count');
    const expenses = await base.clone().orderBy('e.expense_date', 'desc').limit(limit).offset(offset);

    // Summary
    const [summary] = await db('expenses').where({ business_id: businessId })
      .modify(q => { if (query.start_date) q.where('expense_date', '>=', query.start_date); if (query.end_date) q.where('expense_date', '<=', query.end_date); })
      .select(db.raw('COALESCE(SUM(amount), 0) as total_expenses'), db.raw('COALESCE(SUM(tax_amount), 0) as total_tax'));

    return { expenses, summary, meta: buildPaginationMeta(parseInt(count, 10), page, limit) };
  }

  async create(businessId, userId, data) {
    const [id] = await db('expenses').insert({ ...data, business_id: businessId, created_by: userId });
    return db('expenses as e').leftJoin('expense_categories as ec', 'e.category_id', 'ec.id').where('e.id', id).select('e.*', 'ec.name as category_name').first();
  }

  async update(id, businessId, data) {
    const expense = await db('expenses').where({ id, business_id: businessId }).first();
    if (!expense) throw ApiError.notFound('Expense not found');
    await db('expenses').where({ id }).update({ ...cleanObject(data), updated_at: db.fn.now() });
    return db('expenses').where({ id }).first();
  }

  async delete(id, businessId) {
    const expense = await db('expenses').where({ id, business_id: businessId }).first();
    if (!expense) throw ApiError.notFound('Expense not found');
    await db('expenses').where({ id }).del();
  }

  // Categories
  async getCategories(businessId) { return db('expense_categories').where({ business_id: businessId, is_active: true }).orderBy('name'); }
  async createCategory(businessId, name) { const [id] = await db('expense_categories').insert({ business_id: businessId, name }); return db('expense_categories').where({ id }).first(); }
}

const expenseService = new ExpenseService();

// ===== CONTROLLERS =====
const getExpenses = asyncHandler(async (req, res) => { const r = await expenseService.getAll(req.user.business_id, req.query); ApiResponse.ok('Expenses', r.expenses, { ...r.meta, summary: r.summary }).send(res); });
const createExpense = asyncHandler(async (req, res) => { ApiResponse.created('Expense created', await expenseService.create(req.user.business_id, req.user.id, req.body)).send(res); });
const updateExpense = asyncHandler(async (req, res) => { ApiResponse.ok('Expense updated', await expenseService.update(req.params.id, req.user.business_id, req.body)).send(res); });
const deleteExpense = asyncHandler(async (req, res) => { await expenseService.delete(req.params.id, req.user.business_id); ApiResponse.ok('Expense deleted').send(res); });
const getCategories = asyncHandler(async (req, res) => { ApiResponse.ok('Categories', await expenseService.getCategories(req.user.business_id)).send(res); });
const createCategory = asyncHandler(async (req, res) => { ApiResponse.created('Category created', await expenseService.createCategory(req.user.business_id, req.body.name)).send(res); });

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.get('/categories', getCategories);
router.post('/categories', authorize('super_admin', 'admin', 'manager'), validate({ body: z.object({ name: z.string().min(1).max(255) }) }), createCategory);
router.get('/', getExpenses);
router.post('/', authorize('super_admin', 'admin', 'manager'), validate({ body: z.object({
  category_id: z.number().int().positive().optional(), amount: z.number().positive(),
  tax_amount: z.number().nonnegative().optional(), description: z.string().max(1000).optional(),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer']).optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}) }), createExpense);
router.put('/:id', authorize('super_admin', 'admin', 'manager'), validate({ params: idParam }), updateExpense);
router.delete('/:id', authorize('super_admin', 'admin'), validate({ params: idParam }), deleteExpense);

export default router;

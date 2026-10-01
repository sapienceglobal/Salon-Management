import { db } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanObject } from '../../utils/helpers.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { singleDocument } from '../../utils/fileUpload.js';
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
      .where('e.business_id', businessId);

    if (query.category_id && query.category_id !== 'all') {
      base.where('e.category_id', query.category_id);
    }
    if (query.start_date) {
      base.where('e.expense_date', '>=', query.start_date);
    }
    if (query.end_date) {
      base.where('e.expense_date', '<=', query.end_date);
    }
    if (query.payment_method && query.payment_method !== 'all') {
      base.where('e.payment_method', query.payment_method);
    }
    if (query.search && query.search.trim()) {
      const s = `%${query.search.trim()}%`;
      base.where((builder) => {
        builder
          .where('e.description', 'like', s)
          .orWhere('e.reference_no', 'like', s)
          .orWhere('e.notes', 'like', s)
          .orWhere('ec.name', 'like', s)
          .orWhere('u.first_name', 'like', s)
          .orWhere('u.last_name', 'like', s);
      });
    }

    const [{ count }] = await base.clone().count('* as count');
    const expenses = await base.clone()
      .select(
        'e.*',
        'ec.name as category_name',
        db.raw("TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as created_by_name")
      )
      .orderBy('e.expense_date', 'desc')
      .orderBy('e.id', 'desc')
      .limit(limit).offset(offset);

    // Summary stats
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${currentYear}-${currentMonth}-01`;
    // Last day of month
    const nextMonth = new Date(currentYear, now.getMonth() + 1, 0);
    const monthEnd = `${currentYear}-${currentMonth}-${String(nextMonth.getDate()).padStart(2, '0')}`;

    // Overall & Month metrics
    const [overallStats] = await db('expenses')
      .where({ business_id: businessId })
      .select(
        db.raw('COALESCE(SUM(amount), 0) as total_expenses'),
        db.raw('COALESCE(SUM(tax_amount), 0) as total_tax'),
        db.raw('COALESCE(SUM(CASE WHEN expense_date >= ? AND expense_date <= ? THEN amount ELSE 0 END), 0) as this_month_expense', [monthStart, monthEnd])
      );

    return {
      expenses,
      summary: {
        total_expenses: parseFloat(overallStats?.total_expenses || 0),
        total_tax: parseFloat(overallStats?.total_tax || 0),
        this_month_expense: parseFloat(overallStats?.this_month_expense || 0),
      },
      meta: buildPaginationMeta(parseInt(count, 10), page, limit),
    };
  }

  async getById(id, businessId) {
    const expense = await db('expenses as e')
      .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
      .leftJoin('users as u', 'e.created_by', 'u.id')
      .where('e.id', id)
      .where('e.business_id', businessId)
      .select(
        'e.*',
        'ec.name as category_name',
        db.raw("TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as created_by_name")
      )
      .first();

    if (!expense) throw ApiError.notFound('Expense not found');
    return expense;
  }

  async create(businessId, userId, data) {
    const insertPayload = cleanObject({
      business_id: businessId,
      created_by: userId,
      category_id: data.category_id ? Number(data.category_id) : null,
      amount: data.amount,
      tax_amount: data.tax_amount ?? 0,
      include_in_tax: data.include_in_tax !== undefined ? Boolean(data.include_in_tax) : true,
      payment_method: data.payment_method || 'cash',
      reference_no: data.reference_no || null,
      description: data.description,
      notes: data.notes || null,
      receipt_url: data.receipt_url || null,
      expense_date: data.expense_date,
    });

    const [id] = await db('expenses').insert(insertPayload);
    return this.getById(id, businessId);
  }

  async update(id, businessId, data) {
    const expense = await db('expenses').where({ id, business_id: businessId }).first();
    if (!expense) throw ApiError.notFound('Expense not found');

    const updateData = cleanObject({
      category_id: data.category_id !== undefined ? (data.category_id ? Number(data.category_id) : null) : undefined,
      amount: data.amount,
      tax_amount: data.tax_amount,
      include_in_tax: data.include_in_tax !== undefined ? Boolean(data.include_in_tax) : undefined,
      payment_method: data.payment_method,
      reference_no: data.reference_no,
      description: data.description,
      notes: data.notes,
      receipt_url: data.receipt_url,
      expense_date: data.expense_date,
      updated_at: db.fn.now(),
    });

    await db('expenses').where({ id }).update(updateData);
    return this.getById(id, businessId);
  }

  async delete(id, businessId) {
    const expense = await db('expenses').where({ id, business_id: businessId }).first();
    if (!expense) throw ApiError.notFound('Expense not found');
    await db('expenses').where({ id }).del();
  }

  async bulkDelete(ids, businessId) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    return db('expenses').where({ business_id: businessId }).whereIn('id', ids).del();
  }

  // Categories
  async getCategories(businessId) {
    return db('expense_categories')
      .where({ business_id: businessId, is_active: true })
      .orderBy('name');
  }

  async createCategory(businessId, name, description) {
    const [id] = await db('expense_categories').insert({
      business_id: businessId,
      name,
      description: description || null,
    });
    return db('expense_categories').where({ id }).first();
  }
}

const expenseService = new ExpenseService();

// ===== CONTROLLERS =====
const getExpenses = asyncHandler(async (req, res) => {
  const r = await expenseService.getAll(req.user.business_id, req.query);
  ApiResponse.ok('Expenses', r.expenses, { ...r.meta, summary: r.summary }).send(res);
});

const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getById(req.params.id, req.user.business_id);
  ApiResponse.ok('Expense details', expense).send(res);
});

const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.create(req.user.business_id, req.user.id, req.body);
  ApiResponse.created('Expense created successfully', expense).send(res);
});

const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.update(req.params.id, req.user.business_id, req.body);
  ApiResponse.ok('Expense updated successfully', expense).send(res);
});

const deleteExpense = asyncHandler(async (req, res) => {
  await expenseService.delete(req.params.id, req.user.business_id);
  ApiResponse.ok('Expense deleted successfully').send(res);
});

const bulkDeleteExpenses = asyncHandler(async (req, res) => {
  const count = await expenseService.bulkDelete(req.body.ids, req.user.business_id);
  ApiResponse.ok(`${count} expenses deleted`, { count }).send(res);
});

const getCategories = asyncHandler(async (req, res) => {
  ApiResponse.ok('Categories', await expenseService.getCategories(req.user.business_id)).send(res);
});

const createCategory = asyncHandler(async (req, res) => {
  ApiResponse.created('Category created', await expenseService.createCategory(req.user.business_id, req.body.name, req.body.description)).send(res);
});

const uploadReceipt = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded');
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  ApiResponse.ok('Receipt uploaded successfully', { url: fileUrl, filename: req.file.filename }).send(res);
});

// ===== VALIDATION SCHEMAS =====
const expensePayloadSchema = z.object({
  category_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional().nullable(),
  amount: z.union([z.number().positive(), z.string().transform(Number)]),
  tax_amount: z.union([z.number().nonnegative(), z.string().transform(Number)]).optional().default(0),
  include_in_tax: z.boolean().optional().default(true),
  description: z.string().min(1, 'Description is required').max(1000),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer']).optional().default('cash'),
  reference_no: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  receipt_url: z.string().max(500).optional().nullable(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD)'),
});

const expenseUpdateSchema = expensePayloadSchema.partial();

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.post('/upload', authorize('super_admin', 'admin', 'manager'), singleDocument('receipt'), uploadReceipt);
router.get('/categories', getCategories);
router.post('/categories', authorize('super_admin', 'admin', 'manager'), validate({ body: z.object({ name: z.string().min(1).max(255), description: z.string().max(500).optional() }) }), createCategory);

router.get('/', getExpenses);
router.post('/bulk-delete', authorize('super_admin', 'admin'), bulkDeleteExpenses);
router.get('/:id', validate({ params: idParam }), getExpenseById);
router.post('/', authorize('super_admin', 'admin', 'manager'), validate({ body: expensePayloadSchema }), createExpense);
router.put('/:id', authorize('super_admin', 'admin', 'manager'), validate({ params: idParam, body: expenseUpdateSchema }), updateExpense);
router.delete('/:id', authorize('super_admin', 'admin'), validate({ params: idParam }), deleteExpense);

export default router;

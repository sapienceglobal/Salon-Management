import { db } from '../../config/database.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';

class ReportService {
  async salesReport(businessId, startDate, endDate) {
    const [summary] = await db('invoices').where({ business_id: businessId }).whereNot('status', 'cancelled')
      .whereBetween('created_at', [startDate, `${endDate} 23:59:59`])
      .select(
        db.raw('COUNT(*) as total_invoices'), db.raw('COALESCE(SUM(subtotal), 0) as gross_sales'),
        db.raw('COALESCE(SUM(discount_amount), 0) as total_discounts'),
        db.raw('COALESCE(SUM(tax_amount), 0) as total_tax'),
        db.raw('COALESCE(SUM(total_amount), 0) as net_revenue'),
        db.raw('COALESCE(SUM(paid_amount), 0) as collected'),
        db.raw('COALESCE(SUM(due_amount), 0) as outstanding'),
        db.raw('COALESCE(SUM(tip_amount), 0) as total_tips'),
        db.raw('COALESCE(AVG(total_amount), 0) as avg_ticket_size')
      );

    const daily = await db('invoices').where({ business_id: businessId }).whereNot('status', 'cancelled')
      .whereBetween('created_at', [startDate, `${endDate} 23:59:59`])
      .select(db.raw('DATE(created_at) as date'), db.raw('COUNT(*) as invoices'), db.raw('SUM(total_amount) as revenue'))
      .groupByRaw('DATE(created_at)').orderBy('date');

    const byPaymentMethod = await db('payments').where({ business_id: businessId, status: 'success' })
      .whereBetween('created_at', [startDate, `${endDate} 23:59:59`])
      .select('payment_method', db.raw('COUNT(*) as count'), db.raw('SUM(amount) as total'))
      .groupBy('payment_method');

    return { summary, daily, by_payment_method: byPaymentMethod };
  }

  async serviceReport(businessId, startDate, endDate) {
    return db('invoice_items as ii').join('invoices as i', 'ii.invoice_id', 'i.id')
      .where({ 'i.business_id': businessId }).whereNot('i.status', 'cancelled')
      .whereBetween('i.created_at', [startDate, `${endDate} 23:59:59`])
      .select('ii.item_type', 'ii.item_name',
        db.raw('SUM(ii.quantity) as quantity_sold'), db.raw('SUM(ii.total_price) as revenue'),
        db.raw('SUM(ii.discount) as discounts'), db.raw('SUM(ii.tax_amount) as tax'))
      .groupBy('ii.item_type', 'ii.item_name').orderBy('revenue', 'desc');
  }

  async staffReport(businessId, startDate, endDate) {
    return db('invoice_items as ii')
      .join('invoices as i', 'ii.invoice_id', 'i.id')
      .join('staff_members as sm', 'ii.staff_member_id', 'sm.id')
      .join('users as u', 'sm.user_id', 'u.id')
      .where({ 'i.business_id': businessId }).whereNot('i.status', 'cancelled')
      .whereBetween('i.created_at', [startDate, `${endDate} 23:59:59`])
      .select(
        'ii.staff_member_id', 'u.first_name', 'u.last_name',
        db.raw('COUNT(DISTINCT i.id) as invoices_handled'),
        db.raw('SUM(ii.quantity) as services_done'),
        db.raw('SUM(ii.total_price) as revenue_generated')
      )
      .groupBy('ii.staff_member_id', 'u.first_name', 'u.last_name')
      .orderBy('revenue_generated', 'desc');
  }

  async customerReport(businessId, startDate, endDate) {
    const topCustomers = await db('invoices as i')
      .join('customers as c', 'i.customer_id', 'c.id')
      .where({ 'i.business_id': businessId }).whereNot('i.status', 'cancelled')
      .whereBetween('i.created_at', [startDate, `${endDate} 23:59:59`])
      .select('c.id', 'c.first_name', 'c.last_name', 'c.phone',
        db.raw('COUNT(*) as visit_count'), db.raw('SUM(i.total_amount) as total_spent'))
      .groupBy('c.id', 'c.first_name', 'c.last_name', 'c.phone')
      .orderBy('total_spent', 'desc').limit(50);

    const [retention] = await db('customers').where({ business_id: businessId, is_active: true }).select(
      db.raw('COUNT(*) as total'),
      db.raw("SUM(CASE WHEN total_visits = 0 THEN 1 ELSE 0 END) as never_visited"),
      db.raw("SUM(CASE WHEN total_visits = 1 THEN 1 ELSE 0 END) as one_visit"),
      db.raw("SUM(CASE WHEN total_visits BETWEEN 2 AND 5 THEN 1 ELSE 0 END) as regular"),
      db.raw("SUM(CASE WHEN total_visits > 5 THEN 1 ELSE 0 END) as loyal"),
      db.raw("SUM(CASE WHEN last_visit_at < DATE_SUB(NOW(), INTERVAL 90 DAY) AND total_visits > 0 THEN 1 ELSE 0 END) as defected")
    );

    return { top_customers: topCustomers, retention };
  }

  async expenseReport(businessId, startDate, endDate) {
    const [summary] = await db('expenses').where({ business_id: businessId })
      .whereBetween('expense_date', [startDate, endDate])
      .select(db.raw('COALESCE(SUM(amount), 0) as total'), db.raw('COALESCE(SUM(tax_amount), 0) as tax'), db.raw('COUNT(*) as count'));

    const byCategory = await db('expenses as e')
      .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
      .where('e.business_id', businessId)
      .whereBetween('e.expense_date', [startDate, endDate])
      .select('ec.name as category', db.raw('SUM(e.amount) as total'), db.raw('COUNT(*) as count'))
      .groupBy('ec.name').orderBy('total', 'desc');

    return { summary, by_category: byCategory };
  }

  async gstReport(businessId, startDate, endDate) {
    const [sales] = await db('invoices').where({ business_id: businessId }).whereNot('status', 'cancelled')
      .whereBetween('created_at', [startDate, `${endDate} 23:59:59`])
      .select(
        db.raw('COALESCE(SUM(subtotal), 0) as taxable_amount'),
        db.raw('COALESCE(SUM(cgst_amount), 0) as cgst'),
        db.raw('COALESCE(SUM(sgst_amount), 0) as sgst'),
        db.raw('COALESCE(SUM(tax_amount), 0) as total_tax')
      );

    const [expenses] = await db('expenses').where({ business_id: businessId })
      .whereBetween('expense_date', [startDate, endDate])
      .select(db.raw('COALESCE(SUM(tax_amount), 0) as input_tax'));

    return { output_tax: sales, input_tax: expenses, net_tax_liability: parseFloat((sales.total_tax - expenses.input_tax).toFixed(2)) };
  }
}

const reportService = new ReportService();

const dateRangeSchema = {
  query: z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
};

const router = Router();
router.use(authenticate, businessScope(), authorize('super_admin', 'admin', 'manager'));

router.get('/sales', validate(dateRangeSchema), asyncHandler(async (req, res) => {
  ApiResponse.ok('Sales report', await reportService.salesReport(req.user.business_id, req.query.start_date, req.query.end_date)).send(res);
}));
router.get('/services', validate(dateRangeSchema), asyncHandler(async (req, res) => {
  ApiResponse.ok('Service report', await reportService.serviceReport(req.user.business_id, req.query.start_date, req.query.end_date)).send(res);
}));
router.get('/staff', validate(dateRangeSchema), asyncHandler(async (req, res) => {
  ApiResponse.ok('Staff report', await reportService.staffReport(req.user.business_id, req.query.start_date, req.query.end_date)).send(res);
}));
router.get('/customers', validate(dateRangeSchema), asyncHandler(async (req, res) => {
  ApiResponse.ok('Customer report', await reportService.customerReport(req.user.business_id, req.query.start_date, req.query.end_date)).send(res);
}));
router.get('/expenses', validate(dateRangeSchema), asyncHandler(async (req, res) => {
  ApiResponse.ok('Expense report', await reportService.expenseReport(req.user.business_id, req.query.start_date, req.query.end_date)).send(res);
}));
router.get('/gst', validate(dateRangeSchema), asyncHandler(async (req, res) => {
  ApiResponse.ok('GST report', await reportService.gstReport(req.user.business_id, req.query.start_date, req.query.end_date)).send(res);
}));

export default router;

import { db } from '../../config/database.js';
import { cache } from '../../utils/cache.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';

// ===== DASHBOARD SERVICE =====
class DashboardService {

  /**
   * Main dashboard summary — stat cards data
   */
  async getSummary(businessId) {
    const cacheKey = `dashboard:summary:${businessId}`;

    return cache.getOrSet(cacheKey, async () => {
      const todayObj = new Date();
      const today = todayObj.toISOString().split('T')[0];
      const startOfMonth = `${today.substring(0, 7)}-01`;

      const yesterdayObj = new Date(todayObj);
      yesterdayObj.setDate(todayObj.getDate() - 1);
      const yesterday = yesterdayObj.toISOString().split('T')[0];

      const firstDayLastMonthObj = new Date(todayObj.getFullYear(), todayObj.getMonth() - 1, 1);
      const lastDayLastMonthObj = new Date(todayObj.getFullYear(), todayObj.getMonth(), 0);
      
      const pad = (n) => n.toString().padStart(2, '0');
      const firstDayLastMonth = `${firstDayLastMonthObj.getFullYear()}-${pad(firstDayLastMonthObj.getMonth() + 1)}-01`;
      const lastDayLastMonth = `${lastDayLastMonthObj.getFullYear()}-${pad(lastDayLastMonthObj.getMonth() + 1)}-${pad(lastDayLastMonthObj.getDate())}`;

      const calcTrend = (current, previous) => {
        if (previous === 0) return { value: current > 0 ? 100 : 0, is_up: current >= 0 };
        const diff = current - previous;
        const pct = Math.round((diff / previous) * 100);
        return { value: Math.abs(pct), is_up: pct >= 0 };
      };

      // Today's revenue stats
      const [todayStats] = await db('invoices')
        .where({ business_id: businessId })
        .where('created_at', '>=', `${today} 00:00:00`)
        .where('created_at', '<=', `${today} 23:59:59`)
        .whereNot('status', 'cancelled')
        .select(
          db.raw('COUNT(*) as today_invoices'),
          db.raw('COALESCE(SUM(total_amount), 0) as today_revenue'),
          db.raw('COALESCE(SUM(paid_amount), 0) as today_collected')
        );

      const [yesterdayStats] = await db('invoices')
        .where({ business_id: businessId })
        .where('created_at', '>=', `${yesterday} 00:00:00`)
        .where('created_at', '<=', `${yesterday} 23:59:59`)
        .whereNot('status', 'cancelled')
        .select(
          db.raw('COUNT(*) as yesterday_invoices'),
          db.raw('COALESCE(SUM(total_amount), 0) as yesterday_revenue'),
          db.raw('COALESCE(SUM(paid_amount), 0) as yesterday_collected')
        );

      // Today's appointment counts
      const [todayAppointments] = await db('appointments')
        .where({ business_id: businessId, appointment_date: today })
        .whereNotIn('status', ['cancelled'])
        .select(
          db.raw('COUNT(*) as total'),
          db.raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
          db.raw("SUM(CASE WHEN status = 'planned' OR status = 'pending' THEN 1 ELSE 0 END) as upcoming"),
          db.raw("SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing")
        );

      const [yesterdayAppointments] = await db('appointments')
        .where({ business_id: businessId, appointment_date: yesterday })
        .whereNotIn('status', ['cancelled'])
        .select(
          db.raw('COUNT(*) as total'),
          db.raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
        );

      // Monthly stats
      const [monthlyStats] = await db('invoices')
        .where({ business_id: businessId })
        .where('created_at', '>=', `${startOfMonth} 00:00:00`)
        .whereNot('status', 'cancelled')
        .select(
          db.raw('COUNT(*) as monthly_invoices'),
          db.raw('COALESCE(SUM(total_amount), 0) as monthly_revenue'),
          db.raw('COALESCE(SUM(paid_amount), 0) as monthly_collected')
        );

      const [lastMonthStats] = await db('invoices')
        .where({ business_id: businessId })
        .where('created_at', '>=', `${firstDayLastMonth} 00:00:00`)
        .where('created_at', '<=', `${lastDayLastMonth} 23:59:59`)
        .whereNot('status', 'cancelled')
        .select(
          db.raw('COALESCE(SUM(total_amount), 0) as last_month_revenue'),
          db.raw('COALESCE(SUM(paid_amount), 0) as last_month_collected')
        );

      // Monthly expenses
      const [monthlyExpenses] = await db('expenses')
        .where({ business_id: businessId })
        .where('expense_date', '>=', startOfMonth)
        .select(db.raw('COALESCE(SUM(amount), 0) as monthly_expenses'));

      // Customer stats
      const [customerStats] = await db('customers')
        .where({ business_id: businessId, is_active: true })
        .select(db.raw('COUNT(*) as total_customers'));

      const [newCustomers] = await db('customers')
        .where({ business_id: businessId })
        .where('created_at', '>=', `${startOfMonth} 00:00:00`)
        .select(db.raw('COUNT(*) as new_customers'));

      const [lastMonthCustomers] = await db('customers')
        .where({ business_id: businessId })
        .where('created_at', '>=', `${firstDayLastMonth} 00:00:00`)
        .where('created_at', '<=', `${lastDayLastMonth} 23:59:59`)
        .select(db.raw('COUNT(*) as new_customers'));

      // Active staff count
      const [staffStats] = await db('users')
        .where({ business_id: businessId, is_active: true })
        .whereIn('role', ['staff', 'manager', 'receptionist'])
        .select(db.raw('COUNT(*) as active_staff'));

      // Low stock products
      const lowStock = await db('products')
        .where({ business_id: businessId, is_active: true })
        .whereRaw('stock_quantity <= min_stock_alert')
        .select('id', 'name', 'category', 'stock_quantity', 'min_stock_alert')
        .limit(10);

      // Pending commissions
      let pendingCommissions = { count: 0, total: 0 };
      try {
        const [pc] = await db('staff_commissions')
          .where({ business_id: businessId, status: 'pending' })
          .select(db.raw('COUNT(*) as count'), db.raw('COALESCE(SUM(commission_amount), 0) as total'));
        pendingCommissions = pc;
      } catch { /* table may not exist yet */ }

      const tRev = parseFloat(todayStats.today_revenue || 0);
      const yRev = parseFloat(yesterdayStats.yesterday_revenue || 0);
      const tAppts = parseInt(todayAppointments.total || 0);
      const yAppts = parseInt(yesterdayAppointments.total || 0);
      const mRev = parseFloat(monthlyStats.monthly_revenue || 0);
      const lmRev = parseFloat(lastMonthStats.last_month_revenue || 0);
      const tCusts = parseInt(newCustomers.new_customers || 0);
      const lmCusts = parseInt(lastMonthCustomers.new_customers || 0);

      return {
        today: {
          invoices: parseInt(todayStats.today_invoices || 0),
          revenue: tRev,
          collected: parseFloat(todayStats.today_collected || 0),
          appointments: {
            total: tAppts,
            completed: parseInt(todayAppointments.completed || 0),
            upcoming: parseInt(todayAppointments.upcoming || 0),
            ongoing: parseInt(todayAppointments.ongoing || 0)
          }
        },
        monthly: {
          invoices: parseInt(monthlyStats.monthly_invoices || 0),
          revenue: mRev,
          collected: parseFloat(monthlyStats.monthly_collected || 0),
          expenses: parseFloat(monthlyExpenses.monthly_expenses || 0),
          net_profit: parseFloat(monthlyStats.monthly_collected || 0) - parseFloat(monthlyExpenses.monthly_expenses || 0)
        },
        customers: {
          total: parseInt(customerStats.total_customers || 0),
          new_this_month: tCusts
        },
        staff: {
          active: parseInt(staffStats.active_staff || 0)
        },
        alerts: {
          low_stock: lowStock,
          pending_commissions: pendingCommissions
        },
        trends: {
          today_revenue: calcTrend(tRev, yRev),
          today_appointments: calcTrend(tAppts, yAppts),
          monthly_revenue: calcTrend(mRev, lmRev),
          monthly_customers: calcTrend(tCusts, lmCusts)
        }
      };
    }, 60); // 60s cache
  }

  /**
   * Revenue chart data — monthly or daily
   */
  async getRevenueChart(businessId, startDate, endDate) {
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || `${today.substring(0, 7)}-01`;
    const end = endDate || today;
    
    // Group by daily if range <= 31 days, otherwise monthly
    const startD = new Date(start);
    const endD = new Date(end);
    const diffDays = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24));
    
    let chartQuery = db('invoices')
      .where({ business_id: businessId })
      .whereNot('status', 'cancelled')
      .where('created_at', '>=', `${start} 00:00:00`)
      .where('created_at', '<=', `${end} 23:59:59`);
      
    let chartRows = [];
    if (diffDays <= 31) {
      chartRows = await chartQuery.clone()
        .select(db.raw('DATE(created_at) as label'), db.raw('COALESCE(SUM(total_amount), 0) as revenue'))
        .groupByRaw('DATE(created_at)').orderBy('label');
    } else {
      const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const rawRows = await chartQuery.clone()
        .select(db.raw('YEAR(created_at) as y'), db.raw('MONTH(created_at) as m'), db.raw('COALESCE(SUM(total_amount), 0) as revenue'))
        .groupByRaw('YEAR(created_at), MONTH(created_at)').orderBy('y').orderBy('m');
      
      chartRows = rawRows.map(r => ({
        label: `${MONTH_NAMES[parseInt(r.m) - 1]} ${r.y}`,
        revenue: r.revenue
      }));
    }
    
    const chart = chartRows.map(r => ({ label: r.label, revenue: parseFloat(r.revenue) }));
    
    // Stats for the range
    const [stats] = await db('invoices')
      .where({ business_id: businessId })
      .whereNot('status', 'cancelled')
      .where('created_at', '>=', `${start} 00:00:00`)
      .where('created_at', '<=', `${end} 23:59:59`)
      .select(
        db.raw('COALESCE(SUM(total_amount), 0) as revenue'),
        db.raw('COALESCE(SUM(paid_amount), 0) as collected')
      );
      
    const [exp] = await db('expenses')
      .where({ business_id: businessId })
      .where('expense_date', '>=', start)
      .where('expense_date', '<=', end)
      .select(db.raw('COALESCE(SUM(amount), 0) as expenses'));
      
    const revenue = parseFloat(stats?.revenue || 0);
    const collected = parseFloat(stats?.collected || 0);
    const expenses = parseFloat(exp?.expenses || 0);
    const net_profit = collected - expenses;
    
    return { chart, stats: { revenue, collected, expenses, net_profit } };
  }

  async getTopServices(businessId) {
    const startOfMonth = `${new Date().toISOString().substring(0, 7)}-01`;

    try {
      const rows = await db('invoice_items as ii')
        .join('invoices as i', 'ii.invoice_id', 'i.id')
        .leftJoin('salon_services as ss', 'ii.item_id', 'ss.id')
        .where({ 'i.business_id': businessId, 'ii.item_type': 'service' })
        .whereNot('i.status', 'cancelled')
        .where('i.created_at', '>=', startOfMonth)
        .select('ii.item_name as name', 'ss.category_id', 'ss.id as id', db.raw('SUM(ii.quantity) as count'), db.raw('SUM(ii.total_price) as revenue'))
        .groupBy('ii.item_name', 'ss.category_id', 'ss.id').orderBy('revenue', 'desc').limit(5);

      if (rows.length > 0) {
        return rows.map(r => ({ id: r.id, category_id: r.category_id, name: r.name, count: parseInt(r.count), revenue: parseFloat(r.revenue) }));
      }
    } catch { /* fallback below */ }

    // Fallback: count by appointments
    const rows = await db('appointment_services as aps')
      .join('appointments as a', 'aps.appointment_id', 'a.id')
      .join('salon_services as s', 'aps.service_id', 's.id')
      .where({ 'a.business_id': businessId })
      .whereNotIn('a.status', ['cancelled'])
      .where('a.appointment_date', '>=', startOfMonth)
      .select('s.id', 's.category_id', 's.name', db.raw('COUNT(*) as count'), db.raw('SUM(s.price) as revenue'))
      .groupBy('s.id', 's.category_id', 's.name').orderBy('count', 'desc').limit(5);

    return rows.map(r => ({ id: r.id, category_id: r.category_id, name: r.name, count: parseInt(r.count), revenue: parseFloat(r.revenue || 0) }));
  }

  /**
   * Today's appointments with full details
   */
  async getTodayAppointments(businessId) {
    const today = new Date().toISOString().split('T')[0];

    const rows = await db('appointments as a')
      .join('customers as c', 'a.customer_id', 'c.id')
      .leftJoin('appointment_services as aps', 'a.id', 'aps.appointment_id')
      .leftJoin('salon_services as s', 'aps.service_id', 's.id')
      .leftJoin('staff_members as sm', 'a.staff_member_id', 'sm.id')
      .leftJoin('users as u', 'sm.user_id', 'u.id')
      .where({ 'a.business_id': businessId, 'a.appointment_date': today })
      .whereNotIn('a.status', ['cancelled'])
      .select(
        'a.id',
        'a.start_time',
        'a.end_time',
        'a.status',
        'a.notes',
        db.raw("CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) as customer_name"),
        's.name as service_name',
        's.price as service_price',
        db.raw("COALESCE(u.first_name, 'Unassigned') as staff_name")
      )
      .orderBy('a.start_time', 'asc');

    return rows;
  }

  /**
   * Upcoming appointments (tomorrow + next 7 days)
   */
  async getUpcomingAppointments(businessId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const rows = await db('appointments as a')
      .join('customers as c', 'a.customer_id', 'c.id')
      .leftJoin('appointment_services as aps', 'a.id', 'aps.appointment_id')
      .leftJoin('salon_services as s', 'aps.service_id', 's.id')
      .where({ 'a.business_id': businessId })
      .where('a.appointment_date', '>=', tomorrow.toISOString().split('T')[0])
      .where('a.appointment_date', '<=', nextWeek.toISOString().split('T')[0])
      .whereNotIn('a.status', ['cancelled', 'completed'])
      .select(
        'a.id',
        'a.appointment_date',
        'a.start_time',
        'a.status',
        db.raw("CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) as customer_name"),
        's.name as service_name'
      )
      .orderBy([{ column: 'a.appointment_date', order: 'asc' }, { column: 'a.start_time', order: 'asc' }])
      .limit(5);

    return rows;
  }

  /**
   * Staff performance — appointment counts & completion rates this month
   */
  async getStaffPerformance(businessId) {
    const startOfMonth = `${new Date().toISOString().substring(0, 7)}-01`;

    const rows = await db('users as u')
      .join('staff_members as sm', 'u.id', 'sm.user_id')
      .leftJoin(
        db('appointments')
          .where('appointment_date', '>=', startOfMonth)
          .whereNotIn('status', ['cancelled'])
          .select('staff_member_id')
          .select(db.raw('COUNT(*) as total_appointments'))
          .select(db.raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_appointments"))
          .groupBy('staff_member_id')
          .as('a'),
        'sm.id', 'a.staff_member_id'
      )
      .where({ 'u.business_id': businessId, 'u.is_active': true })
      .whereIn('u.role', ['staff', 'manager'])
      .select(
        'sm.id',
        'u.first_name as name',
        'sm.designation as role',
        db.raw('COALESCE(a.total_appointments, 0) as count'),
        db.raw('CASE WHEN COALESCE(a.total_appointments, 0) > 0 THEN ROUND((COALESCE(a.completed_appointments, 0) / a.total_appointments) * 100) ELSE 0 END as perf')
      )
      .orderBy('count', 'desc')
      .limit(5);

    return rows.map(r => ({
      ...r,
      count: parseInt(r.count),
      perf: parseInt(r.perf),
      role: r.role || 'Staff'
    }));
  }

  /**
   * Recent customers — last 5 added
   */
  async getRecentCustomers(businessId) {
    const rows = await db('customers')
      .where({ business_id: businessId, is_active: true })
      .select('id', 'first_name', 'last_name', 'phone', 'email', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(5);

    return rows;
  }

  /**
   * Low stock inventory items
   */
  async getLowStockProducts(businessId) {
    const rows = await db('products')
      .where({ business_id: businessId, is_active: true })
      .select('id', 'name', 'category', 'stock_quantity', 'min_stock_alert')
      .orderBy('stock_quantity', 'asc')
      .limit(5);

    return rows.map(r => ({
      ...r,
      low: r.stock_quantity <= r.min_stock_alert
    }));
  }
}

const dashboardService = new DashboardService();

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope(), authorize('super_admin', 'admin', 'manager'));

router.get('/summary', asyncHandler(async (req, res) => {
  const businessId = req.user.business_id;
  ApiResponse.ok('Dashboard summary', await dashboardService.getSummary(businessId)).send(res);
}));

router.get('/revenue-chart', asyncHandler(async (req, res) => {
  const businessId = req.user.business_id;
  ApiResponse.ok('Revenue chart', await dashboardService.getRevenueChart(businessId, req.query.startDate, req.query.endDate)).send(res);
}));

router.get('/top-services', asyncHandler(async (req, res) => {
  const businessId = req.user.business_id;
  ApiResponse.ok('Top services', await dashboardService.getTopServices(businessId)).send(res);
}));

router.get('/today-appointments', asyncHandler(async (req, res) => {
  const businessId = req.user.business_id;
  ApiResponse.ok("Today's appointments", await dashboardService.getTodayAppointments(businessId)).send(res);
}));

router.get('/upcoming-appointments', asyncHandler(async (req, res) => {
  const businessId = req.user.business_id;
  ApiResponse.ok('Upcoming appointments', await dashboardService.getUpcomingAppointments(businessId)).send(res);
}));

router.get('/staff-performance', asyncHandler(async (req, res) => {
  const businessId = req.user.business_id;
  ApiResponse.ok('Staff performance', await dashboardService.getStaffPerformance(businessId)).send(res);
}));

router.get('/recent-customers', asyncHandler(async (req, res) => {
  const businessId = req.user.business_id;
  ApiResponse.ok('Recent customers', await dashboardService.getRecentCustomers(businessId)).send(res);
}));

router.get('/inventory-alerts', asyncHandler(async (req, res) => {
  const businessId = req.user.business_id;
  ApiResponse.ok('Inventory alerts', await dashboardService.getLowStockProducts(businessId)).send(res);
}));

export default router;

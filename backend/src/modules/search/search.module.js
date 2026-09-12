import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { db } from '../../config/database.js';

const router = Router();

// Search controller
const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const businessId = req.user.business_id;

  if (!q || q.length < 2) {
    return ApiResponse.ok('No query provided', {
      customers: [],
      appointments: [],
      services: [],
      products: [],
      staff: [],
      invoices: [],
      expenses: [],
      enquiries: [],
      links: []
    }).send(res);
  }

  const query = `%${q}%`;

  // Static Links search
  const links = [];
  const keyword = q.toLowerCase();
  const possibleLinks = [
    { title: 'Dashboard', route: '/admin/dashboard', keywords: ['dashboard', 'home', 'stats', 'overview'] },
    { title: 'Billing / POS', route: '/admin/billing', keywords: ['billing', 'pos', 'cart', 'invoice', 'sale', 'sell'] },
    { title: 'Wallet', route: '/admin/wallet', keywords: ['wallet', 'money', 'balance', 'recharge'] },
    { title: 'Appointments', route: '/admin/appointments', keywords: ['appointment', 'calendar', 'booking', 'schedule'] },
    { title: 'Customers', route: '/admin/customers', keywords: ['customers', 'clients', 'users'] },
    { title: 'Services', route: '/admin/services', keywords: ['services', 'treatments', 'catalog'] },
    { title: 'Inventory', route: '/admin/inventory', keywords: ['inventory', 'products', 'stock'] },
    { title: 'Staff', route: '/admin/staff', keywords: ['staff', 'employee', 'team'] },
    { title: 'Expenses', route: '/admin/expenses', keywords: ['expenses', 'cost', 'spending'] },
    { title: 'Enquiries', route: '/admin/enquiry', keywords: ['enquiries', 'leads', 'prospects'] }
  ];

  for (const link of possibleLinks) {
    if (link.keywords.some(kw => kw.includes(keyword) || keyword.includes(kw))) {
      links.push(link);
    }
  }

  // Database searches concurrently
  const [
    customers,
    appointments,
    services,
    products,
    staff,
    invoices,
    expenses,
    enquiries
  ] = await Promise.all([
    // Customers
    db('customers')
      .select('id', 'first_name', 'last_name', 'phone', 'email')
      .where('business_id', businessId)
      .andWhere(builder => {
        builder.where('first_name', 'like', query)
          .orWhere('last_name', 'like', query)
          .orWhere('phone', 'like', query)
          .orWhere('email', 'like', query);
      })
      .limit(5),

    // Appointments (ID or Customer Name)
    db('appointments as a')
      .join('customers as c', 'a.customer_id', 'c.id')
      .select('a.id', 'a.appointment_date', 'a.start_time', 'a.status', 'c.first_name', 'c.last_name')
      .where('a.business_id', businessId)
      .andWhere(builder => {
        builder.where('a.id', 'like', query)
          .orWhere('c.first_name', 'like', query)
          .orWhere('c.last_name', 'like', query)
          .orWhere('c.phone', 'like', query);
      })
      .limit(5),

    // Services
    db('salon_services')
      .select('id', 'name', 'price', 'category_id')
      .where('business_id', businessId)
      .andWhere('name', 'like', query)
      .limit(5),

    // Products
    db('products')
      .select('id', 'name', 'sku', 'stock_quantity')
      .where('business_id', businessId)
      .andWhere(builder => {
        builder.where('name', 'like', query).orWhere('sku', 'like', query);
      })
      .limit(5),

    // Staff
    db('staff_members as sm')
      .join('users as u', 'sm.user_id', 'u.id')
      .select('sm.id', 'u.first_name', 'u.last_name', 'u.phone', 'u.role')
      .where('sm.business_id', businessId)
      .andWhere(builder => {
        builder.where('u.first_name', 'like', query)
          .orWhere('u.last_name', 'like', query)
          .orWhere('u.phone', 'like', query);
      })
      .limit(5),

    // Invoices / Billing
    db('invoices')
      .select('id', 'invoice_number', 'total_amount', 'status')
      .where('business_id', businessId)
      .andWhere('invoice_number', 'like', query)
      .limit(5),
      
    // Expenses
    db('expenses as e')
      .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
      .select('e.id', 'ec.name as category', 'e.amount', 'e.description as notes')
      .where('e.business_id', businessId)
      .andWhere(builder => {
        builder.where('ec.name', 'like', query)
          .orWhere('e.description', 'like', query);
      })
      .limit(5),

    // Enquiries
    db('leads')
      .select('id', 'name', 'phone', 'status')
      .where('business_id', businessId)
      .andWhere(builder => {
        builder.where('name', 'like', query)
          .orWhere('phone', 'like', query);
      })
      .limit(5)
  ]);

  return ApiResponse.ok('Search results retrieved', {
    customers,
    appointments,
    services,
    products,
    staff,
    invoices,
    expenses,
    enquiries,
    links
  }).send(res);
});

// All routes require authentication + business scope
router.use(authenticate, businessScope());

router.get('/', globalSearch);

export default router;

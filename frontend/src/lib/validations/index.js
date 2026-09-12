import { z } from 'zod';

export const customerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().max(100).optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').max(255).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD').optional().or(z.literal('')),
  anniversary: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD').optional().or(z.literal('')),
  address: z.string().max(1000).optional().or(z.literal('')),
  gst_number: z.string().max(20).optional().or(z.literal('')),
  source: z.enum(['walk_in', 'referral', 'online', 'campaign', '']).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const serviceSchema = z.object({
  category_id: z.string().min(1, 'Category is required').or(z.number()),
  name: z.string().min(1, 'Service name is required').max(100),
  description: z.string().max(1000).optional().or(z.literal('')),
  duration_minutes: z.string().min(1, 'Duration is required').or(z.number().min(1)),
  price: z.string().min(1, 'Price is required').or(z.number().min(0)),
  type: z.enum(['service', 'product', 'package']).optional(),
});

export const staffSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20).optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'staff']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  designation: z.string().max(100).optional().or(z.literal('')),
  specializations: z.string().optional().or(z.literal('')),
  bio: z.string().max(1000).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  color_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color code').optional().or(z.literal('')),
  specialization: z.string().max(255).optional().or(z.literal('')),
  employee_id: z.string().max(50).optional().or(z.literal('')),
  joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD').optional().or(z.literal('')),
  salary: z.string().optional().or(z.number().optional()).or(z.literal('')),
});

export const expenseSchema = z.object({
  category_id: z.string().min(1, 'Category is required').or(z.number()),
  amount: z.string().min(1, 'Amount is required').or(z.number().min(0.01)),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD'),
  tax_amount: z.number().optional(),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']),
  description: z.string().max(1000).optional().or(z.literal('')),
  vendor_name: z.string().max(255).optional().or(z.literal('')),
});

export const walletSchema = z.object({
  amount: z.string().min(1, 'Amount is required').or(z.number().min(0.01)),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const enquirySchema = z.object({
  customer_name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20),
  service_interest: z.string().max(255).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const walletTopupSchema = z.object({
  amount: z.string().min(1, 'Amount is required').or(z.number().min(0.01)),
  payment_method: z.enum(['upi', 'card', 'cash']),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const inventorySchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(50),
  barcode: z.string().max(50).optional().or(z.literal('')),
  brand: z.string().max(100).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
  unit: z.enum(['ml', 'gm', 'piece', 'bottle', 'box']).optional(),
  purchase_price: z.string().min(1, 'Required').or(z.number().min(0)),
  selling_price: z.string().min(1, 'Required').or(z.number().min(0)),
  stock_quantity: z.string().min(1, 'Required').or(z.number().min(0)),
  min_stock_alert: z.string().min(1, 'Required').or(z.number().min(0)),
  is_active: z.boolean().optional(),
});

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  location: z.string().max(255).optional().or(z.literal('')),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'converted', 'lost']).optional(),
  assigned_to: z.number().optional().or(z.literal('')),
  follow_up_date: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export const appointmentSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required').or(z.number()),
  staff_id: z.string().optional().or(z.number().nullable()).or(z.literal('')),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$|^\d{2}:\d{2}$/, 'Time format: HH:mm:ss or HH:mm'),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$|^\d{2}:\d{2}$/, 'Time format: HH:mm:ss or HH:mm'),
  status: z.enum(['planned', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  service_id: z.string().min(1, 'Service is required').or(z.number()),
});

export const formatZodErrors = (zodError) => {
  const errors = {};
  zodError.issues.forEach(issue => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  return errors;
};

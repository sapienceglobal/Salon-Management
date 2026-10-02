import { z } from 'zod';

const FRIENDLY_FIELD_NAMES = {
  first_name: 'First name',
  last_name: 'Last name',
  phone: 'Mobile number',
  email: 'Email address',
  name: 'Name',
  gender: 'Gender',
  category_id: 'Category',
  customer_id: 'Customer',
  staff_id: 'Staff member',
  service_id: 'Service',
  service_ids: 'Services',
  room_id: 'Room',
  price: 'Price',
  total_price: 'Total price',
  amount: 'Amount',
  duration_minutes: 'Duration',
  sku: 'SKU',
  barcode: 'Barcode',
  stock_quantity: 'Stock quantity',
  min_stock_alert: 'Minimum stock alert quantity',
  purchase_price: 'Purchase price',
  selling_price: 'Selling price',
  appointment_date: 'Appointment date',
  start_time: 'Start time',
  end_time: 'End time',
  role: 'Role',
  password: 'Password',
  expense_date: 'Expense date',
  description: 'Description',
  payment_method: 'Payment method',
  customer_name: 'Customer name',
  date_of_birth: 'Date of birth',
  anniversary: 'Anniversary date',
  notes: 'Notes',
  address: 'Address',
  gst_number: 'GST number',
  discount_percentage: 'Discount percentage',
  validity_days: 'Validity (days)',
  max_uses: 'Max uses',
  tax_percentage: 'Tax percentage',
  items: 'Package items',
  brand: 'Brand',
  category: 'Category',
  unit: 'Unit',
  designation: 'Designation',
  salary: 'Salary',
};

export function humanizeField(fieldName) {
  if (typeof fieldName !== 'string' || !fieldName) return 'This field';
  if (FRIENDLY_FIELD_NAMES[fieldName]) return FRIENDLY_FIELD_NAMES[fieldName];
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function cleanZodMessage(issue) {
  const path = issue.path && issue.path.length > 0 ? issue.path[issue.path.length - 1] : '';
  const label = humanizeField(path);
  const msg = (issue.message || '').trim();

  // Check if message is a raw technical zod message or generic placeholder
  const isRaw =
    !msg ||
    msg.includes('Invalid input') ||
    msg.includes('received undefined') ||
    msg.includes('expected string') ||
    msg.includes('expected number') ||
    msg.includes('Invalid option: expected') ||
    msg.toLowerCase() === 'required' ||
    msg.toLowerCase() === 'invalid';

  if (!isRaw && msg.length > 0) {
    return msg;
  }

  if (issue.code === 'invalid_type' || issue.code === 'invalid_union' || msg.includes('undefined')) {
    if (typeof path === 'string' && (path.includes('id') || path === 'role' || path === 'payment_method' || path === 'gender')) {
      return `Please select a valid ${label.toLowerCase()}`;
    }
    return `${label} is required`;
  }
  if (issue.code === 'invalid_value' || issue.code === 'invalid_enum_value' || issue.code === 'invalid_element') {
    return `Please select a valid ${label.toLowerCase()}`;
  }
  return `${label} is required`;
}

export const customerSchema = z.object({
  first_name: z.string({ message: 'First name is required' }).trim().min(1, 'First name is required').max(100, 'First name cannot exceed 100 characters'),
  last_name: z.string().trim().max(100, 'Last name cannot exceed 100 characters').optional().nullable().or(z.literal('')),
  phone: z.string({ message: 'Mobile number is required' })
    .trim()
    .min(1, 'Mobile number is required')
    .refine((val) => !val || val.replace(/\D/g, '').length >= 10, { message: 'Mobile number must be at least 10 digits' })
    .refine((val) => !val || val.length <= 20, { message: 'Mobile number cannot exceed 20 characters' }),
  email: z.string().trim().optional().nullable().or(z.literal('')).refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: 'Please enter a valid email address' }
  ),
  gender: z.enum(['male', 'female', 'other'], { message: 'Please select a gender' }).optional().nullable().or(z.literal('')),
  date_of_birth: z.string().optional().nullable().or(z.literal('')).refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: 'Date format: YYYY-MM-DD' }
  ),
  anniversary: z.string().optional().nullable().or(z.literal('')).refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: 'Date format: YYYY-MM-DD' }
  ),
  address: z.string().max(1000, 'Address cannot exceed 1000 characters').optional().nullable().or(z.literal('')),
  location: z.string().max(255).optional().nullable().or(z.literal('')),
  gst_number: z.string().max(20, 'GST number cannot exceed 20 characters').optional().nullable().or(z.literal('')),
  source: z.string().max(50, 'Source cannot exceed 50 characters').optional().nullable().or(z.literal('')),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable().or(z.literal('')),
  sms_opt_in: z.boolean().optional(),
  email_opt_in: z.boolean().optional(),
  whatsapp_opt_in: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string({ message: 'Category name is required' }).trim().min(1, 'Category name is required').max(50, 'Max 50 characters allowed'),
  description: z.string().max(200, 'Max 200 characters allowed').optional().nullable().or(z.literal('')),
  icon: z.string().max(100).optional().nullable().or(z.literal('')),
  display_order: z.union([z.number(), z.string()]).optional().nullable(),
  sort_order: z.union([z.number(), z.string()]).optional().nullable(),
});

export const serviceSchema = z.object({
  category_id: z.union([
    z.string().min(1, 'Please select a category'),
    z.number().min(1, 'Please select a category')
  ], { message: 'Please select a category' }),
  name: z.string({ message: 'Service name is required' }).trim().min(1, 'Service name is required').max(100, 'Service name cannot exceed 100 characters'),
  description: z.string().max(1000).optional().nullable().or(z.literal('')),
  duration_minutes: z.union([
    z.string().trim().min(1, 'Duration is required'),
    z.number().min(1, 'Duration must be at least 1 minute')
  ], { message: 'Duration is required' }),
  price: z.union([
    z.string().trim().min(1, 'Price is required'),
    z.number().min(0, 'Price must be 0 or greater')
  ], { message: 'Price is required' }),
  discounted_price: z.union([z.string(), z.number()]).optional().nullable().or(z.literal('')),
  type: z.enum(['service', 'product', 'package']).optional().nullable(),
  is_active: z.boolean().optional(),
  online_booking: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  requires_consultation: z.boolean().optional(),
  tags: z.string().max(500).optional().nullable().or(z.literal('')),
  service_color: z.string().max(20).optional().nullable().or(z.literal('')),
  service_staff: z.string().max(255).optional().nullable().or(z.literal('')),
  sort_order: z.union([z.string(), z.number()]).optional().nullable().or(z.literal('')),
  tax_applicable: z.union([z.string(), z.boolean()]).optional().nullable(),
  tax_percentage: z.union([z.string(), z.number()]).optional().nullable(),
  image_url: z.string().optional().nullable().or(z.literal('')),
  icon: z.string().max(100).optional().nullable().or(z.literal('')),
});

export const staffSchema = z.object({
  first_name: z.string({ message: 'First name is required' }).trim().min(1, 'First name is required').max(100, 'First name cannot exceed 100 characters'),
  last_name: z.string({ message: 'Last name is required' }).trim().min(1, 'Last name is required').max(100, 'Last name cannot exceed 100 characters'),
  email: z.string({ message: 'Email address is required' }).trim().email('Please enter a valid email address').max(255),
  phone: z.string().trim().min(10, 'Mobile number must be at least 10 digits').max(20).optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'staff', 'receptionist'], { message: 'Please select a valid role' }),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  designation: z.string().max(100).optional().or(z.literal('')),
  specializations: z.string().optional().or(z.literal('')),
  commission_profile_id: z.string().optional().or(z.number().optional()).or(z.literal('')),
  bio: z.string().max(1000).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  color_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color code').optional().or(z.literal('')),
  specialization: z.string().max(255).optional().or(z.literal('')),
  employee_id: z.string().max(50).optional().or(z.literal('')),
  joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD').optional().or(z.literal('')),
  salary: z.string().optional().or(z.number().optional()).or(z.literal('')),
  avatar_url: z.string().optional().or(z.literal('')),
});

export const expenseSchema = z.object({
  category_id: z.union([z.number(), z.string()]).optional().nullable(),
  amount: z.union([
    z.number().positive('Amount must be greater than 0'),
    z.string().trim().min(1, 'Amount is required')
  ], { message: 'Amount is required' }),
  tax_amount: z.union([z.number().nonnegative(), z.string()]).optional(),
  include_in_tax: z.boolean().optional(),
  description: z.string({ message: 'Description is required' }).trim().min(1, 'Description is required').max(200, 'Description cannot exceed 200 characters'),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other'], { message: 'Please select a payment method' }).optional(),
  reference_no: z.string().max(100).optional().nullable().or(z.literal('')),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional().nullable().or(z.literal('')),
  receipt_url: z.string().max(500).optional().nullable().or(z.literal('')),
  expense_date: z.string({ message: 'Expense date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required (YYYY-MM-DD)'),
  vendor_name: z.string().max(255).optional().or(z.literal('')),
});

export const walletSchema = z.object({
  amount: z.union([
    z.string().trim().min(1, 'Amount is required'),
    z.number().min(0.01, 'Amount must be greater than 0')
  ], { message: 'Amount is required' }),
  payment_method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other'], { message: 'Please select a payment method' }),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const enquirySchema = z.object({
  customer_name: z.string({ message: 'Customer name is required' }).trim().min(1, 'Customer name is required').max(100),
  phone: z.string({ message: 'Mobile number is required' }).trim().min(10, 'Mobile number must be at least 10 digits').max(20),
  service_interest: z.string().max(255).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const walletTopupSchema = z.object({
  amount: z.union([
    z.string().trim().min(1, 'Amount is required'),
    z.number().min(1, 'Amount must be at least 1')
  ], { message: 'Amount is required' }),
  payment_method: z.enum(['upi', 'card', 'cash'], { message: 'Please select a payment method' }),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const inventorySchema = z.object({
  name: z.string({ message: 'Product name is required' }).trim().min(1, 'Product name is required').max(255),
  sku: z.string({ message: 'SKU is required' }).trim().min(1, 'SKU is required').max(50),
  barcode: z.string().max(50).optional().or(z.literal('')),
  brand: z.string().max(100).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
  unit: z.enum(['ml', 'gm', 'piece', 'bottle', 'box'], { message: 'Please select a valid unit' }).optional(),
  purchase_price: z.union([
    z.string().trim().min(1, 'Purchase price is required'),
    z.number().min(0, 'Purchase price must be 0 or greater')
  ], { message: 'Purchase price is required' }),
  selling_price: z.union([
    z.string().trim().min(1, 'Selling price is required'),
    z.number().min(0, 'Selling price must be 0 or greater')
  ], { message: 'Selling price is required' }),
  stock_quantity: z.union([
    z.string().trim().min(1, 'Stock quantity is required'),
    z.number().min(0, 'Stock quantity must be 0 or greater')
  ], { message: 'Stock quantity is required' }),
  min_stock_alert: z.union([
    z.string().trim().min(1, 'Minimum stock alert quantity is required'),
    z.number().min(0, 'Minimum stock alert must be 0 or greater')
  ], { message: 'Minimum stock alert quantity is required' }),
  is_active: z.boolean().optional(),
  image_url: z.string().max(500).optional().nullable().or(z.literal('')),
});

export const leadSchema = z.object({
  name: z.string({ message: 'Name is required' }).trim().min(1, 'Name is required').max(100),
  phone: z.string().trim().min(10, 'Mobile number must be at least 10 digits').max(20).optional().or(z.literal('')),
  email: z.string().trim().email('Please enter a valid email address').max(255).optional().or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Other'], { message: 'Please select a gender' }).optional(),
  location: z.string().max(255).optional().or(z.literal('')),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'converted', 'lost']).optional(),
  assigned_to: z.number().optional().or(z.literal('')),
  follow_up_date: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export const appointmentSchema = z.object({
  customer_id: z.union([
    z.string().min(1, 'Please select a customer'),
    z.number().min(1, 'Please select a customer')
  ], { message: 'Please select a customer' }),
  staff_id: z.string().optional().or(z.number().nullable()).or(z.literal('')),
  appointment_date: z.string({ message: 'Appointment date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD'),
  start_time: z.string({ message: 'Start time is required' }).regex(/^\d{2}:\d{2}:\d{2}$|^\d{2}:\d{2}$/, 'Time format: HH:mm:ss or HH:mm'),
  end_time: z.string({ message: 'End time is required' }).regex(/^\d{2}:\d{2}:\d{2}$|^\d{2}:\d{2}$/, 'Time format: HH:mm:ss or HH:mm'),
  status: z.enum(['planned', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  service_id: z.string().or(z.number()).optional(),
  service_ids: z.array(z.string().or(z.number())).optional(),
});

export const membershipSchema = z.object({
  name: z.string({ message: 'Membership name is required' }).trim().min(1, 'Membership name is required').max(100),
  description: z.string().max(1000).optional().or(z.literal('')),
  price: z.union([
    z.string().trim().min(1, 'Price is required'),
    z.number().min(0, 'Price must be 0 or greater')
  ], { message: 'Price is required' }),
  duration_months: z.union([
    z.string().trim().min(1, 'Duration is required'),
    z.number().min(1, 'Duration must be at least 1 month')
  ], { message: 'Duration is required' }),
  discount_percentage: z.string().optional().or(z.number().min(0).max(100)).or(z.literal('')),
  max_members: z.string().optional().or(z.number().min(1)).or(z.literal('')),
  benefits: z.array(z.string()).optional(),
});

export const packageSchema = z.object({
  name: z.string({ message: 'Package name is required' }).trim().min(1, 'Package name is required').max(100),
  description: z.string().max(1000).optional().or(z.literal('')),
  image_url: z.string().optional().nullable().or(z.literal('')),
  image: z.any().optional(),
  total_price: z.union([
    z.string().trim().min(1, 'Total price is required'),
    z.number().min(0, 'Total price must be 0 or greater')
  ], { message: 'Total price is required' }),
  validity_days: z.string().optional().or(z.number().min(1)).or(z.literal('')),
  max_uses: z.string().optional().or(z.number().min(1)).or(z.literal('')),
  tax_percentage: z.string().optional().or(z.number().min(0).max(100)).or(z.literal('')),
  items: z.array(z.object({
    service_id: z.number().min(1, 'Service is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1')
  })).min(1, 'At least one service must be included').optional()
});

export const loginSchema = z.object({
  email: z.string({ message: 'Email address or username is required' }).trim().min(1, 'Email address or username is required').refine(val => {
    const trimmed = (val || '').trim();
    if (!trimmed) return false;
    if (trimmed.includes('@')) {
      return z.string().email().safeParse(trimmed).success;
    }
    return trimmed.length >= 3;
  }, 'Please enter a valid email address or username'),
  password: z.string({ message: 'Password is required' }).min(1, 'Password is required').min(4, 'Password must be at least 4 characters'),
});

export const formatZodErrors = (zodError) => {
  const errors = {};
  if (!zodError || !Array.isArray(zodError.issues)) return errors;
  zodError.issues.forEach(issue => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = cleanZodMessage(issue);
    }
  });
  return errors;
};

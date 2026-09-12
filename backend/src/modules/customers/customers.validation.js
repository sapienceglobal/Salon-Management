import { z } from 'zod';

export const createCustomerSchema = {
  body: z.object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().max(100).optional(),
    phone: z.string().min(10).max(20).optional(),
    email: z.string().email('Invalid email').max(255).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD').optional(),
    anniversary: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD').optional(),
    address: z.string().max(1000).optional(),
    gst_number: z.string().max(20).optional(),
    sms_opt_in: z.boolean().optional(),
    email_opt_in: z.boolean().optional(),
    whatsapp_opt_in: z.boolean().optional(),
    source: z.enum(['walk_in', 'referral', 'online', 'campaign']).optional(),
    notes: z.string().max(2000).optional(),
  }),
};

export const bulkImportCustomersSchema = {
  body: z.object({
    customers: z.array(createCustomerSchema.body).min(1, 'At least one customer is required').max(1000, 'Maximum 1000 customers per import'),
  }),
};

export const updateCustomerSchema = {
  body: z.object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().max(100).optional(),
    phone: z.string().min(10).max(20).optional(),
    email: z.string().email('Invalid email').max(255).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    anniversary: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    address: z.string().max(1000).optional().nullable(),
    gst_number: z.string().max(20).optional().nullable(),
    sms_opt_in: z.boolean().optional(),
    email_opt_in: z.boolean().optional(),
    whatsapp_opt_in: z.boolean().optional(),
    source: z.enum(['walk_in', 'referral', 'online', 'campaign']).optional(),
    notes: z.string().max(2000).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
};

export const customerIdParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
};

export const listCustomersQuerySchema = {
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    search: z.string().optional(),
    letter: z.string().length(1).regex(/[a-zA-Z]/).optional(),
    sort_by: z.string().optional().default('created_at'),
    sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
    is_active: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    source: z.enum(['walk_in', 'referral', 'online', 'campaign']).optional(),
  }),
};

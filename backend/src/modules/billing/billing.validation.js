import { z } from 'zod';
const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

export const createInvoiceSchema = {
  body: z.object({
    customer_id: z.number().int().positive(),
    appointment_id: z.number().int().positive().optional(),
    items: z.array(z.object({
      item_type: z.enum(['service', 'product', 'package', 'membership', 'prepaid']),
      item_id: z.number().int().positive(),
      quantity: z.number().int().positive().default(1),
      unit_price: z.number().nonnegative().optional(),
      discount: z.number().nonnegative().optional(),
      staff_member_id: z.number().int().positive().optional(),
    })).min(1, 'At least one item is required'),
    discount_amount: z.number().nonnegative().optional(),
    discount_type: z.enum(['flat', 'percentage']).optional(),
    tip_amount: z.number().nonnegative().optional(),
    notes: z.string().max(2000).optional(),
    status: z.enum(['draft', 'unpaid', 'paid']).optional().default('unpaid'),
  }),
};

export const updateInvoiceSchema = {
  body: z.object({
    customer_id: z.number().int().positive(),
    appointment_id: z.number().int().positive().optional(),
    items: z.array(z.object({
      item_type: z.enum(['service', 'product', 'package', 'membership', 'prepaid']),
      item_id: z.number().int().positive(),
      quantity: z.number().int().positive().default(1),
      unit_price: z.number().nonnegative().optional(),
      discount: z.number().nonnegative().optional(),
      staff_member_id: z.number().int().positive().optional(),
    })).min(1, 'At least one item is required'),
    discount_amount: z.number().nonnegative().optional(),
    discount_type: z.enum(['flat', 'percentage']).optional(),
    tip_amount: z.number().nonnegative().optional(),
    notes: z.string().max(2000).optional(),
    status: z.enum(['draft', 'unpaid', 'paid']).optional().default('unpaid'),
  }),
  params: idParam,
};

export const addPaymentSchema = {
  body: z.object({
    amount: z.number().positive(),
    payment_method: z.enum(['cash', 'card', 'upi', 'wallet', 'split']),
    transaction_id: z.string().max(100).optional(),
  }),
  params: idParam,
};

export const refundPaymentSchema = {
  body: z.object({
    payment_id: z.number().int().positive(),
    amount: z.number().positive(),
    reason: z.string().max(500),
  }),
  params: idParam,
};

export const invoiceIdParamSchema = { params: idParam };

export const listInvoicesSchema = {
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
    status: z.enum(['draft', 'paid', 'partial', 'unpaid', 'refunded', 'cancelled']).optional(),
    customer_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
};

import { z } from 'zod';
const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

export const createProductSchema = {
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    sku: z.string().max(100).optional(),
    barcode: z.string().max(100).optional(),
    brand: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    supplier: z.string().max(100).optional(),
    expiry_date: z.string().optional(),
    purchase_price: z.coerce.number().nonnegative().optional(),
    selling_price: z.coerce.number().positive(),
    stock_quantity: z.coerce.number().int().nonnegative().optional(),
    min_stock_alert: z.coerce.number().int().nonnegative().optional(),
    hsn_sac_code: z.string().max(20).optional(),
    tax_percentage: z.coerce.number().min(0).max(100).optional(),
    unit: z.string().max(20).optional(),
  }),
};

export const updateProductSchema = {
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    sku: z.string().max(100).optional().nullable(),
    barcode: z.string().max(100).optional().nullable(),
    brand: z.string().max(100).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    supplier: z.string().max(100).optional().nullable(),
    expiry_date: z.string().optional().nullable(),
    purchase_price: z.coerce.number().nonnegative().optional().nullable(),
    selling_price: z.coerce.number().positive().optional(),
    stock_quantity: z.coerce.number().int().nonnegative().optional(),
    min_stock_alert: z.coerce.number().int().nonnegative().optional(),
    hsn_sac_code: z.string().max(20).optional().nullable(),
    tax_percentage: z.coerce.number().min(0).max(100).optional(),
    unit: z.string().max(20).optional(),
    is_active: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
  }),
  params: idParam,
};

export const updateStockSchema = {
  body: z.object({
    quantity: z.number().int(), // Can be negative for deduction
    reason: z.string().max(255).optional(),
  }),
  params: idParam,
};

export const productIdParamSchema = { params: idParam };

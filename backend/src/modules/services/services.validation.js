import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

export const createCategorySchema = {
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    sort_order: z.number().int().nonnegative().optional(),
  }),
};

export const updateCategorySchema = {
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    sort_order: z.number().int().nonnegative().optional(),
    is_active: z.boolean().optional(),
  }),
  params: idParam,
};

export const createServiceSchema = {
  body: z.object({
    category_id: z.number().int().positive().optional(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    duration_minutes: z.number().int().positive().min(5),
    price: z.number().positive(),
    cost_price: z.number().nonnegative().optional(),
    hsn_sac_code: z.string().max(20).optional(),
    tax_percentage: z.number().min(0).max(100).optional(),
    gender_target: z.enum(['male', 'female', 'unisex']).optional(),
    sort_order: z.number().int().nonnegative().optional(),
  }),
};

export const updateServiceSchema = {
  body: z.object({
    category_id: z.number().int().positive().optional().nullable(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    duration_minutes: z.number().int().positive().min(5).optional(),
    price: z.number().positive().optional(),
    cost_price: z.number().nonnegative().optional().nullable(),
    hsn_sac_code: z.string().max(20).optional().nullable(),
    tax_percentage: z.number().min(0).max(100).optional(),
    gender_target: z.enum(['male', 'female', 'unisex']).optional(),
    sort_order: z.number().int().nonnegative().optional(),
    is_active: z.boolean().optional(),
  }),
  params: idParam,
};

export const serviceIdParamSchema = { params: idParam };
export const categoryIdParamSchema = { params: idParam };

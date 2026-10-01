import { z } from 'zod';

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

export const createCategorySchema = {
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional().nullable(),
    sort_order: z.coerce.number().int().nonnegative().optional(),
    display_order: z.coerce.number().int().nonnegative().optional(),
    icon: z.string().max(100).optional().nullable(),
  }),
};

export const updateCategorySchema = {
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    sort_order: z.coerce.number().int().nonnegative().optional(),
    display_order: z.coerce.number().int().nonnegative().optional(),
    icon: z.string().max(100).optional().nullable(),
    is_active: z.coerce.boolean().optional(),
  }),
  params: idParam,
};

export const createServiceSchema = {
  body: z.object({
    category_id: z.coerce.number().int().positive().optional().nullable(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional().nullable(),
    duration_minutes: z.coerce.number().int().positive().min(1),
    price: z.coerce.number().nonnegative(),
    discounted_price: z.coerce.number().nonnegative().optional().nullable(),
    cost_price: z.coerce.number().nonnegative().optional().nullable(),
    hsn_sac_code: z.string().max(20).optional().nullable(),
    tax_percentage: z.coerce.number().min(0).max(100).optional(),
    gender_target: z.enum(['male', 'female', 'unisex']).optional(),
    sort_order: z.coerce.number().int().nonnegative().optional(),
    is_active: z.coerce.boolean().optional(),
    online_booking: z.coerce.boolean().optional(),
    is_featured: z.coerce.boolean().optional(),
    requires_consultation: z.coerce.boolean().optional(),
    tags: z.string().max(500).optional().nullable(),
    service_color: z.string().max(20).optional(),
    service_staff: z.string().max(255).optional().nullable(),
    icon: z.string().max(100).optional().nullable(),
    image_url: z.string().optional().nullable(),
    existing_images: z.string().optional(),
  }),
};

export const updateServiceSchema = {
  body: z.object({
    category_id: z.coerce.number().int().positive().optional().nullable(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    duration_minutes: z.coerce.number().int().positive().min(1).optional(),
    price: z.coerce.number().nonnegative().optional(),
    discounted_price: z.coerce.number().nonnegative().optional().nullable(),
    cost_price: z.coerce.number().nonnegative().optional().nullable(),
    hsn_sac_code: z.string().max(20).optional().nullable(),
    tax_percentage: z.coerce.number().min(0).max(100).optional(),
    gender_target: z.enum(['male', 'female', 'unisex']).optional(),
    sort_order: z.coerce.number().int().nonnegative().optional(),
    is_active: z.coerce.boolean().optional(),
    online_booking: z.coerce.boolean().optional(),
    is_featured: z.coerce.boolean().optional(),
    requires_consultation: z.coerce.boolean().optional(),
    tags: z.string().max(500).optional().nullable(),
    service_color: z.string().max(20).optional(),
    service_staff: z.string().max(255).optional().nullable(),
    icon: z.string().max(100).optional().nullable(),
    image_url: z.string().optional().nullable(),
    existing_images: z.string().optional(),
  }),
  params: idParam,
};

export const serviceIdParamSchema = { params: idParam };
export const categoryIdParamSchema = { params: idParam };

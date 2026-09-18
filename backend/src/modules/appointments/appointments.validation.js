import { z } from 'zod';
const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

export const createAppointmentSchema = {
  body: z.object({
    customer_id: z.number().int().positive(),
    service_id: z.number().int().positive(),
    staff_id: z.number().int().positive().optional().nullable(),
    room_id: z.number().int().positive().optional().nullable(),
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD'),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time format: HH:MM'),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time format: HH:MM'),
    status: z.enum(['pending', 'planned', 'ongoing', 'completed', 'cancelled', 'no_show']).optional(),
    source: z.enum(['walk_in', 'phone', 'online', 'app']).optional(),
    notes: z.string().max(2000).optional().nullable(),
  }),
};

export const updateAppointmentSchema = {
  body: z.object({
    customer_id: z.number().int().positive().optional(),
    service_id: z.number().int().positive().optional(),
    staff_id: z.number().int().positive().optional().nullable(),
    room_id: z.number().int().positive().optional().nullable(),
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD').optional(),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time format: HH:MM').optional(),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time format: HH:MM').optional(),
    status: z.enum(['pending', 'planned', 'ongoing', 'completed', 'cancelled', 'no_show']).optional(),
    source: z.enum(['walk_in', 'phone', 'online', 'app']).optional(),
    notes: z.string().max(2000).optional().nullable(),
  }),
  params: idParam,
};


export const updateAppointmentStatusSchema = {
  body: z.object({
    status: z.enum(['planned', 'ongoing', 'completed', 'cancelled', 'no_show']),
    notes: z.string().max(2000).optional(),
  }),
  params: idParam,
};

export const listAppointmentsSchema = {
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    staff_member_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    customer_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.enum(['planned', 'ongoing', 'completed', 'cancelled', 'no_show']).optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('50'),
  }),
};

export const appointmentIdParamSchema = { params: idParam };

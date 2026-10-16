import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { businessScope, authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createAppointmentSchema, updateAppointmentSchema, updateAppointmentStatusSchema, listAppointmentsSchema, appointmentIdParamSchema } from './appointments.validation.js';
import { getAppointments, getAppointmentStats, getAppointment, createAppointment, updateAppointment, updateAppointmentStatus, deleteAppointment, bulkDeleteAppointments, bulkStatusAppointments, sendAppointmentEmail } from './appointments.controller.js';

const router = Router();
router.use(authenticate, businessScope());

router.get('/', validate(listAppointmentsSchema), getAppointments);
router.get('/stats', getAppointmentStats);
router.post('/bulk-delete', authorize('super_admin', 'admin', 'manager'), bulkDeleteAppointments);
router.post('/bulk-status', bulkStatusAppointments);
router.post('/send-email', sendAppointmentEmail);
router.post('/:id/send-email', sendAppointmentEmail);
router.get('/:id', validate(appointmentIdParamSchema), getAppointment);
router.post('/', validate(createAppointmentSchema), createAppointment);
router.patch('/:id', validate(updateAppointmentSchema), updateAppointment);
router.patch('/:id/status', validate(updateAppointmentStatusSchema), updateAppointmentStatus);
router.delete('/:id', authorize('super_admin', 'admin', 'manager'), validate(appointmentIdParamSchema), deleteAppointment);

export default router;

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createAppointmentSchema, updateAppointmentSchema, updateAppointmentStatusSchema, listAppointmentsSchema, appointmentIdParamSchema } from './appointments.validation.js';
import { getAppointments, getAppointmentStats, getAppointment, createAppointment, updateAppointment, updateAppointmentStatus, deleteAppointment } from './appointments.controller.js';

const router = Router();
router.use(authenticate, businessScope());

router.get('/', validate(listAppointmentsSchema), getAppointments);
router.get('/stats', getAppointmentStats);
router.get('/:id', validate(appointmentIdParamSchema), getAppointment);
router.post('/', validate(createAppointmentSchema), createAppointment);
router.patch('/:id', validate(updateAppointmentSchema), updateAppointment);
router.patch('/:id/status', validate(updateAppointmentStatusSchema), updateAppointmentStatus);
router.delete('/:id', validate(appointmentIdParamSchema), deleteAppointment);

export default router;

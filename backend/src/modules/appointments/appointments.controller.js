import { appointmentService } from './appointments.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAppointments = asyncHandler(async (req, res) => {
  const { appointments, meta } = await appointmentService.getAll(req.user.business_id, req.query);
  ApiResponse.ok('Appointments fetched', appointments, meta).send(res);
});
export const getAppointmentStats = asyncHandler(async (req, res) => {
  const stats = await appointmentService.getStats(req.user.business_id, req.query);
  ApiResponse.ok('Appointment stats fetched', stats).send(res);
});
export const getAppointment = asyncHandler(async (req, res) => {
  const appt = await appointmentService.getById(req.params.id, req.user.business_id);
  ApiResponse.ok('Appointment fetched', appt).send(res);
});
export const createAppointment = asyncHandler(async (req, res) => {
  const appt = await appointmentService.create(req.user.business_id, req.user.id, req.body);
  ApiResponse.created('Appointment created', appt).send(res);
});
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appt = await appointmentService.updateStatus(req.params.id, req.user.business_id, req.body.status, req.body.notes);
  ApiResponse.ok('Appointment status updated', appt).send(res);
});
export const updateAppointment = asyncHandler(async (req, res) => {
  const appt = await appointmentService.update(req.params.id, req.user.business_id, req.body);
  ApiResponse.ok('Appointment updated', appt).send(res);
});
export const deleteAppointment = asyncHandler(async (req, res) => {
  await appointmentService.delete(req.params.id, req.user.business_id);
  ApiResponse.ok('Appointment deleted').send(res);
});

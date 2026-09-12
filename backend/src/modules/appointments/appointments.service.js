import { appointmentRepository } from './appointments.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { db } from '../../config/database.js';

class AppointmentService {
  async getAll(businessId, query) { return appointmentRepository.findAll(businessId, query); }

  async getById(id, businessId) {
    const appointment = await appointmentRepository.findById(id, businessId);
    if (!appointment) throw ApiError.notFound('Appointment not found');
    return appointment;
  }

  async create(businessId, userId, data) {
    // Verify customer exists
    const customer = await db('customers').where({ id: data.customer_id, business_id: businessId }).first();
    if (!customer) throw ApiError.notFound('Customer not found');

    // Check staff conflict if staff assigned
    if (data.staff_id) {
      const conflict = await appointmentRepository.checkConflict(
        businessId, data.staff_id, data.appointment_date, data.start_time, data.end_time
      );
      if (conflict) throw ApiError.conflict('Staff member has a conflicting appointment at this time');
    }

    // Verify service
    const service = await db('salon_services').where({ id: data.service_id, business_id: businessId, is_active: true }).first();
    if (!service) throw ApiError.notFound('Service not found');

    const appointmentData = {
      business_id: businessId,
      customer_id: data.customer_id,
      staff_member_id: data.staff_id || null,
      appointment_date: data.appointment_date,
      start_time: data.start_time,
      end_time: data.end_time,
      status: data.status || 'planned',
      notes: data.notes || null,
      created_by: userId
    };

    const appointmentId = await appointmentRepository.create(
      appointmentData, 
      data.service_id, 
      service.price, 
      service.duration
    );
    return appointmentRepository.findById(appointmentId, businessId);
  }

  async updateStatus(id, businessId, status, notes) {
    const appointment = await this.getById(id, businessId);
    // Validate status transitions
    const validTransitions = {
      planned: ['ongoing', 'cancelled', 'no_show'],
      ongoing: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      no_show: [],
    };
    if (!validTransitions[appointment.status]?.includes(status)) {
      throw ApiError.badRequest(`Cannot change status from '${appointment.status}' to '${status}'`);
    }
    return appointmentRepository.updateStatus(id, businessId, status, notes);
  }

  async update(id, businessId, data) {
    const appointment = await this.getById(id, businessId);

    // Validate if customer exists (if changing customer)
    if (data.customer_id && data.customer_id !== appointment.customer_id) {
      const customer = await db('customers').where({ id: data.customer_id, business_id: businessId }).first();
      if (!customer) throw ApiError.notFound('Customer not found');
    }

    // Check staff conflict if changing time/staff
    const staffId = data.staff_id !== undefined ? data.staff_id : appointment.staff_member_id;
    const date = data.appointment_date || appointment.appointment_date;
    const startTime = data.start_time || appointment.start_time;
    const endTime = data.end_time || appointment.end_time;
    
    if (staffId) {
      const conflict = await appointmentRepository.checkConflict(businessId, staffId, date, startTime, endTime, id);
      if (conflict) throw ApiError.conflict('Staff member has a conflicting appointment at this time');
    }

    const updateData = {};
    if (data.customer_id !== undefined) updateData.customer_id = data.customer_id;
    if (data.staff_id !== undefined) updateData.staff_member_id = data.staff_id;
    if (data.appointment_date !== undefined) updateData.appointment_date = data.appointment_date;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    let servicePrice = null;
    let serviceDuration = null;
    
    if (data.service_id && data.service_id !== appointment.service_id) {
       const service = await db('salon_services').where({ id: data.service_id, business_id: businessId }).first();
       if (service) {
         servicePrice = service.price;
         serviceDuration = service.duration;
       }
    }

    await appointmentRepository.update(id, businessId, updateData, data.service_id, servicePrice, serviceDuration);
    return this.getById(id, businessId);
  }

  async delete(id, businessId) {
    const appointment = await this.getById(id, businessId);
    if (appointment.status !== 'planned' && appointment.status !== 'pending') {
       throw ApiError.badRequest(`Cannot delete appointment with status '${appointment.status}'. Cancel it instead.`);
    }
    await appointmentRepository.delete(id, businessId);
  }
}

export const appointmentService = new AppointmentService();


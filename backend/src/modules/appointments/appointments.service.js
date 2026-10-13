import { appointmentRepository } from './appointments.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { db } from '../../config/database.js';
import { sendEmail } from '../../config/mailer.js';

class AppointmentService {
  async getStats(businessId, query) { return appointmentRepository.getStats(businessId, query); }
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

    // Verify staff exists and is active if assigned
    if (data.staff_id) {
      const staffMember = await db('staff_members as sm')
        .join('users as u', 'sm.user_id', 'u.id')
        .where({ 'sm.id': data.staff_id, 'sm.business_id': businessId })
        .select('sm.id', 'u.is_active')
        .first();
      if (!staffMember) throw ApiError.notFound('Staff member not found');
      if (!staffMember.is_active) throw ApiError.badRequest('Selected staff member is inactive');

      const conflict = await appointmentRepository.checkConflict(
        businessId, data.staff_id, data.appointment_date, data.start_time, data.end_time
      );
      if (conflict) throw ApiError.conflict('Staff member has a conflicting appointment at this time');
    }

    // Resolve service IDs (supports array of service_ids or single service_id)
    const serviceIds = data.service_ids && Array.isArray(data.service_ids) && data.service_ids.length > 0
      ? [...new Set(data.service_ids.map(Number))]
      : data.service_id ? [Number(data.service_id)] : [];

    if (serviceIds.length === 0) {
      throw ApiError.badRequest('At least one service must be selected');
    }

    // Verify services exist and are active
    const services = await db('salon_services')
      .whereIn('id', serviceIds)
      .where({ business_id: businessId, is_active: true });

    if (services.length !== serviceIds.length) {
      throw ApiError.badRequest('One or more selected services are inactive or not found');
    }

    const appointmentData = {
      business_id: businessId,
      customer_id: data.customer_id,
      staff_member_id: data.staff_id || null,
      appointment_date: data.appointment_date,
      start_time: data.start_time,
      end_time: data.end_time,
      status: data.status || 'planned',
      source: data.source || 'walk_in',
      notes: data.notes || null,
      created_by: userId
    };

    // Fetch room if provided
    let roomName = null;
    if (data.room_id) {
      const room = await db('service_rooms').where({ id: data.room_id, business_id: businessId }).first();
      if (room) roomName = room.name;
    }

    const appointmentId = await appointmentRepository.create(
      appointmentData,
      services,
      roomName
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

    if (data.staff_id) {
      const staffMember = await db('staff_members as sm')
        .join('users as u', 'sm.user_id', 'u.id')
        .where({ 'sm.id': data.staff_id, 'sm.business_id': businessId })
        .select('sm.id', 'u.is_active')
        .first();
      if (!staffMember) throw ApiError.notFound('Staff member not found');
      if (!staffMember.is_active) throw ApiError.badRequest('Selected staff member is inactive');
    }

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

    const serviceData = {};
    if (data.service_id && data.service_id !== appointment.service_id) {
      const service = await db('salon_services').where({ id: data.service_id, business_id: businessId, is_active: true }).first();
      if (!service) throw ApiError.badRequest('Selected service is inactive or not found');
      serviceData.service_id = data.service_id;
      serviceData.price = service.price;
      serviceData.duration = service.duration;
    }

    if (data.staff_id !== undefined) serviceData.staff_id = data.staff_id;

    if (data.room_id !== undefined) {
      if (data.room_id === null) {
        serviceData.room_name = null;
      } else {
        const room = await db('service_rooms').where({ id: data.room_id, business_id: businessId }).first();
        if (room) serviceData.room_name = room.name;
      }
    }

    await appointmentRepository.update(id, businessId, updateData, Object.keys(serviceData).length > 0 ? serviceData : null);
    return this.getById(id, businessId);
  }

  async delete(id, businessId) {
    const appointment = await this.getById(id, businessId);
    if (appointment.status !== 'planned' && appointment.status !== 'pending') {
      throw ApiError.badRequest(`Cannot delete appointment with status '${appointment.status}'. Cancel it instead.`);
    }
    await appointmentRepository.delete(id, businessId);
  }

  async bulkDelete(businessId, ids) {
    return appointmentRepository.bulkDelete(ids, businessId);
  }

  async bulkUpdateStatus(businessId, ids, status) {
    return appointmentRepository.bulkUpdateStatus(ids, businessId, status);
  }

  async sendConfirmationEmail(businessId, appointmentId, { email, customMessage } = {}) {
    let appointment = null;
    if (appointmentId) {
      appointment = await this.getById(appointmentId, businessId);
    }

    const recipientEmail = (email || appointment?.customer_email || '').trim();
    if (!recipientEmail) {
      throw ApiError.badRequest('Customer does not have a registered email address. Please enter an email address to send details.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw ApiError.badRequest('Invalid email address format.');
    }

    const business = await db('businesses').where({ id: businessId }).first() || {};
    const businessName = business.name || 'Kaira Makeover';
    const businessPhone = business.phone || '+919876543210';
    const businessAddress = business.address ? `${business.address}${business.city ? `, ${business.city}` : ''}` : 'Salon & Spa Studio';

    const customerName = appointment?.customer_name || 'Valued Client';
    const staffName = appointment?.staff_first_name
      ? `${appointment.staff_first_name} ${appointment.staff_last_name || ''}`.trim()
      : 'Any Available Stylist (Unassigned)';

    let formattedDate = appointment?.appointment_date || 'Upcoming';
    try {
      if (appointment?.appointment_date) {
        const [y, m, d] = String(appointment.appointment_date).split('-');
        if (y && m && d) {
          const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
          formattedDate = dObj.toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
          });
        }
      }
    } catch (_) {}

    const formatSlot = (t) => {
      if (!t) return '';
      const [h, min] = t.split(':');
      const hr = parseInt(h);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const h12 = hr % 12 || 12;
      return `${h12}:${min} ${ampm}`;
    };

    const timeSlot = appointment?.start_time && appointment?.end_time
      ? `${formatSlot(appointment.start_time)} - ${formatSlot(appointment.end_time)}`
      : 'Scheduled Slot';

    const services = appointment?.services || [];
    const totalAmount = parseFloat(appointment?.service_price || 0);

    const subject = `✨ Appointment Confirmation — ${businessName} (#APT-${appointmentId || 'CONFIRMED'})`;

    const servicesRowsHtml = services.length > 0
      ? services.map(s => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px;">
            <strong>${s.service_name}</strong>
            ${s.duration_minutes ? `<div style="font-size: 12px; color: #94a3b8;">${s.duration_minutes} mins</div>` : ''}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px;">
            ₹${parseFloat(s.price || 0).toLocaleString()}
          </td>
        </tr>
      `).join('')
      : `
        <tr>
          <td style="padding: 10px 0; color: #334155; font-size: 14px;">${appointment?.service_name || 'Salon Service'}</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px;">₹${totalAmount.toLocaleString()}</td>
        </tr>
      `;

    const customMessageBlock = customMessage ? `
      <div style="margin: 22px 0; padding: 16px 20px; background-color: #fdf2f8; border-left: 4px solid #E91E63; border-radius: 8px; font-size: 13.5px; color: #831843; line-height: 1.6; white-space: pre-wrap;">
        <strong style="display: block; margin-bottom: 4px; color: #be185d;">Special Note / Message from Salon:</strong>
        ${customMessage}
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 12px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 36px 30px; text-align: center;">
                    <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 8px;">
                      ${businessName}
                    </div>
                    <div style="display: inline-block; background: rgba(233, 30, 99, 0.2); border: 1px solid rgba(233, 30, 99, 0.4); color: #f472b6; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 5px 14px; border-radius: 9999px;">
                      ✓ Appointment Confirmed
                    </div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px 30px;">
                    <p style="font-size: 16px; color: #0f172a; margin: 0 0 14px 0; font-weight: 600;">
                      Hello ${customerName},
                    </p>
                    <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0; line-height: 1.6;">
                      Your appointment has been successfully confirmed. Here are the booking details for your scheduled visit:
                    </p>

                    <!-- Summary Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; font-size: 13px;">Booking ID:</td>
                        <td style="padding: 7px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">#APT-${appointmentId || 'CONFIRMED'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; font-size: 13px;">📅 Date:</td>
                        <td style="padding: 7px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 14px;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; font-size: 13px;">⏰ Time Slot:</td>
                        <td style="padding: 7px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 14px;">${timeSlot}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; font-size: 13px;">💇 Stylist / Specialist:</td>
                        <td style="padding: 7px 0; text-align: right; color: #0f172a; font-weight: 600; font-size: 14px;">${staffName}</td>
                      </tr>
                    </table>

                    <!-- Services Table -->
                    <div style="margin-bottom: 24px;">
                      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 10px;">
                        Booked Service(s)
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        ${servicesRowsHtml}
                        <tr>
                          <td style="padding: 14px 0 0 0; font-size: 15px; font-weight: 800; color: #0f172a;">Estimated Total</td>
                          <td style="padding: 14px 0 0 0; text-align: right; font-size: 18px; font-weight: 800; color: #E91E63;">₹${totalAmount.toLocaleString()}</td>
                        </tr>
                      </table>
                    </div>

                    ${customMessageBlock}

                    <!-- Salon Address / Help Info -->
                    <div style="background-color: #faf5ff; border: 1px solid #f3e8ff; border-radius: 14px; padding: 16px 20px; margin-top: 24px;">
                      ${businessAddress ? `<div style="font-size: 13px; color: #6b21a8; margin-bottom: 6px;"><strong>📍 Address:</strong> ${businessAddress}</div>` : ''}
                      ${businessPhone ? `<div style="font-size: 13px; color: #6b21a8;"><strong>📞 Helpline:</strong> ${businessPhone}</div>` : ''}
                    </div>

                    <p style="margin: 24px 0 0 0; font-size: 12.5px; color: #94a3b8; text-align: center; line-height: 1.5;">
                      Please arrive 5–10 minutes early. We are excited to serve you!
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <div style="font-size: 12px; color: #94a3b8;">
                      © ${new Date().getFullYear()} ${businessName}. All rights reserved.
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const plainText = customMessage || `Appointment Confirmation for ${customerName} at ${businessName}\nDate: ${formattedDate}\nTime: ${timeSlot}\nStylist: ${staffName}\nTotal: ₹${totalAmount}\nAddress: ${businessAddress}\nPhone: ${businessPhone}`;

    await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: plainText,
    });

    return {
      success: true,
      recipientEmail,
      message: `Appointment confirmation email sent successfully to ${recipientEmail}`,
    };
  }
}

export const appointmentService = new AppointmentService();


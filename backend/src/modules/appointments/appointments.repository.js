import { db } from '../../config/database.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

class AppointmentRepository {
  async findAll(businessId, query) {
    const { page, limit, offset } = parsePagination(query);
    const base = db('appointments as a')
      .join('customers as c', 'a.customer_id', 'c.id')
      .leftJoin('appointment_services as aps', 'a.id', 'aps.appointment_id')
      .leftJoin('salon_services as s', 'aps.service_id', 's.id')
      .leftJoin('staff_members as sm', 'a.staff_member_id', 'sm.id')
      .leftJoin('users as u', 'sm.user_id', 'u.id')
      .leftJoin('invoices as i', 'a.invoice_id', 'i.id')
      .where('a.business_id', businessId)
      .select(
        'a.*',
        'aps.service_id',
        db.raw("COALESCE(i.status, 'unpaid') as payment_status"),
        'c.first_name as customer_first_name', 'c.last_name as customer_last_name', 'c.phone as customer_phone',
        'u.first_name as staff_first_name', 'u.last_name as staff_last_name',
        's.name as service_name', 's.price as service_price'
      );

    if (query.date) base.where('a.appointment_date', query.date);
    if (query.from_date) base.where('a.appointment_date', '>=', query.from_date);
    if (query.start_date && query.end_date) base.whereBetween('a.appointment_date', [query.start_date, query.end_date]);
    if (query.staff_id) base.where('a.staff_member_id', query.staff_id);
    if (query.service_id) base.where('aps.service_id', query.service_id);
    if (query.customer_id) base.where('a.customer_id', query.customer_id);
    if (query.status) base.whereIn('a.status', query.status.split(','));

    const countQuery = db('appointments as a').where('a.business_id', businessId);
    if (query.date) countQuery.where('a.appointment_date', query.date);
    if (query.from_date) countQuery.where('a.appointment_date', '>=', query.from_date);
    if (query.start_date && query.end_date) countQuery.whereBetween('a.appointment_date', [query.start_date, query.end_date]);
    if (query.staff_id) countQuery.where('a.staff_member_id', query.staff_id);
    if (query.customer_id) countQuery.where('a.customer_id', query.customer_id);
    if (query.status) countQuery.whereIn('a.status', query.status.split(','));
    if (query.service_id) {
       countQuery.join('appointment_services as aps2', 'a.id', 'aps2.appointment_id')
                 .where('aps2.service_id', query.service_id);
    }
    const [{ count }] = await countQuery.count('* as count');
    const appointments = await base.clone().orderBy('a.appointment_date', 'asc').orderBy('a.start_time', 'asc').limit(limit).offset(offset);

    return { appointments, meta: buildPaginationMeta(parseInt(count, 10), page, limit) };
  }

  async findById(id, businessId) {
    const appointment = await db('appointments as a')
      .join('customers as c', 'a.customer_id', 'c.id')
      .leftJoin('appointment_services as aps', 'a.id', 'aps.appointment_id')
      .leftJoin('salon_services as s', 'aps.service_id', 's.id')
      .leftJoin('staff_members as sm', 'a.staff_member_id', 'sm.id')
      .leftJoin('users as u', 'sm.user_id', 'u.id')
      .leftJoin('invoices as i', 'a.invoice_id', 'i.id')
      .where({ 'a.id': id, 'a.business_id': businessId })
      .select(
        'a.*',
        'aps.service_id',
        db.raw("COALESCE(i.status, 'unpaid') as payment_status"),
        'c.first_name as customer_first_name', 'c.last_name as customer_last_name', 'c.phone as customer_phone',
        'u.first_name as staff_first_name', 'u.last_name as staff_last_name',
        's.name as service_name', 's.price as service_price'
      )
      .first();

    return appointment;
  }

  async create(appointmentData, serviceId) {
    return db.transaction(async (trx) => {
      const [appointmentId] = await trx('appointments').insert(appointmentData);
      
      // Insert into junction table
      await trx('appointment_services').insert({
        appointment_id: appointmentId,
        service_id: serviceId,
        staff_member_id: appointmentData.staff_member_id || null
      });

      return appointmentId;
    });
  }

  async updateStatus(id, businessId, status, notes) {
    const updateData = { status, updated_at: db.fn.now() };
    if (notes) updateData.notes = notes;
    await db('appointments').where({ id, business_id: businessId }).update(updateData);
    return this.findById(id, businessId);
  }

  async checkConflict(businessId, staffId, date, startTime, endTime, excludeId = null) {
    const query = db('appointments')
      .where({ business_id: businessId, staff_member_id: staffId, appointment_date: date })
      .whereNotIn('status', ['cancelled', 'no_show'])
      .where(function () {
        this.where(function () { this.where('start_time', '<', endTime).where('end_time', '>', startTime); });
      });
    if (excludeId) query.whereNot('id', excludeId);
    return query.first();
  }

  async getTodayCount(businessId) {
    const today = new Date().toISOString().split('T')[0];
    const [{ count }] = await db('appointments').where({ business_id: businessId, appointment_date: today }).whereNotIn('status', ['cancelled']).count('* as count');
    return parseInt(count, 10);
  }

  async update(id, businessId, updateData, newServiceId = null) {
    return db.transaction(async (trx) => {
      updateData.updated_at = db.fn.now();
      await trx('appointments').where({ id, business_id: businessId }).update(updateData);
      
      // Update appointment_services if service or staff changed
      if (newServiceId || updateData.staff_member_id !== undefined) {
        const apsUpdate = {};
        if (newServiceId) apsUpdate.service_id = newServiceId;
        if (updateData.staff_member_id !== undefined) apsUpdate.staff_member_id = updateData.staff_member_id;
        
        await trx('appointment_services').where({ appointment_id: id }).update(apsUpdate);
      }
    });
  }

  async delete(id, businessId) {
    return db.transaction(async (trx) => {
      await trx('appointment_services').where({ appointment_id: id }).del();
      await trx('appointments').where({ id, business_id: businessId }).del();
    });
  }
}

export const appointmentRepository = new AppointmentRepository();


import { db } from '../../config/database.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

class AppointmentRepository {
  async getStats(businessId, query) {
    const todayStr = query.date || new Date().toISOString().split('T')[0];
    const d = new Date(todayStr);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];

    const getDayStats = async (dt) => {
      const q = db('appointments as a')
        .where({ 'a.business_id': businessId, 'a.appointment_date': dt });

      if (query.staff_id) q.where('a.staff_member_id', query.staff_id);
      if (query.service_id) {
        q.join('appointment_services as aps', 'a.id', 'aps.appointment_id')
         .where('aps.service_id', query.service_id);
      }

      const [res] = await q.select(
        db.raw('COUNT(*) as total'),
        db.raw("SUM(CASE WHEN a.status = 'planned' OR a.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed"),
        db.raw("SUM(CASE WHEN a.status = 'ongoing' OR a.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress"),
        db.raw("SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) as pending"),
        db.raw("SUM(CASE WHEN a.status = 'cancelled' OR a.status = 'no_show' THEN 1 ELSE 0 END) as cancelled"),
        db.raw("SUM(CASE WHEN a.staff_member_id IS NULL THEN 1 ELSE 0 END) as unassigned"),
        db.raw("SUM(CASE WHEN a.source = 'walk_in' THEN 1 ELSE 0 END) as walk_ins")
      );
      return res || {};
    };

    const today = await getDayStats(todayStr);
    const yesterday = await getDayStats(yesterdayStr);

    const calcTrend = (current, previous) => {
      const curr = parseInt(current || 0);
      const prev = parseInt(previous || 0);
      if (prev === 0) return { value: curr > 0 ? 100 : 0, is_up: curr >= 0 };
      const diff = curr - prev;
      const pct = Math.round((diff / prev) * 100);
      return { value: Math.abs(pct), is_up: pct >= 0 };
    };

    return {
      total: { value: parseInt(today.total || 0), trend: calcTrend(today.total, yesterday.total) },
      confirmed: { value: parseInt(today.confirmed || 0), trend: calcTrend(today.confirmed, yesterday.confirmed) },
      in_progress: { value: parseInt(today.in_progress || 0), trend: calcTrend(today.in_progress, yesterday.in_progress) },
      pending: { value: parseInt(today.pending || 0), trend: calcTrend(today.pending, yesterday.pending) },
      cancelled: { value: parseInt(today.cancelled || 0), trend: calcTrend(today.cancelled, yesterday.cancelled) },
      unassigned: { value: parseInt(today.unassigned || 0), trend: calcTrend(today.unassigned, yesterday.unassigned) },
      walk_ins: { value: parseInt(today.walk_ins || 0), trend: calcTrend(today.walk_ins, yesterday.walk_ins) }
    };
  }

  async findAll(businessId, query) {
    const { page, limit, offset } = parsePagination(query);
    const base = db('appointments as a')
      .join('customers as c', 'a.customer_id', 'c.id')
      .leftJoin('staff_members as sm', 'a.staff_member_id', 'sm.id')
      .leftJoin('users as u', 'sm.user_id', 'u.id')
      .leftJoin('invoices as i', 'a.invoice_id', 'i.id')
      .where('a.business_id', businessId)
      .select(
        'a.*',
        db.raw("COALESCE(i.status, 'unpaid') as payment_status"),
        'c.first_name as customer_first_name', 'c.last_name as customer_last_name', 'c.phone as customer_phone',
        'c.profile_image_url as customer_avatar_url',
        'u.first_name as staff_first_name', 'u.last_name as staff_last_name',
        'u.avatar_url as staff_avatar_url', 'sm.color_code as staff_color'
      );

    if (query.date) base.where('a.appointment_date', query.date);
    if (query.from_date) base.where('a.appointment_date', '>=', query.from_date);
    if (query.to_date) base.where('a.appointment_date', '<=', query.to_date);
    if (query.start_date && query.end_date) base.whereBetween('a.appointment_date', [query.start_date, query.end_date]);
    if (query.upcoming === 'true' || query.upcoming === true) {
      base.where('a.appointment_date', '>=', new Date().toISOString().split('T')[0]);
    }
    const staffFilterId = query.staff_id || query.staff_member_id;
    if (staffFilterId === 'unassigned' || staffFilterId === 'nobody' || query.unassigned === 'true') {
      base.whereNull('a.staff_member_id');
    } else if (staffFilterId) {
      base.where('a.staff_member_id', staffFilterId);
    }
    if (query.customer_id) base.where('a.customer_id', query.customer_id);
    if (query.status) base.whereIn('a.status', query.status.split(','));
    if (query.service_id) {
      base.whereExists(function () {
        this.select('*').from('appointment_services as aps_filter')
          .whereRaw('aps_filter.appointment_id = a.id')
          .where('aps_filter.service_id', query.service_id);
      });
    }

    const countQuery = db('appointments as a').where('a.business_id', businessId);
    if (query.date) countQuery.where('a.appointment_date', query.date);
    if (query.from_date) countQuery.where('a.appointment_date', '>=', query.from_date);
    if (query.to_date) countQuery.where('a.appointment_date', '<=', query.to_date);
    if (query.start_date && query.end_date) countQuery.whereBetween('a.appointment_date', [query.start_date, query.end_date]);
    if (query.upcoming === 'true' || query.upcoming === true) {
      countQuery.where('a.appointment_date', '>=', new Date().toISOString().split('T')[0]);
    }
    if (staffFilterId === 'unassigned' || staffFilterId === 'nobody' || query.unassigned === 'true') {
      countQuery.whereNull('a.staff_member_id');
    } else if (staffFilterId) {
      countQuery.where('a.staff_member_id', staffFilterId);
    }
    if (query.customer_id) countQuery.where('a.customer_id', query.customer_id);
    if (query.status) countQuery.whereIn('a.status', query.status.split(','));
    if (query.service_id) {
      countQuery.whereExists(function () {
        this.select('*').from('appointment_services as aps_filter2')
          .whereRaw('aps_filter2.appointment_id = a.id')
          .where('aps_filter2.service_id', query.service_id);
      });
    }

    const [{ count }] = await countQuery.count('* as count');
    const appointments = await base.clone().orderBy('a.appointment_date', 'asc').orderBy('a.start_time', 'asc').limit(limit).offset(offset);

    // Batch-load services for all returned appointments
    if (appointments.length > 0) {
      const apptIds = appointments.map(a => a.id);
      const allServices = await db('appointment_services as aps')
        .join('salon_services as s', 'aps.service_id', 's.id')
        .whereIn('aps.appointment_id', apptIds)
        .select(
          'aps.appointment_id',
          'aps.id as appointment_service_id',
          's.id as service_id',
          's.name as service_name',
          's.image_url as service_image_url',
          's.icon as service_icon',
          's.service_color',
          'aps.price',
          'aps.duration_minutes',
          'aps.room_number',
          'aps.status'
        );

      const servicesByAppt = {};
      for (const s of allServices) {
        if (!servicesByAppt[s.appointment_id]) servicesByAppt[s.appointment_id] = [];
        servicesByAppt[s.appointment_id].push(s);
      }

      for (const appt of appointments) {
        const sList = servicesByAppt[appt.id] || [];
        appt.services = sList;
        appt.service_name = sList.map(s => s.service_name).join(', ') || 'Custom Service';
        appt.service_price = sList.reduce((sum, s) => sum + parseFloat(s.price || 0), 0);
        appt.service_id = sList[0]?.service_id || null;
        appt.service_ids = sList.map(s => s.service_id);
        appt.service_image_url = sList[0]?.service_image_url || null;
        appt.service_icon = sList[0]?.service_icon || null;
        appt.service_color = sList[0]?.service_color || null;
        appt.customer_name = `${appt.customer_first_name} ${appt.customer_last_name || ''}`.trim();
      }
    }

    return { appointments, meta: buildPaginationMeta(parseInt(count, 10), page, limit) };
  }

  async findById(id, businessId) {
    const appointment = await db('appointments as a')
      .join('customers as c', 'a.customer_id', 'c.id')
      .leftJoin('staff_members as sm', 'a.staff_member_id', 'sm.id')
      .leftJoin('users as u', 'sm.user_id', 'u.id')
      .leftJoin('invoices as i', 'a.invoice_id', 'i.id')
      .where({ 'a.id': id, 'a.business_id': businessId })
      .select(
        'a.*',
        db.raw("COALESCE(i.status, 'unpaid') as payment_status"),
        'c.first_name as customer_first_name', 'c.last_name as customer_last_name', 'c.phone as customer_phone',
        'c.profile_image_url as customer_avatar_url',
        'u.first_name as staff_first_name', 'u.last_name as staff_last_name',
        'u.avatar_url as staff_avatar_url', 'sm.color_code as staff_color'
      )
      .first();

    if (!appointment) return null;

    // Fetch all services for this appointment
    const services = await db('appointment_services as aps')
      .join('salon_services as s', 'aps.service_id', 's.id')
      .where('aps.appointment_id', id)
      .select(
        'aps.id as appointment_service_id',
        's.id as service_id',
        's.name as service_name',
        's.image_url as service_image_url',
        's.icon as service_icon',
        's.service_color',
        'aps.price',
        'aps.duration_minutes',
        'aps.room_number',
        'aps.status'
      );

    appointment.services = services;
    appointment.service_name = services.map(s => s.service_name).join(', ') || 'Custom Service';
    appointment.service_price = services.reduce((sum, s) => sum + parseFloat(s.price || 0), 0);
    appointment.service_id = services[0]?.service_id || null;
    appointment.service_ids = services.map(s => s.service_id);
    appointment.service_image_url = services[0]?.service_image_url || null;
    appointment.service_icon = services[0]?.service_icon || null;
    appointment.service_color = services[0]?.service_color || null;
    appointment.customer_name = `${appointment.customer_first_name} ${appointment.customer_last_name || ''}`.trim();

    return appointment;
  }

  async create(appointmentData, servicesList, roomName = null) {
    return db.transaction(async (trx) => {
      const [appointmentId] = await trx('appointments').insert(appointmentData);
      
      const services = Array.isArray(servicesList) ? servicesList : [servicesList];
      const rows = services.map(s => ({
        appointment_id: appointmentId,
        service_id: s.id || s.service_id,
        staff_member_id: appointmentData.staff_member_id || null,
        price: s.price || 0,
        duration_minutes: s.duration || s.duration_minutes || 30,
        room_number: roomName
      }));

      await trx('appointment_services').insert(rows);

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

  async update(id, businessId, appointmentData, serviceData = null) {
    return db.transaction(async (trx) => {
      // Update appointment table
      if (Object.keys(appointmentData).length > 0) {
        appointmentData.updated_at = db.fn.now();
        await trx('appointments').where({ id, business_id: businessId }).update(appointmentData);
      }

      // Update junction table if service data changed
      if (serviceData) {
        const updatePayload = {};
        if (serviceData.service_id !== undefined) updatePayload.service_id = serviceData.service_id;
        if (serviceData.staff_id !== undefined) updatePayload.staff_member_id = serviceData.staff_id;
        if (serviceData.price !== undefined) updatePayload.price = serviceData.price;
        if (serviceData.duration !== undefined) updatePayload.duration_minutes = serviceData.duration;
        if (serviceData.room_name !== undefined) updatePayload.room_number = serviceData.room_name;
        
        if (Object.keys(updatePayload).length > 0) {
          await trx('appointment_services').where({ appointment_id: id }).update(updatePayload);
        }
      }

      return id;
    });
  }

  async delete(id, businessId) {
    return db.transaction(async (trx) => {
      await trx('appointment_services').where({ appointment_id: id }).del();
      await trx('appointments').where({ id, business_id: businessId }).del();
    });
  }

  async bulkDelete(ids, businessId) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    return db.transaction(async (trx) => {
      await trx('appointment_services').whereIn('appointment_id', ids).del();
      return trx('appointments').where({ business_id: businessId }).whereIn('id', ids).del();
    });
  }

  async bulkUpdateStatus(ids, businessId, status) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    return db('appointments').where({ business_id: businessId }).whereIn('id', ids).update({
      status,
      updated_at: db.fn.now(),
    });
  }
}

export const appointmentRepository = new AppointmentRepository();


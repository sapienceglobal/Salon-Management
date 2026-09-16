import { db as knex } from '../../config/database.js';
import { logger } from '../../config/logger.js';

export const attendanceService = {
  /**
   * Get attendance for all active staff in a given date range
   */
  getAttendance: async (businessId, startDate, endDate) => {
    try {
      // Fetch all active staff
      const staffList = await knex('staff_members as sm')
        .join('users as u', 'sm.user_id', 'u.id')
        .where('sm.business_id', businessId)
        .where('u.is_active', true)
        .select('sm.id', 'u.first_name', 'u.last_name', 'u.role');

      // Fetch attendance records in the date range
      const attendanceRecords = await knex('staff_attendance')
        .where({ business_id: businessId })
        .whereBetween('date', [startDate, endDate]);

      // Group attendance by staff_id for easy frontend consumption
      const groupedData = staffList.map(staff => {
        const staffAttendance = attendanceRecords.filter(record => record.staff_member_id === staff.id);
        
        // Convert to a dictionary with date as key for O(1) lookup on frontend
        const attendanceDict = {};
        staffAttendance.forEach(record => {
          // Format date as YYYY-MM-DD string assuming record.date is a Date object
          const dateStr = record.date instanceof Date 
             ? record.date.toISOString().split('T')[0]
             : record.date.split('T')[0];
             
          attendanceDict[dateStr] = {
            status: record.status,
            check_in_time: record.check_in_time,
            check_out_time: record.check_out_time,
            notes: record.notes
          };
        });

        return {
          id: staff.id,
          first_name: staff.first_name,
          last_name: staff.last_name,
          role: staff.role,
          attendance: attendanceDict
        };
      });

      return groupedData;
    } catch (error) {
      logger.error('Error fetching attendance:', error);
      throw error;
    }
  },

  /**
   * Mark or update attendance for a specific staff on a specific date
   */
  markAttendance: async (businessId, userId, data) => {
    try {
      const { staff_id, date, status, check_in_time, check_out_time, notes } = data;

      // Check if entry already exists
      const existing = await knex('staff_attendance')
        .where({
          business_id: businessId,
          staff_member_id: staff_id,
          date: date
        })
        .first();

      if (existing) {
        // Update
        await knex('staff_attendance')
          .where({ id: existing.id })
          .update({
            status,
            check_in_time: check_in_time || null,
            check_out_time: check_out_time || null,
            notes: notes || null,
            marked_by: userId
          });
      } else {
        // Insert
        await knex('staff_attendance').insert({
          business_id: businessId,
          staff_member_id: staff_id,
          date: date,
          status: status,
          check_in_time: check_in_time || null,
          check_out_time: check_out_time || null,
          notes: notes || null,
          marked_by: userId
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error marking attendance:', error);
      throw error;
    }
  },

  /**
   * Import attendance from CSV/JSON payload
   */
  importAttendance: async (businessId, userId, attendanceDataArray) => {
    try {
      await knex.transaction(async (trx) => {
        for (const data of attendanceDataArray) {
          const { staff_id, date, status, check_in_time, check_out_time, notes } = data;
          
          if (!staff_id || !date || !status) continue;

          const existing = await trx('staff_attendance')
            .where({
              business_id: businessId,
              staff_member_id: staff_id,
              date: date
            })
            .first();

          if (existing) {
            await trx('staff_attendance')
              .where({ id: existing.id })
              .update({
                status,
                check_in_time: check_in_time || null,
                check_out_time: check_out_time || null,
                notes: notes || null,
                marked_by: userId
              });
          } else {
            await trx('staff_attendance').insert({
              business_id: businessId,
              staff_member_id: staff_id,
              date: date,
              status: status,
              check_in_time: check_in_time || null,
              check_out_time: check_out_time || null,
              notes: notes || null,
              marked_by: userId
            });
          }
        }
      });
      return { success: true, count: attendanceDataArray.length };
    } catch (error) {
      logger.error('Error importing attendance:', error);
      throw error;
    }
  }
};

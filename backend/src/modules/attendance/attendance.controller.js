import { attendanceService } from './attendance.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    throw new ApiError(400, 'startDate and endDate are required');
  }

  const data = await attendanceService.getAttendance(req.user.business_id, startDate, endDate);
  res.status(200).json(new ApiResponse(200, 'Attendance fetched successfully', data));
});

export const markAttendance = asyncHandler(async (req, res) => {
  const { staff_id, date, status } = req.body;
  if (!staff_id || !date || !status) {
    throw new ApiError(400, 'staff_id, date, and status are required');
  }

  const data = await attendanceService.markAttendance(req.user.business_id, req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Attendance marked successfully', data));
});

export const importAttendance = asyncHandler(async (req, res) => {
  const { attendance_data } = req.body;
  if (!attendance_data || !Array.isArray(attendance_data)) {
    throw new ApiError(400, 'attendance_data array is required');
  }

  const result = await attendanceService.importAttendance(req.user.business_id, req.user.id, attendance_data);
  res.status(200).json(new ApiResponse(200, `Successfully imported ${result.count} attendance records`, result));
});

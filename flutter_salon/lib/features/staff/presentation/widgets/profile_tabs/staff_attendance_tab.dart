import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_salon/features/staff/presentation/providers/staff_profile_provider.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';

class StaffAttendanceTab extends ConsumerStatefulWidget {
  final int staffId;
  const StaffAttendanceTab({super.key, required this.staffId});

  @override
  ConsumerState<StaffAttendanceTab> createState() => _StaffAttendanceTabState();
}

class _StaffAttendanceTabState extends ConsumerState<StaffAttendanceTab> {
  late DateTime _selectedMonth;
  bool _isMarking = false;

  @override
  void initState() {
    super.initState();
    _selectedMonth = DateTime.now();
  }

  void _showMarkAttendanceDialog() async {
    DateTime markDate = DateTime.now();
    String status = 'present';
    TimeOfDay checkIn = const TimeOfDay(hour: 10, minute: 0);
    TimeOfDay checkOut = const TimeOfDay(hour: 19, minute: 0);
    final notesController = TextEditingController();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20.w,
                right: 20.w,
                top: 24.h,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24.h,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Mark Staff Attendance',
                        style: GoogleFonts.poppins(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Date
                  Text(
                    'Date',
                    style: GoogleFonts.inter(fontSize: 13.sp, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
                  ),
                  SizedBox(height: 6.h),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: markDate,
                        firstDate: DateTime(2024),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) setModalState(() => markDate = picked);
                    },
                    borderRadius: BorderRadius.circular(12.r),
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12.r),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            DateFormat('dd MMM yyyy (EEEE)').format(markDate),
                            style: GoogleFonts.inter(fontSize: 14.sp, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B)),
                          ),
                          Icon(Icons.calendar_today_rounded, color: const Color(0xFFE91E63), size: 18.sp),
                        ],
                      ),
                    ),
                  ),
                  SizedBox(height: 14.h),

                  // Status
                  Text(
                    'Status',
                    style: GoogleFonts.inter(fontSize: 13.sp, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
                  ),
                  SizedBox(height: 6.h),
                  DropdownButtonFormField<String>(
                    value: status,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'present', child: Text('Present (Full Day)')),
                      DropdownMenuItem(value: 'half_day', child: Text('Half Day')),
                      DropdownMenuItem(value: 'absent', child: Text('Absent')),
                      DropdownMenuItem(value: 'leave', child: Text('On Leave')),
                      DropdownMenuItem(value: 'weekly_off', child: Text('Weekly Off')),
                    ],
                    onChanged: (val) {
                      if (val != null) setModalState(() => status = val);
                    },
                  ),
                  SizedBox(height: 14.h),

                  // Check-in and Check-out
                  if (status == 'present' || status == 'half_day') ...[
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Check-in', style: GoogleFonts.inter(fontSize: 12.5.sp, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                              SizedBox(height: 6.h),
                              InkWell(
                                onTap: () async {
                                  final t = await showTimePicker(context: context, initialTime: checkIn);
                                  if (t != null) setModalState(() => checkIn = t);
                                },
                                child: Container(
                                  padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(10.r),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Text('${checkIn.hour.toString().padLeft(2, '0')}:${checkIn.minute.toString().padLeft(2, '0')}'),
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Check-out', style: GoogleFonts.inter(fontSize: 12.5.sp, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                              SizedBox(height: 6.h),
                              InkWell(
                                onTap: () async {
                                  final t = await showTimePicker(context: context, initialTime: checkOut);
                                  if (t != null) setModalState(() => checkOut = t);
                                },
                                child: Container(
                                  padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(10.r),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Text('${checkOut.hour.toString().padLeft(2, '0')}:${checkOut.minute.toString().padLeft(2, '0')}'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 14.h),
                  ],

                  // Notes
                  Text('Notes', style: GoogleFonts.inter(fontSize: 13.sp, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                  SizedBox(height: 6.h),
                  TextField(
                    controller: notesController,
                    decoration: InputDecoration(
                      hintText: 'e.g. Arrived on time / Shift notes',
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                  ),
                  SizedBox(height: 20.h),

                  SizedBox(
                    width: double.infinity,
                    height: 48.h,
                    child: ElevatedButton(
                      onPressed: () async {
                          final messenger = ScaffoldMessenger.of(context);
                          Navigator.pop(ctx);
                          setState(() => _isMarking = true);
                          try {
                            final dateStr = DateFormat('yyyy-MM-dd').format(markDate);
                            final inStr = '${checkIn.hour.toString().padLeft(2, '0')}:${checkIn.minute.toString().padLeft(2, '0')}';
                            final outStr = '${checkOut.hour.toString().padLeft(2, '0')}:${checkOut.minute.toString().padLeft(2, '0')}';

                            await ref.read(staffRepositoryProvider).markStaffAttendance({
                              'staff_member_id': widget.staffId,
                              'date': dateStr,
                              'status': status,
                              'check_in_time': (status == 'present' || status == 'half_day') ? inStr : null,
                              'check_out_time': (status == 'present' || status == 'half_day') ? outStr : null,
                              'notes': notesController.text.trim(),
                            });

                            ref.invalidate(staffProfileAttendanceProvider((
                              staffId: widget.staffId,
                              month: _selectedMonth.month,
                              year: _selectedMonth.year,
                            )));

                            if (mounted) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Attendance marked successfully!'),
                                  backgroundColor: Color(0xFF10B981),
                                ),
                              );
                            }
                          } catch (e) {
                            if (mounted) {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('Failed to mark attendance: ${e.toString().replaceAll("Exception: ", "")}'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          } finally {
                            if (mounted) setState(() => _isMarking = false);
                          }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE91E63),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
                        elevation: 0,
                      ),
                      child: Text('Save Attendance', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14.sp, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final attAsync = ref.watch(staffProfileAttendanceProvider((
      staffId: widget.staffId,
      month: _selectedMonth.month,
      year: _selectedMonth.year,
    )));

    return attAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: Color(0xFFE91E63)),
      ),
      error: (err, stack) => Center(
        child: Padding(
          padding: EdgeInsets.all(20.w),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, color: Colors.red, size: 40.sp),
              SizedBox(height: 8.h),
              Text('Failed to load attendance: $err', style: GoogleFonts.inter(color: Colors.red), textAlign: TextAlign.center),
              SizedBox(height: 12.h),
              ElevatedButton(
                onPressed: () => ref.invalidate(staffProfileAttendanceProvider((
                  staffId: widget.staffId,
                  month: _selectedMonth.month,
                  year: _selectedMonth.year,
                ))),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (records) {
        int presentCount = 0;
        int absentCount = 0;
        int halfDayCount = 0;
        int leaveCount = 0;

        for (var r in records) {
          final s = (r['status'] ?? '').toString().toLowerCase();
          if (s == 'present') {
            presentCount++;
          } else if (s == 'absent') {
            absentCount++;
          } else if (s == 'half_day') {
            halfDayCount++;
          } else if (s == 'leave') {
            leaveCount++;
          }
        }

        return Column(
          children: [
            // Month Switcher Header
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              color: Colors.white,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded),
                    onPressed: () {
                      setState(() {
                        _selectedMonth = DateTime(_selectedMonth.year, _selectedMonth.month - 1);
                      });
                    },
                  ),
                  Text(
                    DateFormat('MMMM yyyy').format(_selectedMonth),
                    style: GoogleFonts.poppins(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded),
                    onPressed: () {
                      setState(() {
                        _selectedMonth = DateTime(_selectedMonth.year, _selectedMonth.month + 1);
                      });
                    },
                  ),
                  ElevatedButton.icon(
                    onPressed: _isMarking ? null : _showMarkAttendanceDialog,
                    icon: Icon(Icons.check_circle_outline_rounded, size: 16.sp),
                    label: Text('Mark Log', style: GoogleFonts.inter(fontSize: 12.sp, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE91E63),
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.r)),
                      elevation: 0,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Stats Counters
            Padding(
              padding: EdgeInsets.all(16.w),
              child: Row(
                children: [
                  Expanded(child: _buildCounter('Present', '$presentCount', const Color(0xFF10B981), const Color(0xFFECFDF5))),
                  SizedBox(width: 8.w),
                  Expanded(child: _buildCounter('Absent', '$absentCount', const Color(0xFFEF4444), const Color(0xFFFEF2F2))),
                  SizedBox(width: 8.w),
                  Expanded(child: _buildCounter('Half Day', '$halfDayCount', const Color(0xFFF59E0B), const Color(0xFFFFFBEB))),
                  SizedBox(width: 8.w),
                  Expanded(child: _buildCounter('Leaves', '$leaveCount', const Color(0xFF8B5CF6), const Color(0xFFF5F3FF))),
                ],
              ),
            ),

            // Daily Log Records
            Expanded(
              child: records.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.event_note_rounded, size: 48.sp, color: const Color(0xFFCBD5E1)),
                          SizedBox(height: 12.h),
                          Text(
                            'No attendance logged for ${DateFormat('MMMM yyyy').format(_selectedMonth)}.',
                            style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 13.5.sp),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: EdgeInsets.symmetric(horizontal: 16.w),
                      itemCount: records.length,
                      itemBuilder: (context, index) {
                        final item = records[index];
                        final dateStr = item['date']?.toString() ?? 'N/A';
                        final status = (item['status'] ?? 'present').toString().toLowerCase();
                        final checkInStr = item['check_in_time']?.toString();
                        final checkOutStr = item['check_out_time']?.toString();
                        final notes = item['notes']?.toString();

                        Color sColor = const Color(0xFF10B981);
                        Color sBg = const Color(0xFFECFDF5);
                        if (status == 'absent') {
                          sColor = const Color(0xFFEF4444);
                          sBg = const Color(0xFFFEF2F2);
                        } else if (status == 'half_day') {
                          sColor = const Color(0xFFF59E0B);
                          sBg = const Color(0xFFFFFBEB);
                        } else if (status == 'leave') {
                          sColor = const Color(0xFF8B5CF6);
                          sBg = const Color(0xFFF5F3FF);
                        }

                        return Container(
                          margin: EdgeInsets.only(bottom: 10.h),
                          padding: EdgeInsets.all(14.w),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14.r),
                            border: Border.all(color: const Color(0xFFF1F5F9)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: EdgeInsets.all(8.w),
                                decoration: BoxDecoration(color: sBg, borderRadius: BorderRadius.circular(10.r)),
                                child: Icon(Icons.calendar_today_rounded, color: sColor, size: 18.sp),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      dateStr,
                                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13.5.sp, color: const Color(0xFF1E293B)),
                                    ),
                                    if (checkInStr != null || checkOutStr != null) ...[
                                      SizedBox(height: 2.h),
                                      Text(
                                        'In: ${checkInStr ?? '--:--'}  •  Out: ${checkOutStr ?? '--:--'}',
                                        style: GoogleFonts.inter(fontSize: 11.5.sp, color: const Color(0xFF64748B)),
                                      ),
                                    ],
                                    if (notes != null && notes.isNotEmpty) ...[
                                      SizedBox(height: 2.h),
                                      Text(notes, style: GoogleFonts.inter(fontSize: 11.sp, color: const Color(0xFF94A3B8))),
                                    ],
                                  ],
                                ),
                              ),
                              Container(
                                padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                                decoration: BoxDecoration(color: sBg, borderRadius: BorderRadius.circular(20.r)),
                                child: Text(
                                  status.replaceAll('_', ' ').toUpperCase(),
                                  style: GoogleFonts.inter(fontSize: 10.5.sp, fontWeight: FontWeight.bold, color: sColor),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCounter(String title, String count, Color color, Color bg) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 10.h, horizontal: 8.w),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Text(count, style: GoogleFonts.poppins(fontSize: 18.sp, fontWeight: FontWeight.bold, color: color)),
          Text(title, style: GoogleFonts.inter(fontSize: 10.5.sp, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }
}

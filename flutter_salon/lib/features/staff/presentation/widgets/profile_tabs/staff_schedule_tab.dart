import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_salon/features/staff/presentation/providers/staff_profile_provider.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';

class StaffScheduleTab extends ConsumerStatefulWidget {
  final int staffId;
  const StaffScheduleTab({super.key, required this.staffId});

  @override
  ConsumerState<StaffScheduleTab> createState() => _StaffScheduleTabState();
}

class _StaffScheduleTabState extends ConsumerState<StaffScheduleTab> {
  final List<String> _days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  Map<int, Map<String, dynamic>> _scheduleMap = {};
  bool _isSaving = false;

  Future<void> _saveSchedule() async {
    setState(() => _isSaving = true);
    try {
      final repo = ref.read(staffRepositoryProvider);
      final scheduleList = <Map<String, dynamic>>[];
      for (int i = 0; i < 7; i++) {
        final sched = _scheduleMap[i];
        if (sched != null) {
          scheduleList.add({
            'day_of_week': i,
            'is_working': sched['is_working'] == true || sched['is_working'] == 1,
            'start_time': sched['start_time'] ?? '09:00:00',
            'end_time': sched['end_time'] ?? '18:00:00',
          });
        }
      }
      await repo.updateStaffSchedule(widget.staffId, {
        'schedules': scheduleList,
      });
      ref.invalidate(staffProfileScheduleProvider(widget.staffId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Schedule saved successfully'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheduleAsync = ref.watch(
      staffProfileScheduleProvider(widget.staffId),
    );

    return scheduleAsync.when(
      loading: () => Center(child: CircularProgressIndicator()),
      error: (err, stack) =>
          Center(child: Text('Error loading schedule: $err')),
      data: (schedules) {
        if (_scheduleMap.isEmpty) {
          for (var s in schedules) {
            _scheduleMap[s['day_of_week']] = Map<String, dynamic>.from(s);
          }
        }

        return SingleChildScrollView(
          padding: EdgeInsets.all(20.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'Working Hours & Weekly Schedule',
                      style: GoogleFonts.poppins(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF1E293B),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  SizedBox(width: 8.w),
                  ElevatedButton(
                    onPressed: _isSaving ? null : _saveSchedule,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE91E63),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8.r),
                      ),
                    ),
                    child: Text(
                      'Save',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 16.h),
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.r),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _days.length,
                  separatorBuilder: (c, i) =>
                      Divider(height: 1.h, color: Color(0xFFE2E8F0)),
                  itemBuilder: (context, index) {
                    final dayName = _days[index];
                    final sched =
                        _scheduleMap[index] ??
                        {
                          'is_working': false,
                          'start_time': '09:00:00',
                          'end_time': '18:00:00',
                        };
                    final isWorking =
                        sched['is_working'] == true || sched['is_working'] == 1;

                    return Padding(
                      padding: EdgeInsets.all(16.w),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 100.w,
                            child: Text(
                              dayName,
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF1E293B),
                                fontSize: 14.sp,
                              ),
                            ),
                          ),
                          Switch(
                            value: isWorking,
                            onChanged: (val) {
                              setState(() {
                                _scheduleMap[index] = {
                                  ...sched,
                                  'is_working': val,
                                };
                              });
                            },
                            activeTrackColor: const Color(0xFFFCE7F3),
                            activeColor: const Color(0xFFE91E63),
                          ),
                          SizedBox(width: 16.w),
                          Expanded(
                            child: isWorking
                                ? Wrap(
                                    crossAxisAlignment:
                                        WrapCrossAlignment.center,
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      _buildTimePicker(
                                        sched['start_time']?.substring(0, 5) ??
                                            '09:00',
                                        (val) {
                                          setState(
                                            () => _scheduleMap[index] = {
                                              ...sched,
                                              'start_time': val,
                                            },
                                          );
                                        },
                                      ),
                                      Text(
                                        'to',
                                        style: TextStyle(
                                          color: Color(0xFF64748B),
                                        ),
                                      ),
                                      _buildTimePicker(
                                        sched['end_time']?.substring(0, 5) ??
                                            '18:00',
                                        (val) {
                                          setState(
                                            () => _scheduleMap[index] = {
                                              ...sched,
                                              'end_time': val,
                                            },
                                          );
                                        },
                                      ),
                                    ],
                                  )
                                : Text(
                                    'Off / Unavailable',
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFF94A3B8),
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTimePicker(String timeStr, Function(String) onChanged) {
    return InkWell(
      onTap: () async {
        final time = await showTimePicker(
          context: context,
          initialTime: TimeOfDay(
            hour: int.tryParse(timeStr.split(':')[0]) ?? 9,
            minute: int.tryParse(timeStr.split(':')[1]) ?? 0,
          ),
        );
        if (time != null) {
          final hr = time.hour.toString().padLeft(2, '0');
          final min = time.minute.toString().padLeft(2, '0');
          onChanged('$hr:$min:00');
        }
      },
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(6.r),
          border: Border.all(color: const Color(0xFFCBD5E1)),
        ),
        child: Row(
          children: [
            Icon(Icons.schedule, size: 14.sp, color: Color(0xFF64748B)),
            SizedBox(width: 6.w),
            Text(
              timeStr,
              style: GoogleFonts.inter(
                fontSize: 13.sp,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

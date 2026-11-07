import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';
import 'package:flutter_salon/features/staff/data/attendance_repository.dart';
import '../providers/attendance_provider.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class StaffAttendanceScreen extends ConsumerStatefulWidget {
  const StaffAttendanceScreen({super.key});

  @override
  ConsumerState<StaffAttendanceScreen> createState() =>
      _StaffAttendanceScreenState();
}

class _StaffAttendanceScreenState extends ConsumerState<StaffAttendanceScreen> {
  DateTime _selectedDate = DateTime.now();
  final List<String> _statuses = [
    'present',
    'absent',
    'half_day',
    'weekly_off',
    'holiday',
    'leave',
  ];

  @override
  Widget build(BuildContext context) {
    final staffAsync = ref.watch(staffListProvider);
    final formattedDate = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final attendanceAsync = ref.watch(
      attendanceListProvider((date: formattedDate, staffMemberId: null)),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text('Staff Attendance'),
        actions: [
          IconButton(
            icon: Icon(Icons.calendar_today),
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _selectedDate,
                firstDate: DateTime(2020),
                lastDate: DateTime.now(),
              );
              if (picked != null) {
                setState(() => _selectedDate = picked);
              }
            },
          ),
        ],
      ),
      body: staffAsync.when(
        loading: () => const SkeletonList(),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (staffList) {
          if (staffList.isEmpty) {
            return Center(child: Text('No staff members found.'));
          }

          return attendanceAsync.when(
            loading: () => const SkeletonList(),
            error: (err, stack) =>
                Center(child: Text('Error loading attendance: $err')),
            data: (attendanceList) {
              return ListView.builder(
                padding: EdgeInsets.all(16.w),
                itemCount: staffList.length,
                itemBuilder: (context, index) {
                  final staff = staffList[index];
                  // Find if attendance is already marked
                  final record = attendanceList.firstWhere(
                    (a) => a['staff_member_id'] == staff['id'],
                    orElse: () => null,
                  );

                  String currentStatus = record != null
                      ? record['status']
                      : 'absent'; // default to absent if not marked

                  return Card(
                    margin: EdgeInsets.only(bottom: 12.h.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    child: Padding(
                      padding: EdgeInsets.all(16.w),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: AppColors.primaryLight,
                            child: Text(
                              (staff['first_name'] as String)[0],
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          SizedBox(width: 16.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${staff['first_name']} ${staff['last_name']}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16.sp,
                                  ),
                                ),
                                Text(
                                  staff['designation'] ?? 'Staff',
                                  style: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 12.sp,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          DropdownButton<String>(
                            value: currentStatus,
                            underline: SizedBox(),
                            icon: Icon(
                              Icons.arrow_drop_down,
                              color: AppColors.primary,
                            ),
                            items: _statuses.map((status) {
                              return DropdownMenuItem(
                                value: status,
                                child: Text(
                                  _formatStatus(status),
                                  style: TextStyle(fontSize: 14.sp),
                                ),
                              );
                            }).toList(),
                            onChanged: (newStatus) async {
                              if (newStatus != null) {
                                try {
                                  await ref
                                      .read(attendanceRepositoryProvider)
                                      .markAttendance(
                                        staffMemberId: staff['id'],
                                        date: formattedDate,
                                        status: newStatus,
                                      );
                                  ref.invalidate(attendanceListProvider);
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Attendance updated successfully',
                                        ),
                                        duration: Duration(seconds: 1),
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Failed: $e')),
                                    );
                                  }
                                }
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }

  String _formatStatus(String status) {
    switch (status) {
      case 'half_day':
        return 'Half Day';
      case 'weekly_off':
        return 'Weekly Off';
      default:
        return status[0].toUpperCase() + status.substring(1);
    }
  }
}

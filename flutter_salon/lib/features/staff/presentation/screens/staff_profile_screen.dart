import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';

import 'package:flutter_salon/features/staff/presentation/widgets/profile_tabs/staff_overview_tab.dart';
import 'package:flutter_salon/features/staff/presentation/widgets/profile_tabs/staff_services_tab.dart';
import 'package:flutter_salon/features/staff/presentation/widgets/profile_tabs/staff_schedule_tab.dart';
import 'package:flutter_salon/features/staff/presentation/widgets/profile_tabs/staff_appointments_tab.dart';
import 'package:flutter_salon/features/staff/presentation/widgets/profile_tabs/staff_attendance_tab.dart';
import 'package:flutter_salon/features/staff/presentation/widgets/profile_tabs/staff_performance_tab.dart';
import 'package:flutter_salon/features/staff/presentation/widgets/profile_tabs/staff_leave_tab.dart';
import 'package:flutter_salon/features/staff/presentation/widgets/profile_tabs/staff_documents_tab.dart';

class StaffProfileScreen extends ConsumerStatefulWidget {
  final int staffId;
  const StaffProfileScreen({super.key, required this.staffId});

  @override
  ConsumerState<StaffProfileScreen> createState() => _StaffProfileScreenState();
}

class _StaffProfileScreenState extends ConsumerState<StaffProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<String> _tabs = [
    'Overview',
    'Services',
    'Schedule',
    'Appointments',
    'Attendance',
    'Performance',
    'Leaves',
    'Documents',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final staffAsync = ref.watch(staffMemberProvider(widget.staffId));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            color: const Color(0xFF1E293B),
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Staff Profile',
          style: GoogleFonts.poppins(
            fontSize: 18.sp,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1E293B),
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.edit_rounded, color: const Color(0xFFE91E63)),
            onPressed: () {
              final currentStaff = ref
                  .read(staffMemberProvider(widget.staffId))
                  .value;
              if (currentStaff != null) {
                context.push('/staff/edit', extra: currentStaff);
              }
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded, color: Color(0xFF1E293B)),
            onSelected: (value) async {
              if (value == 'toggle_active') {
                final currentStaff = ref.read(staffMemberProvider(widget.staffId)).value;
                final currentlyActive = currentStaff != null && isStaffActive(currentStaff);
                try {
                  await ref.read(staffRepositoryProvider).toggleStaffActive(widget.staffId);
                  ref.invalidate(staffMemberProvider(widget.staffId));
                  ref.invalidate(staffListProvider);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Staff marked as ${currentlyActive ? 'inactive' : 'active'}'),
                        backgroundColor: const Color(0xFF10B981),
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error: ${e.toString().replaceAll("Exception: ", "")}'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              } else if (value == 'delete_staff') {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text('Delete Staff Member', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                    content: const Text(
                      'Are you sure you want to permanently delete this staff member? This will remove all their schedule, documents, and historical mappings.',
                    ),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
                        child: const Text('Delete Permanently', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                );

                if (confirm == true) {
                  try {
                    await ref.read(staffRepositoryProvider).deleteStaffMember(widget.staffId);
                    ref.invalidate(staffListProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Staff member deleted successfully'), backgroundColor: Color(0xFF10B981)),
                      );
                      context.pop();
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed to delete staff: $e'), backgroundColor: Colors.red),
                      );
                    }
                  }
                }
              }
            },
            itemBuilder: (context) {
              final currentStaff = ref.read(staffMemberProvider(widget.staffId)).value;
              final isActive = currentStaff != null && isStaffActive(currentStaff);
              return [
                PopupMenuItem(
                  value: 'toggle_active',
                  child: Text(isActive ? 'Mark Inactive' : 'Mark Active'),
                ),
                const PopupMenuItem(
                  value: 'delete_staff',
                  child: Text('Delete Staff', style: TextStyle(color: Color(0xFFEF4444))),
                ),
              ];
            },
          ),
          SizedBox(width: 8.w),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFF1F5F9), height: 1),
        ),
      ),
      body: staffAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFFE91E63)),
        ),
        error: (err, stack) => Center(
          child: Text(
            'Error loading profile: $err',
            style: GoogleFonts.inter(color: Colors.red),
          ),
        ),
        data: (staff) {
          if (staff.isEmpty) {
            return Center(
              child: Text('Staff not found', style: GoogleFonts.inter()),
            );
          }

          return Column(
            children: [
              _buildHeader(staff),
              _buildTabBar(),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    StaffOverviewTab(staff: staff),
                    StaffServicesTab(staffId: widget.staffId),
                    StaffScheduleTab(staffId: widget.staffId),
                    StaffAppointmentsTab(staffId: widget.staffId),
                    StaffAttendanceTab(staffId: widget.staffId),
                    StaffPerformanceTab(staffId: widget.staffId),
                    StaffLeaveTab(staffId: widget.staffId),
                    StaffDocumentsTab(staffId: widget.staffId),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildHeader(Map<String, dynamic> staff) {
    final isActive = isStaffActive(staff);
    final statusColor = isActive
        ? const Color(0xFF10B981)
        : const Color(0xFFEF4444);
    final statusBgColor = isActive
        ? const Color(0xFFECFDF5)
        : const Color(0xFFFEE2E2);
    final statusText = isActive ? 'Active' : 'Inactive';

    final firstName = staff['first_name'] ?? 'Unknown';
    final lastName = staff['last_name'] ?? '';
    final initials =
        (firstName.isNotEmpty ? firstName[0].toUpperCase() : '') +
        (lastName.isNotEmpty ? lastName[0].toUpperCase() : '');

    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 24.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          Builder(
            builder: (context) {
              final rawImageUrl = staff['avatar_url'] ?? staff['profile_image_url'] ?? staff['profile_image'] ?? staff['image_url'];
              final rawUrl = rawImageUrl != null ? rawImageUrl.toString().split(',').first.trim() : null;
              final fullUrl = (rawUrl != null && rawUrl.startsWith('/')) 
                  ? '$kBaseMediaUrl$rawUrl'
                  : rawUrl;
              
              return Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFE91E63).withOpacity(0.2),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: CircleAvatar(
                  radius: 44.r,
                  backgroundImage: (fullUrl != null && fullUrl.isNotEmpty)
                      ? NetworkImage(fullUrl)
                      : null,
                  backgroundColor: const Color(0xFFFCE7F3),
                  child: (fullUrl == null || fullUrl.isEmpty)
                      ? Text(
                          initials,
                          style: GoogleFonts.poppins(
                            fontSize: 28.sp,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFFE91E63),
                          ),
                        )
                      : null,
                ),
              );
            }
          ),
          SizedBox(width: 20.w),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        '$firstName $lastName'.trim(),
                        style: GoogleFonts.poppins(
                          fontSize: 22.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    InkWell(
                      onTap: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        try {
                          await ref.read(staffRepositoryProvider).toggleStaffActive(widget.staffId);
                          ref.invalidate(staffMemberProvider(widget.staffId));
                          ref.invalidate(staffListProvider);
                          if (mounted) {
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text('Staff marked as ${isActive ? 'inactive' : 'active'}'),
                                backgroundColor: const Color(0xFF10B981),
                              ),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text('Error: ${e.toString().replaceAll("Exception: ", "")}'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                      },
                      borderRadius: BorderRadius.circular(12.r),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 10.w,
                          vertical: 4.h,
                        ),
                        decoration: BoxDecoration(
                          color: statusBgColor,
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.circle, color: statusColor, size: 8.sp),
                            SizedBox(width: 4.w),
                            Text(
                              statusText,
                              style: GoogleFonts.inter(
                                color: statusColor,
                                fontSize: 11.sp,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 4.h),
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: 10.w,
                    vertical: 4.h,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: Text(
                    staff['designation'] ?? 'Staff Member',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF475569),
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                SizedBox(height: 12.h),
                if (staff['phone'] != null) ...[
                  _buildContactRow(Icons.phone_rounded, staff['phone']),
                  SizedBox(height: 6.h),
                ],
                if (staff['email'] != null)
                  _buildContactRow(Icons.email_rounded, staff['email']),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16.sp, color: const Color(0xFF94A3B8)),
        SizedBox(width: 8.w),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.inter(
              color: const Color(0xFF64748B),
              fontSize: 13.sp,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      width: double.infinity,
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        labelColor: const Color(0xFFE91E63),
        unselectedLabelColor: const Color(0xFF64748B),
        indicatorColor: const Color(0xFFE91E63),
        indicatorWeight: 3,
        labelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.bold,
          fontSize: 14.sp,
        ),
        unselectedLabelStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          fontSize: 14.sp,
        ),
        padding: EdgeInsets.zero,
        tabAlignment: TabAlignment.start,
        tabs: _tabs.map((t) => Tab(text: t)).toList(),
      ),
    );
  }
}

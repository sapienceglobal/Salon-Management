import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';
import 'package:flutter_salon/core/widgets/app_drawer.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import 'package:flutter_salon/core/widgets/premium_stat_card.dart';
import '../../../../core/widgets/skeletons/skeleton_card.dart';

final GlobalKey<ScaffoldState> staffScaffoldKey = GlobalKey<ScaffoldState>();

class StaffListScreen extends ConsumerWidget {
  const StaffListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final staffAsync = ref.watch(staffListProvider);
    final selectedRole = ref.watch(staffSelectedRoleProvider);

    int totalStaff = 0;
    int activeStaff = 0;
    int onLeaveStaff = 0;
    int inactiveStaff = 0;

    if (staffAsync.hasValue && staffAsync.value != null) {
      final list = staffAsync.value!;
      totalStaff = list.length;
      activeStaff = list.where((s) => isStaffActive(s)).length;
      onLeaveStaff = list.where((s) => s['is_available'] == 0 || s['is_available'] == false).length;
      inactiveStaff = list.where((s) => !isStaffActive(s)).length;
    }

    return Scaffold(
      key: staffScaffoldKey,
      drawer: const AppDrawer(),
      backgroundColor: const Color(0xFFFAFAFA),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: CustomScrollView(
                slivers: [
                  // --- Top Hero Banner ---
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 0),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24.r),
                        child: Container(
                          height: 210.h,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                const Color(0xFFFFFFFF), // Pure white
                                const Color(0xFFFDF2F8), // Very soft pink
                                const Color(0xFFFCE7F3), // Brand light pink
                                const Color(0xFFF9A8D4).withOpacity(0.3), // A hint of deeper pink
                              ],
                              stops: const [0.0, 0.4, 0.7, 1.0],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFCE7F3).withOpacity(0.5),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Stack(
                            children: [
                              // Content Overlay
                              Positioned.fill(
                                child: Padding(
                                  padding: EdgeInsets.all(24.w),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Top row with back button and Add button
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          InkWell(
                                            onTap: () {
                                              if (context.canPop()) {
                                                context.pop();
                                              } else {
                                                context.go('/dashboard');
                                              }
                                            },
                                            borderRadius: BorderRadius.circular(
                                              8.r,
                                            ),
                                            child: Container(
                                              padding: EdgeInsets.all(8.w),
                                              decoration: BoxDecoration(
                                                color: Colors.white.withOpacity(
                                                  0.9,
                                                ),
                                                shape: BoxShape.circle,
                                              ),
                                              child: Icon(
                                                Icons.arrow_back_rounded,
                                                color: const Color(0xFF1A1A2E),
                                                size: 20.sp,
                                              ),
                                            ),
                                          ),
                                          MediaQuery.of(context).size.width >
                                                  380
                                              ? ElevatedButton.icon(
                                                  onPressed: () async {
                                                    await context.push('/staff/add');
                                                    ref.invalidate(staffListProvider);
                                                  },
                                                  icon: Icon(
                                                    Icons.add_rounded,
                                                    size: 18.sp,
                                                  ),
                                                  label: Text(
                                                    'Add Staff',
                                                    style: GoogleFonts.inter(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor:
                                                        const Color(0xFFE91E63),
                                                    foregroundColor:
                                                        Colors.white,
                                                    padding:
                                                        EdgeInsets.symmetric(
                                                          horizontal: 16.w,
                                                          vertical: 8.h,
                                                        ),
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            12.r,
                                                          ),
                                                    ),
                                                    elevation: 0,
                                                  ),
                                                )
                                              : FloatingActionButton.small(
                                                   onPressed: () async {
                                                     await context.push('/staff/add');
                                                     ref.invalidate(staffListProvider);
                                                   },
                                                  backgroundColor: const Color(
                                                    0xFFE91E63,
                                                  ),
                                                  child: Icon(
                                                    Icons.add_rounded,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                        ],
                                      ),
                                      SizedBox(height: 16.h),
                                      // Title and Subtitle
                                      Text(
                                        'Staff Members',
                                        style: GoogleFonts.poppins(
                                          fontSize: 24.sp,
                                          fontWeight: FontWeight.w800,
                                          color: const Color(0xFF0F172A),
                                          height: 1.1.h,
                                        ),
                                      ),
                                      SizedBox(height: 8.h),
                                      Text(
                                        'Manage your team, assign services, set schedules and track performance.',
                                        style: GoogleFonts.inter(
                                          fontSize: 12.sp,
                                          fontWeight: FontWeight.w500,
                                          color: const Color(0xFF334155),
                                          height: 1.4.h,
                                        ),
                                      ),
                                      SizedBox(height: 12.h),
                                      Container(
                                        width: 40.w,
                                        height: 3.h,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFE91E63),
                                          borderRadius: BorderRadius.circular(
                                            2.r,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(20.0.w),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(height: 24.h),

                          // --- Stat Cards ---
                          if (staffAsync.isLoading && !staffAsync.hasValue)
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: SkeletonCard(
                                horizontal: true,
                                count: 4,
                                width: 160.w,
                                height: 120.h,
                              ),
                            )
                          else
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  _buildStatCard(
                                    icon: Icons.groups_rounded,
                                    iconColor: const Color(0xFFE91E63),
                                    bgColor: const Color(0xFFFFF0F5),
                                    value: totalStaff.toString(),
                                    label: 'Total Staff',
                                  ),
                                  _buildStatCard(
                                    icon: Icons.group_rounded,
                                    iconColor: const Color(0xFF10B981),
                                    bgColor: const Color(0xFFECFDF5),
                                    value: activeStaff.toString(),
                                    label: 'Active Staff',
                                  ),
                                  _buildStatCard(
                                    icon: Icons.person_off_rounded,
                                    iconColor: const Color(0xFFF59E0B),
                                    bgColor: const Color(0xFFFFFBEB),
                                    value: onLeaveStaff.toString(),
                                    label: 'On Leave',
                                  ),
                                  _buildStatCard(
                                    icon: Icons.person_remove_rounded,
                                    iconColor: const Color(0xFFEF4444),
                                    bgColor: const Color(0xFFFEF2F2),
                                    value: inactiveStaff.toString(),
                                    label: 'Inactive',
                                  ),
                                ],
                              ),
                            ),
                          SizedBox(height: 24.h),

                          // --- Search ---
                          TextField(
                            onSubmitted: (value) =>
                                ref
                                        .read(staffSearchQueryProvider.notifier)
                                        .state =
                                    value,
                            decoration: InputDecoration(
                              hintText: 'Search by name, role or phone...',
                              hintStyle: GoogleFonts.inter(
                                color: const Color(0xFF94A3B8),
                                fontSize: 13.sp,
                              ),
                              prefixIcon: Icon(
                                Icons.search_rounded,
                                color: const Color(0xFF94A3B8),
                                size: 20.sp,
                              ),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide: const BorderSide(
                                  color: Color(0xFFE2E8F0),
                                  width: 1.0,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide: const BorderSide(
                                  color: Color(0xFFE2E8F0),
                                  width: 1.0,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide: const BorderSide(
                                  color: Color(0xFFE91E63),
                                  width: 1.5,
                                ),
                              ),
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 16.w,
                                vertical: 0,
                              ),
                            ),
                          ),

                          SizedBox(height: 20.h),

                          // --- Tabs ---
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _buildTab(
                                  'All',
                                  selectedRole == 'All',
                                  ref,
                                  'All',
                                ),
                                _buildTab(
                                  'Stylists',
                                  selectedRole == 'Stylist',
                                  ref,
                                  'Stylist',
                                ),
                                _buildTab(
                                  'Therapists',
                                  selectedRole == 'Therapist',
                                  ref,
                                  'Therapist',
                                ),
                                _buildTab(
                                  'Nail Experts',
                                  selectedRole == 'Nail Expert',
                                  ref,
                                  'Nail Expert',
                                ),
                                _buildTab(
                                  'Makeup Artists',
                                  selectedRole == 'Makeup Artist',
                                  ref,
                                  'Makeup Artist',
                                ),
                                _buildTab(
                                  'Reception',
                                  selectedRole == 'Receptionist',
                                  ref,
                                  'Receptionist',
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // --- Staff Table (Horizontal Scroll) ---
                  staffAsync.when(
                    loading: () =>
                        const SliverToBoxAdapter(child: SkeletonList()),
                    error: (err, stack) => SliverToBoxAdapter(
                      child: Center(
                        child: Text('Error: $err', style: GoogleFonts.inter()),
                      ),
                    ),
                    data: (staffList) {
                      if (staffList.isEmpty) {
                        return SliverToBoxAdapter(
                          child: Center(
                            child: Padding(
                              padding: EdgeInsets.all(40.0.w),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.people_outline,
                                    size: 64.sp,
                                    color: Color(0xFFE2E8F0),
                                  ),
                                  SizedBox(height: 16.h),
                                  Text(
                                    'No staff members found.',
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFF64748B),
                                      fontSize: 16.sp,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }

                      return SliverList(
                        delegate: SliverChildBuilderDelegate((context, index) {
                          final staff = staffList[index];
                          return _buildTableRow(context, ref, staff);
                        }, childCount: staffList.length),
                      );
                    },
                  ),
                  // --- Bottom Scrollable Banner ---
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(20.w, 10.h, 20.w, 20.h),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16.r),
                        child: Container(
                          constraints: BoxConstraints(
                            minHeight: 100.h,
                            maxHeight: 160.h,
                          ),
                          width: double.infinity,
                          decoration: const BoxDecoration(
                            color: Color(0xFFFFF0F5),
                          ),
                          child: Stack(
                            children: [
                              Positioned(
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: 350.w,
                                child: Image.asset(
                                  'assets/images/staff_banner.jpg',
                                  fit: BoxFit.cover,
                                  alignment: Alignment.center,
                                ),
                              ),
                              // Gradient overlay for smooth transition
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.centerLeft,
                                      end: Alignment.centerRight,
                                      stops: const [0.4, 0.7],
                                      colors: [
                                        const Color(0xFFFFF0F5),
                                        const Color(
                                          0xFFFFF0F5,
                                        ).withOpacity(0.0),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                left: 24.w,
                                top: 16.h,
                                bottom: 16.h,
                                width: 220.w,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'A Great Team\nBuilds Beautiful Experiences',
                                      style: GoogleFonts.poppins(
                                        fontSize: 16.sp,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFFE91E63),
                                        height: 1.2.h,
                                      ),
                                    ),
                                    SizedBox(height: 6.h),
                                    Text(
                                      'Empower your staff, grow your salon.',
                                      style: GoogleFonts.inter(
                                        fontSize: 11.sp,
                                        color: const Color(
                                          0xFFE91E63,
                                        ).withOpacity(0.8),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required String value,
    required String label,
  }) {
    return PremiumStatCard(
      title: label,
      value: value,
      icon: icon,
      mainColor: iconColor,
      bgColor: bgColor,
    );
  }

  Widget _buildTab(String label, bool isSelected, WidgetRef ref, String role) {
    return GestureDetector(
      onTap: () {
        ref.read(staffSelectedRoleProvider.notifier).state = role;
      },
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        margin: EdgeInsets.only(right: 8.w),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE91E63) : Colors.white,
          borderRadius: BorderRadius.circular(20.r),
          border: Border.all(
            color: isSelected
                ? const Color(0xFFE91E63)
                : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            color: isSelected ? Colors.white : const Color(0xFF64748B),
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            fontSize: 13.sp,
          ),
        ),
      ),
    );
  }

  Widget _buildTableRow(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> staff,
  ) {
    final name = '${staff['first_name'] ?? ''} ${staff['last_name'] ?? ''}'
        .trim();
    final role = staff['role']?.toString() ?? 'Staff';
    final rawImageUrl = staff['avatar_url'] ?? staff['profile_image_url'] ?? staff['profile_image'] ?? staff['image_url'];
    final rawUrl = rawImageUrl?.toString().split(',').first.trim();
    final fullUrl = (rawUrl != null && rawUrl.startsWith('/')) 
        ? '$kBaseMediaUrl$rawUrl' 
        : rawUrl;
    final isActive = isStaffActive(staff);
    final Color statusColor = isActive ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    final Color statusBg = isActive ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2);

    return GestureDetector(
      onTap: () async {
        await context.push('/staff/profile/${staff['id']}');
        ref.invalidate(staffListProvider);
      },
      child: Container(
        margin: EdgeInsets.only(bottom: 12.h, left: 20.w, right: 20.w),
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48.w,
              height: 48.w,
              decoration: BoxDecoration(
                color: const Color(0xFFFFF0F5),
                shape: BoxShape.circle,
              ),
              clipBehavior: Clip.antiAlias,
              child: (fullUrl != null && fullUrl.isNotEmpty)
                  ? Image.network(
                      fullUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (c, e, s) => Center(
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : '?',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFFE91E63),
                            fontWeight: FontWeight.bold,
                            fontSize: 18.sp,
                          ),
                        ),
                      ),
                    )
                  : Center(
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFFE91E63),
                          fontWeight: FontWeight.bold,
                          fontSize: 18.sp,
                        ),
                      ),
                    ),
            ),
            SizedBox(width: 16.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name.isEmpty ? 'Unknown' : name,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 14.sp,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    role,
                    style: GoogleFonts.inter(
                      fontSize: 12.sp,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  if (staff['commission_profile_name'] != null &&
                      staff['commission_profile_name'].toString().isNotEmpty) ...[
                    SizedBox(height: 4.h),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.h),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDF2F8),
                        borderRadius: BorderRadius.circular(6.r),
                        border: Border.all(color: const Color(0xFFFBCFE8)),
                      ),
                      child: Text(
                        '${staff['commission_profile_name']} (${staff['commission_type'] == 'percentage' ? "${staff['commission_value']}%" : "₹${staff['commission_value']}"})',
                        style: GoogleFonts.inter(
                          fontSize: 10.sp,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFE91E63),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
              decoration: BoxDecoration(
                color: statusBg,
                borderRadius: BorderRadius.circular(20.r),
              ),
              child: Text(
                isActive ? 'ACTIVE' : 'INACTIVE',
                style: GoogleFonts.inter(
                  color: statusColor,
                  fontSize: 10.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            SizedBox(width: 8.w),
            PopupMenuButton<String>(
              icon: Icon(
                Icons.more_vert,
                color: const Color(0xFF64748B),
                size: 20.sp,
              ),
              padding: EdgeInsets.zero,
              onSelected: (value) async {
                if (value == 'edit') {
                  final res = await context.push('/staff/edit', extra: staff);
                  if (res == true) {
                    ref.invalidate(staffListProvider);
                  }
                } else if (value == 'toggle_active') {
                  final currentlyActive = isStaffActive(staff);
                  try {
                    await ref.read(staffRepositoryProvider).toggleStaffActive(staff['id']);
                    staff['is_active'] = !currentlyActive;
                    ref.invalidate(staffListProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('$name marked as ${currentlyActive ? 'inactive' : 'active'}'),
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
                } else if (value == 'delete') {
                  _confirmDelete(context, ref, staff);
                }
              },
              itemBuilder: (context) {
                final isActive = isStaffActive(staff);
                return [
                  const PopupMenuItem(value: 'edit', child: Text('Edit')),
                  PopupMenuItem(
                    value: 'toggle_active',
                    child: Text(isActive ? 'Mark Inactive' : 'Mark Active'),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('Delete', style: TextStyle(color: Colors.red)),
                  ),
                ];
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> staff,
  ) async {
    final name = '${staff['first_name']} ${staff['last_name']}'.trim();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
        ),
        title: Text(
          'Delete Staff Member?',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'This will permanently deactivate $name. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      try {
        final repository = ref.read(staffRepositoryProvider);
        await repository.deleteStaffMember(staff['id']);
        ref.invalidate(staffListProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$name has been removed'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFFEF4444),
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: $e'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }
}

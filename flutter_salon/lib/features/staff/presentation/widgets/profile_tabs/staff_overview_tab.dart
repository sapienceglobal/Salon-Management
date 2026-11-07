import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';
import 'package:flutter_salon/features/staff/presentation/providers/staff_profile_provider.dart';

class StaffOverviewTab extends ConsumerWidget {
  final Map<String, dynamic> staff;

  const StaffOverviewTab({super.key, required this.staff});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final staffId = staff['id'] as int? ?? 0;
    final perfAsync = ref.watch(staffProfilePerformanceProvider((staffId: staffId, startDate: null, endDate: null)));
    final perf = perfAsync.value ?? {};

    final specializations = staff['specializations'];
    List<String> specsList = [];
    if (specializations is List) {
      specsList = specializations.map((e) => e.toString().trim()).where((s) => s.isNotEmpty).toList();
    } else if (specializations is String && specializations.trim().isNotEmpty) {
      specsList = specializations.split(',').map((e) => e.trim()).where((s) => s.isNotEmpty).toList();
    }

    final bio = staff['bio']?.toString().trim();

    return ListView(
      padding: EdgeInsets.all(20.w),
      children: [
        // 1. Quick Stats Grid
        Row(
          children: [
            Expanded(
              child: _buildMiniStatCard(
                title: 'Total Bookings',
                value: '${perf['total_appointments'] ?? 0}',
                icon: Icons.calendar_month_rounded,
                color: const Color(0xFFE91E63),
                bgColor: const Color(0xFFFDF2F8),
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: _buildMiniStatCard(
                title: 'Total Revenue',
                value: '₹${perf['total_revenue'] ?? 0}',
                icon: Icons.payments_rounded,
                color: const Color(0xFF10B981),
                bgColor: const Color(0xFFECFDF5),
              ),
            ),
          ],
        ),
        SizedBox(height: 12.h),
        Row(
          children: [
            Expanded(
              child: _buildMiniStatCard(
                title: 'Avg Rating',
                value: '${perf['avg_rating'] ?? '5.0'} ★',
                icon: Icons.star_rounded,
                color: const Color(0xFFF59E0B),
                bgColor: const Color(0xFFFFFBEB),
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: _buildMiniStatCard(
                title: 'Days Present',
                value: '${perf['present_days'] ?? 0} Days',
                icon: Icons.check_circle_rounded,
                color: const Color(0xFF6366F1),
                bgColor: const Color(0xFFEEF2FF),
              ),
            ),
          ],
        ),
        SizedBox(height: 16.h),

        // 2. Specializations / Skills (if available)
        if (specsList.isNotEmpty) ...[
          _buildInfoCard(
            title: 'Specializations & Skills',
            icon: Icons.auto_awesome_rounded,
            children: [
              Wrap(
                spacing: 8.w,
                runSpacing: 8.h,
                children: specsList.map((skill) {
                  return Container(
                    padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFDF2F8),
                      borderRadius: BorderRadius.circular(20.r),
                      border: Border.all(color: const Color(0xFFFBCFE8)),
                    ),
                    child: Text(
                      skill,
                      style: GoogleFonts.inter(
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFFDB2777),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          SizedBox(height: 16.h),
        ],

        // 3. Bio / Summary (if available)
        if (bio != null && bio.isNotEmpty) ...[
          _buildInfoCard(
            title: 'About / Professional Bio',
            icon: Icons.format_quote_rounded,
            children: [
              Text(
                bio,
                style: GoogleFonts.inter(
                  fontSize: 13.sp,
                  color: const Color(0xFF475569),
                  height: 1.5,
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
        ],

        // 4. Employment Details
        _buildInfoCard(
          title: 'Employment & Compensation',
          icon: Icons.work_outline_rounded,
          children: [
            _buildDataRow('Role', staff['role']?.toString().toUpperCase() ?? 'STAFF'),
            _buildDataRow(
              'Designation',
              staff['designation']?.toString() ?? 'Staff Member',
            ),
            _buildDataRow(
              'Joined Date',
              _formatDate(staff['joining_date']?.toString() ?? staff['created_at']?.toString()),
            ),
            _buildDataRow(
              'Monthly Salary',
              (staff['salary'] != null && double.tryParse(staff['salary'].toString()) != null && double.parse(staff['salary'].toString()) > 0)
                  ? '₹${staff['salary']}'
                  : 'Not specified',
            ),
            _buildDataRow(
              'Commission Plan',
              (staff['commission_profile_name'] != null && staff['commission_profile_name'].toString().isNotEmpty)
                  ? '${staff['commission_profile_name']} (${staff['commission_profile_type'] ?? staff['commission_type'] == 'percentage' ? "${staff['commission_profile_value'] ?? staff['commission_value']}%" : "₹${staff['commission_profile_value'] ?? staff['commission_value']}"})'
                  : 'Salary Only (No Commission)',
              valueColor: (staff['commission_profile_name'] != null && staff['commission_profile_name'].toString().isNotEmpty)
                  ? const Color(0xFFE91E63)
                  : null,
            ),
            _buildDataRow(
              'Account Status',
              isStaffActive(staff) ? 'Active' : 'Inactive',
              valueColor: isStaffActive(staff)
                  ? const Color(0xFF10B981)
                  : const Color(0xFFEF4444),
            ),
          ],
        ),
        SizedBox(height: 16.h),

        // 5. Contact Details
        _buildInfoCard(
          title: 'Contact Information',
          icon: Icons.contact_mail_outlined,
          children: [
            _buildDataRow('Phone Number', staff['phone']?.toString() ?? 'N/A'),
            _buildDataRow('Email Address', staff['email']?.toString() ?? 'N/A'),
            _buildDataRow(
              'City / Address',
              staff['address']?.toString() ?? 'Main Branch',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMiniStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required Color bgColor,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFFF1F5F9)),
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
            padding: EdgeInsets.all(8.w),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(10.r),
            ),
            child: Icon(icon, color: color, size: 20.sp),
          ),
          SizedBox(width: 10.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E293B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 11.sp,
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: EdgeInsets.all(18.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(8.w),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCE7F3),
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: Icon(icon, color: const Color(0xFFE91E63), size: 18.sp),
              ),
              SizedBox(width: 12.w),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 15.sp,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF1E293B),
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDataRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13.sp,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13.5.sp,
                fontWeight: FontWeight.w600,
                color: valueColor ?? const Color(0xFF1E293B),
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

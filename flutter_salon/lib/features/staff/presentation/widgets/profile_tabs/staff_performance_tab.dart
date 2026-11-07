import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_salon/core/widgets/premium_stat_card.dart';
import 'package:flutter_salon/features/staff/presentation/providers/staff_profile_provider.dart';

class StaffPerformanceTab extends ConsumerStatefulWidget {
  final int staffId;
  const StaffPerformanceTab({super.key, required this.staffId});

  @override
  ConsumerState<StaffPerformanceTab> createState() =>
      _StaffPerformanceTabState();
}

class _StaffPerformanceTabState extends ConsumerState<StaffPerformanceTab> {
  String _selectedFilter = 'This Month';

  ({String? startDate, String? endDate}) _getDateRange(String filter) {
    final now = DateTime.now();
    final fmt = DateFormat('yyyy-MM-dd');
    final todayStr = fmt.format(now);

    switch (filter) {
      case 'Today':
        return (startDate: todayStr, endDate: todayStr);
      case 'This Week':
        final monday = now.subtract(Duration(days: (now.weekday - 1) % 7));
        return (startDate: fmt.format(monday), endDate: todayStr);
      case 'This Month':
        final firstDay = DateTime(now.year, now.month, 1);
        return (startDate: fmt.format(firstDay), endDate: todayStr);
      case 'This Year':
        final firstJan = DateTime(now.year, 1, 1);
        return (startDate: fmt.format(firstJan), endDate: todayStr);
      default:
        final firstDay = DateTime(now.year, now.month, 1);
        return (startDate: fmt.format(firstDay), endDate: todayStr);
    }
  }

  @override
  Widget build(BuildContext context) {
    final range = _getDateRange(_selectedFilter);
    final perfAsync = ref.watch(
      staffProfilePerformanceProvider((
        staffId: widget.staffId,
        startDate: range.startDate,
        endDate: range.endDate,
      )),
    );

    return perfAsync.when(
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
              Text(
                'Failed to load performance metrics: $err',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: Colors.red),
              ),
              SizedBox(height: 12.h),
              ElevatedButton(
                onPressed: () => ref.invalidate(
                  staffProfilePerformanceProvider((
                    staffId: widget.staffId,
                    startDate: range.startDate,
                    endDate: range.endDate,
                  )),
                ),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (perf) {
        final totalAppts = int.tryParse(perf['total_appointments']?.toString() ?? '0') ?? 0;
        final completedAppts = int.tryParse(perf['completed_appointments']?.toString() ?? '0') ?? 0;
        final cancelledAppts = int.tryParse(perf['cancelled_appointments']?.toString() ?? '0') ?? 0;
        final noshowAppts = int.tryParse(perf['noshow_appointments']?.toString() ?? '0') ?? 0;
        final revenue = double.tryParse(perf['total_revenue']?.toString() ?? '0') ?? 0.0;
        final totalComm = double.tryParse(perf['total_commission']?.toString() ?? '0') ?? 0.0;
        final pendingComm = double.tryParse(perf['pending_commission']?.toString() ?? '0') ?? 0.0;
        final presentDays = int.tryParse(perf['present_days']?.toString() ?? '0') ?? 0;
        final avgRating = perf['avg_rating']?.toString() ?? '5.0';
        final totalReviews = int.tryParse(perf['total_reviews']?.toString() ?? '0') ?? 0;

        final completionRate = totalAppts > 0 ? ((completedAppts / totalAppts) * 100).toInt() : 100;

        return SingleChildScrollView(
          padding: EdgeInsets.all(20.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header & Range Filter
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Performance Analytics',
                        style: GoogleFonts.poppins(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      Text(
                        'Real metrics & revenue tracking',
                        style: GoogleFonts.inter(
                          fontSize: 12.sp,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10.r),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedFilter,
                        icon: Icon(
                          Icons.keyboard_arrow_down_rounded,
                          size: 18.sp,
                          color: const Color(0xFFE91E63),
                        ),
                        isDense: true,
                        style: GoogleFonts.inter(
                          fontSize: 12.5.sp,
                          color: const Color(0xFF1E293B),
                          fontWeight: FontWeight.w600,
                        ),
                        items: ['Today', 'This Week', 'This Month', 'This Year']
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedFilter = val);
                        },
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 20.h),

              // Horizontal Scrollable Stat Cards
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                child: Row(
                  children: [
                    _buildStatItem(
                      'Completed Visits',
                      '$completedAppts / $totalAppts',
                      Icons.event_available_rounded,
                      const Color(0xFF3B82F6),
                      const Color(0xFFEFF6FF),
                    ),
                    _buildStatItem(
                      'Revenue Gen.',
                      '₹${revenue.toStringAsFixed(0)}',
                      Icons.payments_rounded,
                      const Color(0xFF10B981),
                      const Color(0xFFECFDF5),
                    ),
                    _buildStatItem(
                      'Commission Earned',
                      '₹${totalComm.toStringAsFixed(0)}',
                      Icons.account_balance_wallet_rounded,
                      const Color(0xFFE91E63),
                      const Color(0xFFFDF2F8),
                    ),
                    _buildStatItem(
                      'Avg Rating',
                      '$avgRating ★',
                      Icons.star_rounded,
                      const Color(0xFFF59E0B),
                      const Color(0xFFFFFBEB),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24.h),

              // Appointment Breakdown Card
              Container(
                padding: EdgeInsets.all(18.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18.r),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Appointment Breakdown',
                          style: GoogleFonts.poppins(
                            fontSize: 15.sp,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(20.r),
                          ),
                          child: Text(
                            '$completionRate% Success',
                            style: GoogleFonts.inter(
                              fontSize: 11.5.sp,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF10B981),
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 16.h),
                    _buildBreakdownRow('Total Booked', '$totalAppts', const Color(0xFF64748B)),
                    _buildBreakdownRow('Completed', '$completedAppts', const Color(0xFF10B981)),
                    _buildBreakdownRow('Cancelled', '$cancelledAppts', const Color(0xFFEF4444)),
                    _buildBreakdownRow('No Show', '$noshowAppts', const Color(0xFFF59E0B)),
                    _buildBreakdownRow('Present in Salon', '$presentDays Days', const Color(0xFF6366F1)),
                    if (pendingComm > 0)
                      _buildBreakdownRow('Pending Commission', '₹${pendingComm.toStringAsFixed(0)}', const Color(0xFFE91E63)),
                  ],
                ),
              ),
              SizedBox(height: 20.h),

              // Reviews & Rating Summary Card
              Container(
                padding: EdgeInsets.all(18.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18.r),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: EdgeInsets.all(14.w),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(16.r),
                      ),
                      child: Column(
                        children: [
                          Text(
                            avgRating,
                            style: GoogleFonts.poppins(
                              fontSize: 24.sp,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFD97706),
                            ),
                          ),
                          Row(
                            children: List.generate(
                              5,
                              (i) => Icon(
                                Icons.star_rounded,
                                size: 14.sp,
                                color: const Color(0xFFF59E0B),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 16.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Client Satisfaction',
                            style: GoogleFonts.poppins(
                              fontSize: 15.sp,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                          SizedBox(height: 4.h),
                          Text(
                            totalReviews > 0
                                ? 'Based on $totalReviews verified customer feedback entries.'
                                : 'High quality service delivery recorded by clients.',
                            style: GoogleFonts.inter(
                              fontSize: 12.sp,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatItem(
    String label,
    String value,
    IconData icon,
    Color color,
    Color bg,
  ) {
    return Padding(
      padding: EdgeInsets.only(right: 12.w),
      child: SizedBox(
        width: 155.w,
        child: PremiumStatCard(
          title: label,
          value: value,
          icon: icon,
          mainColor: color,
          bgColor: bg,
        ),
      ),
    );
  }

  Widget _buildBreakdownRow(String label, String value, Color color) {
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 8.w,
                height: 8.w,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              SizedBox(width: 8.w),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 13.sp,
                  color: const Color(0xFF475569),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 13.sp,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1E293B),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/report_provider.dart';
import 'package:flutter_salon/core/widgets/premium_stat_card.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  int _selectedTab = 0;
  final List<String> _tabs = [
    'Revenue',
    'Services',
    'Staff',
    'Customers',
    'Expenses',
    'GST',
  ];

  @override
  Widget build(BuildContext context) {
    final dateRange = ref.watch(reportDateRangeProvider);

    // Format date string for display
    String formattedDateRange = 'Select Date';
    try {
      final start = DateTime.parse(dateRange.start);
      final end = DateTime.parse(dateRange.end);
      formattedDateRange =
          '${DateFormat('d MMM yyyy').format(start)} – ${DateFormat('d MMM yyyy').format(end)}';
    } catch (_) {}

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Reports',
          style: GoogleFonts.playfairDisplay(
            fontSize: 28.sp,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: Icon(Icons.more_vert_rounded, color: AppColors.textPrimary),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: AppColors.background,
            padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 12.h),
            child: Column(
              children: [
                // Date Picker
                GestureDetector(
                  onTap: () async {
                    // Date picker logic here (can be added later)
                  },
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 20.w,
                      vertical: 16.h,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20.r),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          formattedDateRange,
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Icon(
                          Icons.calendar_month_rounded,
                          color: AppColors.primary,
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 20.h),

                // Segmented Tabs
                Container(
                  height: 52.h,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16.r),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _tabs.length,
                    padding: EdgeInsets.all(4.w),
                    itemBuilder: (context, index) {
                      final isSelected = _selectedTab == index;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedTab = index),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: EdgeInsets.symmetric(horizontal: 24.w),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.primary
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                          child: Text(
                            _tabs[index],
                            style: GoogleFonts.inter(
                              color: isSelected
                                  ? Colors.white
                                  : AppColors.textSecondary,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.w600,
                              fontSize: 14.sp,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(child: _buildReportContent(context, ref)),
        ],
      ),
    );
  }

  Widget _buildReportContent(BuildContext context, WidgetRef ref) {
    switch (_selectedTab) {
      case 0:
        return _buildRevenueReport(context, ref);
      case 1:
        return _buildServiceReport(context, ref);
      case 2:
        return _buildStaffReport(context, ref);
      case 3:
        return _buildCustomerReport(context, ref);
      case 4:
        return _buildExpenseReport(context, ref);
      case 5:
        return _buildGstReport(context, ref);
      default:
        return Center(child: Text('Unknown Tab'));
    }
  }

  Widget _buildRevenueReport(BuildContext context, WidgetRef ref) {
    final salesReportAsync = ref.watch(salesReportProvider);
    final serviceReportAsync = ref.watch(serviceReportProvider);

    return salesReportAsync.when(
      loading: () => const SkeletonList(),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
      ),
      data: (data) {
        final summary = data['summary'] as Map<String, dynamic>? ?? {};
        final dailyData = data['daily'] as List<dynamic>? ?? [];

        final totalRevenue =
            double.tryParse(summary['net_revenue']?.toString() ?? '0') ?? 0;

        // Prepare BarChart data
        List<BarChartGroupData> barGroups = [];
        double maxY = 0;

        for (int i = 0; i < dailyData.length; i++) {
          final day = dailyData[i];
          final val = double.tryParse(day['revenue']?.toString() ?? '0') ?? 0;
          if (val > maxY) maxY = val;
          barGroups.add(
            BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: val,
                  color: AppColors.primary,
                  width: 14.w,
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(6.r),
                  ),
                ),
              ],
            ),
          );
        }

        if (maxY == 0) maxY = 100;
        maxY = maxY * 1.2;

        return ListView(
          padding: EdgeInsets.all(20.w),
          children: [
            // Revenue Chart Card
            Container(
              padding: EdgeInsets.all(24.w),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24.r),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: EdgeInsets.all(12.w),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2ECC71).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(16.r),
                        ),
                        child: Icon(
                          Icons.receipt_long_rounded,
                          color: Color(0xFF2ECC71),
                          size: 28.sp,
                        ),
                      ),
                      SizedBox(width: 16.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Total Revenue',
                              style: GoogleFonts.inter(
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w600,
                                fontSize: 13.sp,
                              ),
                            ),
                            SizedBox(height: 4.h),
                            Text(
                              NumberFormat.currency(
                                symbol: '₹',
                                decimalDigits: 0,
                                locale: 'en_IN',
                              ).format(totalRevenue),
                              style: GoogleFonts.poppins(
                                fontSize: 28.sp,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 32.h),
                  SizedBox(
                    height: 200.h,
                    child: barGroups.isEmpty
                        ? Center(
                            child: Text(
                              'No daily data available',
                              style: GoogleFonts.inter(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          )
                        : BarChart(
                            BarChartData(
                              alignment: BarChartAlignment.spaceAround,
                              maxY: maxY,
                              barTouchData: BarTouchData(enabled: false),
                              titlesData: FlTitlesData(
                                show: true,
                                bottomTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    getTitlesWidget: (value, meta) {
                                      if (value.toInt() >= 0 &&
                                          value.toInt() < dailyData.length) {
                                        final dateStr =
                                            dailyData[value.toInt()]['date']
                                                ?.toString();
                                        if (dateStr != null) {
                                          try {
                                            final dt = DateTime.parse(dateStr);
                                            if (value.toInt() % 7 == 0 ||
                                                value.toInt() ==
                                                    dailyData.length - 1) {
                                              return Padding(
                                                padding: EdgeInsets.only(
                                                  top: 8.h,
                                                ),
                                                child: Text(
                                                  DateFormat(
                                                    'd MMM',
                                                  ).format(dt),
                                                  style: GoogleFonts.inter(
                                                    color:
                                                        AppColors.textSecondary,
                                                    fontSize: 10.sp,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              );
                                            }
                                          } catch (_) {}
                                        }
                                      }
                                      return SizedBox.shrink();
                                    },
                                    reservedSize: 28,
                                  ),
                                ),
                                leftTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    reservedSize: 44,
                                    getTitlesWidget: (value, meta) {
                                      if (value == maxY)
                                        return SizedBox.shrink();
                                      return Text(
                                        '${(value / 1000).toStringAsFixed(0)}K',
                                        style: GoogleFonts.inter(
                                          color: AppColors.textSecondary,
                                          fontSize: 10.sp,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      );
                                    },
                                  ),
                                ),
                                topTitles: const AxisTitles(
                                  sideTitles: SideTitles(showTitles: false),
                                ),
                                rightTitles: const AxisTitles(
                                  sideTitles: SideTitles(showTitles: false),
                                ),
                              ),
                              gridData: FlGridData(
                                show: true,
                                drawVerticalLine: false,
                                horizontalInterval: maxY / 4,
                                getDrawingHorizontalLine: (value) => FlLine(
                                  color: AppColors.border.withOpacity(0.5),
                                  strokeWidth: 1,
                                  dashArray: [5, 5],
                                ),
                              ),
                              borderData: FlBorderData(show: false),
                              barGroups: barGroups,
                            ),
                          ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 20.h),

            // Revenue by Category Card
            Container(
              padding: EdgeInsets.all(24.w),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24.r),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Revenue by Category',
                    style: GoogleFonts.poppins(
                      fontSize: 18.sp,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 24.h),
                  serviceReportAsync.when(
                    loading: () => SizedBox(
                      height: 160.h,
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (err, stack) => SizedBox(
                      height: 160.h,
                      child: Center(
                        child: Text(
                          'Error loading categories',
                          style: GoogleFonts.inter(color: AppColors.error),
                        ),
                      ),
                    ),
                    data: (catData) {
                      final List<dynamic> items = catData is List
                          ? catData
                          : (catData['data'] as List<dynamic>? ?? []);

                      double servicesRev = 0, productsRev = 0, packagesRev = 0;

                      for (var item in items) {
                        final type = item['item_type']
                            ?.toString()
                            .toLowerCase();
                        final rev =
                            double.tryParse(
                              item['revenue']?.toString() ?? '0',
                            ) ??
                            0;
                        if (type == 'service') {
                          servicesRev += rev;
                        } else if (type == 'product') {
                          productsRev += rev;
                        } else if (type == 'package') {
                          packagesRev += rev;
                        } else {
                          servicesRev += rev;
                        }
                      }

                      final totalCat = servicesRev + productsRev + packagesRev;
                      if (totalCat == 0)
                        return SizedBox(
                          height: 160.h,
                          child: Center(
                            child: Text(
                              'No category data',
                              style: GoogleFonts.inter(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                        );

                      final svcPct = (servicesRev / totalCat) * 100;
                      final prdPct = (productsRev / totalCat) * 100;
                      final pkgPct = (packagesRev / totalCat) * 100;

                      return Row(
                        children: [
                          Expanded(
                            flex: 1,
                            child: SizedBox(
                              height: 140.h,
                              child: PieChart(
                                PieChartData(
                                  sectionsSpace: 4,
                                  centerSpaceRadius: 40,
                                  sections: [
                                    if (svcPct > 0)
                                      PieChartSectionData(
                                        color: AppColors.primary,
                                        value: svcPct,
                                        title: '',
                                        radius: 20,
                                      ),
                                    if (prdPct > 0)
                                      PieChartSectionData(
                                        color: AppColors.primaryLight,
                                        value: prdPct,
                                        title: '',
                                        radius: 20,
                                      ),
                                    if (pkgPct > 0)
                                      PieChartSectionData(
                                        color: const Color(0xFFFFB020),
                                        value: pkgPct,
                                        title: '',
                                        radius: 20,
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 1,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLegendItem(
                                  'Services',
                                  svcPct,
                                  AppColors.primary,
                                ),
                                SizedBox(height: 16.h),
                                _buildLegendItem(
                                  'Products',
                                  prdPct,
                                  AppColors.primaryLight,
                                ),
                                SizedBox(height: 16.h),
                                _buildLegendItem(
                                  'Packages',
                                  pkgPct,
                                  const Color(0xFFFFB020),
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            SizedBox(height: 100.h),
          ],
        );
      },
    );
  }

  Widget _buildLegendItem(String label, double percent, Color color) {
    if (percent <= 0) return SizedBox.shrink();
    return Row(
      children: [
        Container(
          width: 12.w,
          height: 12.h,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        SizedBox(width: 12.w),
        Expanded(
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w500,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        Text(
          '${percent.toStringAsFixed(0)}%',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildServiceReport(BuildContext context, WidgetRef ref) {
    final reportAsync = ref.watch(serviceReportProvider);
    return reportAsync.when(
      loading: () => const SkeletonList(),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
      ),
      data: (data) {
        final List<dynamic> items = data is List ? data : (data['data'] ?? []);
        if (items.isEmpty)
          return Center(
            child: Text(
              'No data found',
              style: GoogleFonts.inter(color: AppColors.textSecondary),
            ),
          );
        return ListView.builder(
          padding: EdgeInsets.symmetric(
            horizontal: 20.w,
            vertical: 12.h,
          ).copyWith(bottom: 100),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final item = items[index];
            return Container(
              margin: EdgeInsets.only(bottom: 12.h),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16.r),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ListTile(
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 20.w,
                  vertical: 12.h,
                ),
                title: Text(
                  '${item['item_name']}',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    fontSize: 16.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
                subtitle: Padding(
                  padding: EdgeInsets.only(top: 4.h),
                  child: Text(
                    'Type: ${item['item_type']}  •  Sold: ${item['quantity_sold']}',
                    style: GoogleFonts.inter(
                      color: AppColors.textSecondary,
                      fontSize: 13.sp,
                    ),
                  ),
                ),
                trailing: Text(
                  '₹${item['revenue']}',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    fontSize: 18.sp,
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildStaffReport(BuildContext context, WidgetRef ref) {
    final reportAsync = ref.watch(staffReportProvider);
    return reportAsync.when(
      loading: () => const SkeletonList(),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
      ),
      data: (data) {
        final List<dynamic> items = data is List ? data : (data['data'] ?? []);
        if (items.isEmpty)
          return Center(
            child: Text(
              'No data found',
              style: GoogleFonts.inter(color: AppColors.textSecondary),
            ),
          );
        return ListView.builder(
          padding: EdgeInsets.symmetric(
            horizontal: 20.w,
            vertical: 12.h,
          ).copyWith(bottom: 100),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final item = items[index];
            return Container(
              margin: EdgeInsets.only(bottom: 12.h),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16.r),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ListTile(
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 20.w,
                  vertical: 12.h,
                ),
                leading: Container(
                  padding: EdgeInsets.all(12.w),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.person_rounded, color: AppColors.primary),
                ),
                title: Text(
                  '${item['first_name']} ${item['last_name'] ?? ''}'.trim(),
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    fontSize: 16.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
                subtitle: Padding(
                  padding: EdgeInsets.only(top: 4.h),
                  child: Text(
                    'Invoices: ${item['invoices_handled']}',
                    style: GoogleFonts.inter(
                      color: AppColors.textSecondary,
                      fontSize: 13.sp,
                    ),
                  ),
                ),
                trailing: Text(
                  '₹${item['revenue_generated']}',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    fontSize: 18.sp,
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildCustomerReport(BuildContext context, WidgetRef ref) {
    final reportAsync = ref.watch(customerReportProvider);
    return reportAsync.when(
      loading: () => const SkeletonList(),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
      ),
      data: (data) {
        final topCustomers = data['top_customers'] as List<dynamic>? ?? [];
        return ListView.builder(
          padding: EdgeInsets.symmetric(
            horizontal: 20.w,
            vertical: 12.h,
          ).copyWith(bottom: 100),
          itemCount: topCustomers.length,
          itemBuilder: (context, index) {
            final item = topCustomers[index];
            return Container(
              margin: EdgeInsets.only(bottom: 12.h),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16.r),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ListTile(
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 20.w,
                  vertical: 12.h,
                ),
                title: Text(
                  '${item['first_name']} ${item['last_name'] ?? ''}'.trim(),
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    fontSize: 16.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
                subtitle: Padding(
                  padding: EdgeInsets.only(top: 4.h),
                  child: Text(
                    'Visits: ${item['visit_count']}',
                    style: GoogleFonts.inter(
                      color: AppColors.textSecondary,
                      fontSize: 13.sp,
                    ),
                  ),
                ),
                trailing: Text(
                  '₹${item['total_spent']}',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    fontSize: 18.sp,
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildExpenseReport(BuildContext context, WidgetRef ref) {
    final reportAsync = ref.watch(expenseReportProvider);
    return reportAsync.when(
      loading: () => const SkeletonList(),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
      ),
      data: (data) {
        final summary = data['summary'] ?? {};
        final byCategory = data['by_category'] as List<dynamic>? ?? [];
        return ListView(
          padding: EdgeInsets.all(20.w).copyWith(bottom: 100),
          children: [
            Container(
              padding: EdgeInsets.all(24.w),
              decoration: BoxDecoration(
                color: const Color(0xFFE74C3C),
                borderRadius: BorderRadius.circular(24.r),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFE74C3C).withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    'Total Expenses',
                    style: GoogleFonts.inter(
                      color: Colors.white.withOpacity(0.9),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    '₹ ${summary['total'] ?? 0}',
                    style: GoogleFonts.poppins(
                      fontSize: 32.sp,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 32.h),
            Text(
              'By Category',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.bold,
                fontSize: 18.sp,
                color: AppColors.textPrimary,
              ),
            ),
            SizedBox(height: 16.h),
            ...byCategory.map(
              (cat) => Container(
                margin: EdgeInsets.only(bottom: 12.h),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16.r),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ListTile(
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 20.w,
                    vertical: 12.h,
                  ),
                  title: Text(
                    cat['category'] ?? 'Uncategorized',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  trailing: Text(
                    '₹${cat['total']}',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 16.sp,
                      color: const Color(0xFFE74C3C),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildGstReport(BuildContext context, WidgetRef ref) {
    final reportAsync = ref.watch(gstReportProvider);
    return reportAsync.when(
      loading: () => const SkeletonList(),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
      ),
      data: (data) {
        final outputTax = data['output_tax'] ?? {};
        final inputTax = data['input_tax'] ?? {};
        final netLiability = data['net_tax_liability'] ?? 0;
        return ListView(
          padding: EdgeInsets.all(20.w).copyWith(bottom: 100),
          children: [
            _buildStatCard(
              'Net Tax Liability',
              '₹ $netLiability',
              Icons.account_balance_rounded,
              const Color(0xFF4A90E2),
            ),
            SizedBox(height: 16.h),
            _buildStatCard(
              'Output Tax (Collected)',
              '₹ ${outputTax['total_tax'] ?? 0}',
              Icons.arrow_upward_rounded,
              const Color(0xFFE74C3C),
            ),
            SizedBox(height: 16.h),
            _buildStatCard(
              'Input Tax (Paid)',
              '₹ ${inputTax['input_tax'] ?? 0}',
              Icons.arrow_downward_rounded,
              const Color(0xFF2ECC71),
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color iconColor,
  ) {
    return PremiumStatCard(
      title: title,
      value: value,
      icon: icon,
      mainColor: iconColor,
      bgColor: iconColor.withOpacity(0.1),
    );
  }
}

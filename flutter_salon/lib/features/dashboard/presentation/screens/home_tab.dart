import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/dashboard_provider.dart';
import '../../../services/data/service_provider.dart';
import '../../../customers/data/customer_provider.dart';
import '../../../appointments/data/appointment_repository.dart';
import '../../../appointments/presentation/providers/appointment_provider.dart';
import '../../../../core/widgets/skeletons/skeleton_card.dart';
import 'package:flutter_salon/core/widgets/premium_stat_card.dart';
import 'package:flutter_salon/core/network/dio_client.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class HomeTab extends ConsumerWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isManager = ref.watch(isManagerProvider);
    final userProfile = ref.watch(userProfileProvider).valueOrNull;
    final role = (userProfile?['role']?.toString() ?? ref.watch(userRoleProvider) ?? '').toLowerCase();
    final bool isUserAccountManager = role == 'manager' || isManager;
    final appointmentsAsync = ref.watch(todayAppointmentsProvider);
    final summaryAsync = ref.watch(dashboardSummaryProvider);
    final servicesAsync = ref.watch(topServicesProvider);
    final customersAsync = ref.watch(recentCustomersProvider);
    final dateState = ref.watch(dashboardDateRangeProvider);
    final String formattedDate;
    if (dateState.range != null) {
      if (dateState.label == 'Today') {
        formattedDate = DateFormat('E, d MMM yyyy').format(DateTime.now());
      } else {
        formattedDate =
            '${DateFormat('MMM d').format(dateState.range!.start)} - ${DateFormat('MMM d').format(dateState.range!.end)}';
      }
    } else {
      formattedDate = dateState.label == 'Today'
          ? DateFormat('E, d MMM yyyy').format(DateTime.now())
          : dateState.label;
    }

    return SafeArea(
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Banner
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  height: 240.h,
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    image: DecorationImage(
                      image: AssetImage(
                        'assets/images/dashboard_greeting_bg.jpg',
                      ),
                      fit: BoxFit.cover,
                      alignment: Alignment(
                        1.0,
                        0.8,
                      ), // x: 1.0 (right), y: 0.5 (halfway between center and bottom)
                    ),
                  ),
                ),
                // Gradient overlay
                Container(
                  height: 240.h,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFFFFF1F2).withOpacity(0.95),
                        const Color(0xFFFFF1F2).withOpacity(0.7),
                        const Color(0xFFFFF1F2).withOpacity(0.0),
                      ],
                      stops: const [0.0, 0.45, 1.0],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                  ),
                ),
                Positioned(
                  left: 20,
                  top: 40,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getGreeting(),
                        style: GoogleFonts.inter(
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2.5,
                          color: const Color(0xFF475569),
                        ),
                      ),
                      SizedBox(height: 2.h),
                      Row(
                        children: [
                          Text(
                            isUserAccountManager ? 'Manager!' : 'Admin!',
                            style: GoogleFonts.poppins(
                              fontSize: 36.sp,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          SizedBox(width: 8.w),
                          Text('👋', style: TextStyle(fontSize: 28.sp)),
                        ],
                      ),
                      SizedBox(height: 12.h),
                      Text(
                        'Your salon. Your clients. Your growth.',
                        style: GoogleFonts.inter(
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF475569),
                        ),
                      ),
                      SizedBox(height: 2.h),
                      Text(
                        'All in one place.',
                        style: GoogleFonts.inter(
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // Selectors
            Transform.translate(
              offset: const Offset(0, -24),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.w),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _showBranchSelector(context),
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 16.w,
                            vertical: 14.h,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16.r),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.location_on_outlined,
                                color: Color(0xFF0F172A),
                                size: 20.sp,
                              ),
                              SizedBox(width: 10.w),
                              Expanded(
                                child: Text(
                                  'Primary Branch',
                                  style: GoogleFonts.inter(
                                    fontSize: 13.5.sp,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF0F172A),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Icon(
                                Icons.keyboard_arrow_down_rounded,
                                color: Color(0xFF0F172A),
                                size: 20.sp,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _showDateSelector(context, ref),
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 16.w,
                            vertical: 14.h,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16.r),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.calendar_month_outlined,
                                color: Color(0xFF0F172A),
                                size: 20.sp,
                              ),
                              SizedBox(width: 10.w),
                              Expanded(
                                child: Text(
                                  formattedDate,
                                  style: GoogleFonts.inter(
                                    fontSize: 13.5.sp,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF0F172A),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Icon(
                                Icons.keyboard_arrow_down_rounded,
                                color: Color(0xFF0F172A),
                                size: 20.sp,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Stats Row
            summaryAsync.when(
              loading: () => Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.w),
                child: SkeletonCard(
                  horizontal: true,
                  count: 4,
                  width: 140.w,
                  height: 160.h,
                ),
              ),
              error: (err, stack) => Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.w),
                child: Text('Error: $err'),
              ),
              data: (summary) {
                final todayRev = summary['today']?['revenue'] ?? 0;
                final appts = summary['today']?['appointments']?['total'] ?? 0;
                final totalCust = summary['customers']?['total'] ?? 0;
                final activeStaff = summary['staff']?['active'] ?? 0;

                final trends = summary['trends'] as Map<String, dynamic>? ?? {};

                String getTrendText(String key, String suffix) {
                  final t = trends[key];
                  if (t == null) return '0% $suffix';
                  return '${t['value'] ?? 0}% $suffix';
                }

                bool getTrendIsUp(String key) {
                  final t = trends[key];
                  if (t == null) return true;
                  return t['is_up'] == true;
                }

                return SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: 20.w),
                  clipBehavior: Clip.none,
                  child: Row(
                    children: [
                      _buildStatCard(
                        dateState.label == 'Today'
                            ? 'Today\'s\nAppointments'
                            : 'Period\nAppointments',
                        '$appts',
                        Icons.event_note_rounded,
                        const Color(0xFFE91E63),
                        const Color(0xFFFFF0F5),
                        getTrendText('today_appointments', 'vs previous'),
                        getTrendIsUp('today_appointments'),
                        onTap: () => context.go('/appointments'),
                      ),
                      SizedBox(width: 12.w),
                      _buildStatCard(
                        'Total\nCustomers',
                        '$totalCust',
                        Icons.people_alt_rounded,
                        const Color(0xFF3B82F6),
                        const Color(0xFFEFF6FF),
                        getTrendText('monthly_customers', 'vs previous'),
                        getTrendIsUp('monthly_customers'),
                        onTap: () => context.go('/customers'),
                      ),
                      if (!isUserAccountManager) ...[
                        SizedBox(width: 12.w),
                        _buildStatCard(
                          dateState.label == 'Today'
                              ? 'Today\'s\nRevenue'
                              : 'Period\nRevenue',
                          '₹ ${NumberFormat('#,##,###').format(todayRev)}',
                          Icons.currency_rupee_rounded,
                          const Color(0xFF10B981),
                          const Color(0xFFECFDF5),
                          getTrendText('today_revenue', 'vs previous'),
                          getTrendIsUp('today_revenue'),
                          onTap: () => context.push('/wallet'),
                        ),
                      ],
                      SizedBox(width: 12.w),
                      _buildStatCard(
                        'Active\nStaff',
                        '$activeStaff',
                        Icons.badge_rounded,
                        const Color(0xFF8B5CF6),
                        const Color(0xFFF5F3FF),
                        '0% this month',
                        true,
                        onTap: () => context.push('/staff'),
                      ),
                    ],
                  ),
                );
              },
            ),

            // Quick Actions
            Padding(
              padding: EdgeInsets.all(20.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Quick Actions',
                        style: GoogleFonts.poppins(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1A1A2E),
                        ),
                      ),
                      Row(
                        children: [
                          Text(
                            'View All',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w600,
                              fontSize: 13.sp,
                              color: const Color(0xFFE91E63),
                            ),
                          ),
                          Icon(
                            Icons.keyboard_arrow_right_rounded,
                            color: Color(0xFFE91E63),
                            size: 16.sp,
                          ),
                        ],
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildQuickAction(
                          Icons.calendar_month_outlined,
                          'New\nAppointment',
                          () => context.push('/book-appointment'),
                        ),
                        SizedBox(width: 16.w),
                        _buildQuickAction(
                          Icons.person_add_alt_1_outlined,
                          'Add\nCustomer',
                          () => context.push('/customers/add'),
                        ),
                        SizedBox(width: 16.w),
                        _buildQuickAction(
                          Icons.content_cut_rounded,
                          'Add\nService',
                          () => context.push('/services/add'),
                        ),
                        SizedBox(width: 16.w),
                        _buildQuickAction(
                          Icons.card_giftcard_rounded,
                          'Add\nPackage',
                          () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Coming Soon'),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          },
                        ),
                        if (!isUserAccountManager) ...[
                          SizedBox(width: 16.w),
                          _buildQuickAction(
                            Icons.point_of_sale_rounded,
                            'POS &\nBilling',
                            () => context.push('/pos'),
                          ),
                        ],
                        SizedBox(width: 16.w), // Padding at end
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Today's Appointments
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Today\'s Appointments',
                        style: GoogleFonts.poppins(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1A1A2E),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => context.push('/appointments'),
                        child: Row(
                          children: [
                            Text(
                              'View All',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.w600,
                                fontSize: 13.sp,
                                color: const Color(0xFFE91E63),
                              ),
                            ),
                            Icon(
                              Icons.keyboard_arrow_right_rounded,
                              color: Color(0xFFE91E63),
                              size: 16.sp,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  appointmentsAsync.when(
                    loading: () => SkeletonCard(
                      horizontal: false,
                      count: 3,
                      height: 70.h,
                      width: double.infinity,
                    ),
                    error: (err, stack) => Text('Error: $err'),
                    data: (appointments) {
                      if (appointments.isEmpty) {
                        return Padding(
                          padding: EdgeInsets.symmetric(vertical: 20.h),
                          child: Center(
                            child: Text(
                              'No appointments for today.',
                              style: GoogleFonts.inter(
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        );
                      }

                      final List<Map<String, dynamic>> appts =
                          List<Map<String, dynamic>>.from(appointments);

                      return Column(
                        children: appts.take(4).map((appt) {
                          String timeStr = appt['start_time'] ?? '';
                          String displayTime = timeStr;
                          if (timeStr.isNotEmpty) {
                            try {
                              final parts = timeStr.split(':');
                              final hour = int.parse(parts[0]);
                              final minute = int.parse(parts[1]);
                              final dt = DateTime(2000, 1, 1, hour, minute);
                              displayTime = DateFormat('hh:mm a').format(dt);
                            } catch (_) {}
                          }

                          return _buildAppointmentTile(
                            context,
                            ref,
                            appt,
                            displayTime,
                          );
                        }).toList(),
                      );
                    },
                  ),
                ],
              ),
            ),

            // Mid Banner
            Padding(
              padding: EdgeInsets.all(20.w),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16.r),
                child: Container(
                  height:
                      160.h, // Increased height to prevent vertical overflow
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    image: DecorationImage(
                      image: AssetImage(
                        'assets/images/dashboard_mid_banner.jpg',
                      ),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              const Color(0xFFFFF0F5).withOpacity(0.9),
                              const Color(0xFFFFF0F5).withOpacity(0.7),
                              Colors.transparent,
                            ],
                            stops: const [0.0, 0.4, 1.0],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                        ),
                      ),
                      Positioned(
                        left: 20,
                        top: 0,
                        bottom: 0,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'TRANSFORM EVERY LOOK',
                              style: GoogleFonts.inter(
                                fontSize: 10.sp,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.5,
                                color: const Color(0xFF1A1A2E),
                              ),
                            ),
                            Text(
                              'Into Confidence',
                              style: GoogleFonts.poppins(
                                fontSize: 22.sp,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFFE91E63),
                              ),
                            ),
                            SizedBox(height: 12.h),
                            ElevatedButton(
                              onPressed: () => context.push('/services'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE91E63),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                padding: EdgeInsets.symmetric(
                                  horizontal: 16.w,
                                  vertical: 0.h,
                                ),
                                minimumSize: const Size(120, 32),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8.r),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'Manage Services',
                                    style: GoogleFonts.inter(
                                      fontSize: 11.sp,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  SizedBox(width: 4.w),
                                  Icon(
                                    Icons.arrow_forward_rounded,
                                    size: 14.sp,
                                  ),
                                ],
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

            // Bottom Two Columns (Responsive)
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.w),
              child: Builder(
                builder: (context) {
                  final isSmallScreen = MediaQuery.of(context).size.width < 800;

                  Widget topServices = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              'Top Services',
                              style: GoogleFonts.poppins(
                                fontSize: 16.sp,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1A1A2E),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => context.push('/services'),
                            child: Row(
                              children: [
                                Text(
                                  'View All',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11.sp,
                                    color: const Color(0xFFE91E63),
                                  ),
                                ),
                                Icon(
                                  Icons.arrow_forward_rounded,
                                  color: Color(0xFFE91E63),
                                  size: 12.sp,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 16.h),
                      servicesAsync.when(
                        loading: () => Padding(
                          padding: EdgeInsets.symmetric(vertical: 20.h),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: Color(0xFFE91E63),
                            ),
                          ),
                        ),
                        error: (err, stack) => Text(
                          'Error: $err',
                          style: GoogleFonts.inter(color: Colors.red),
                        ),
                        data: (services) {
                          if (services.isEmpty) {
                            return Padding(
                              padding: EdgeInsets.symmetric(vertical: 20.h),
                              child: Center(
                                child: Text(
                                  'No top services available.',
                                  style: GoogleFonts.inter(
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ),
                            );
                          }

                          return Column(
                            children: services.take(5).map((service) {
                              final count =
                                  (service['bookings'] ?? service['count'] ?? 0)
                                      as int;
                              final fraction = (count / 300).clamp(
                                0.1,
                                1.0,
                              ); // Rough mock calc
                              final imageUrl = service['image_url']?.toString();
                              return _buildTopService(
                                context,
                                service,
                                count,
                                fraction,
                                imageUrl,
                              );
                            }).toList(),
                          );
                        },
                      ),
                    ],
                  );

                  Widget recentCustomers = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              'Recent Customers',
                              style: GoogleFonts.poppins(
                                fontSize: 16.sp,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1A1A2E),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => context.push('/customers'),
                            child: Row(
                              children: [
                                Text(
                                  'View All',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11.sp,
                                    color: const Color(0xFFE91E63),
                                  ),
                                ),
                                Icon(
                                  Icons.arrow_forward_rounded,
                                  color: Color(0xFFE91E63),
                                  size: 12.sp,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 16.h),
                      customersAsync.when(
                        loading: () => Padding(
                          padding: EdgeInsets.symmetric(vertical: 20.h),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: Color(0xFFE91E63),
                            ),
                          ),
                        ),
                        error: (err, stack) => Text(
                          'Error: $err',
                          style: GoogleFonts.inter(color: Colors.red),
                        ),
                        data: (customers) {
                          if (customers.isEmpty) {
                            return Padding(
                              padding: EdgeInsets.symmetric(vertical: 20.h),
                              child: Center(
                                child: Text(
                                  'No recent customers.',
                                  style: GoogleFonts.inter(
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ),
                            );
                          }

                          return Column(
                            children: customers.take(4).map((customer) {
                              final firstName =
                                  customer['first_name']?.toString() ?? '';
                              final lastName =
                                  customer['last_name']?.toString() ?? '';
                              final name = '$firstName $lastName'.trim().isEmpty
                                  ? 'Unknown'
                                  : '$firstName $lastName'.trim();
                              final phone =
                                  customer['phone']?.toString() ?? 'N/A';
                              final imageUrl = customer['profile_picture']
                                  ?.toString();
                              // Just assume recent logic based on created_at or default to true for visual consistency
                              return _buildRecentCustomer(
                                context,
                                customer,
                                imageUrl,
                              );
                            }).toList(),
                          );
                        },
                      ),
                    ],
                  );

                  if (isSmallScreen) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        topServices,
                        SizedBox(height: 32.h),
                        recentCustomers,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: topServices),
                      SizedBox(width: 20.w),
                      Expanded(child: recentCustomers),
                    ],
                  );
                },
              ),
            ),

            SizedBox(height: 32.h),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color mainColor,
    Color bgColor,
    String subtext,
    bool isUp, {
    VoidCallback? onTap,
  }) {
    return PremiumStatCard(
      title: title,
      value: value,
      icon: icon,
      mainColor: mainColor,
      bgColor: bgColor,
      subtext: subtext,
      isUp: isUp,
      onTap: onTap,
    );
  }

  Widget _buildQuickAction(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF0F5),
              borderRadius: BorderRadius.circular(16.r),
            ),
            child: Icon(icon, color: const Color(0xFFE91E63), size: 24.sp),
          ),
          SizedBox(height: 8.h),
          Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 11.sp,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF1A1A2E),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentTile(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> appt,
    String displayTime,
  ) {
    final customerName = appt['customer_name'] ?? 'Walk-in Client';
    final serviceName = appt['service_name'] ?? 'Custom Service';
    String timeStr =
        appt['appointment_time']?.toString() ?? appt['time']?.toString() ?? '';
    final statusStr = appt['status']?.toString().toLowerCase() ?? 'planned';

    Color statusColor = const Color(0xFFE91E63);
    Color statusBg = const Color(0xFFFFF0F5);
    String statusLabel = 'Planned';

    if (statusStr == 'completed') {
      statusColor = const Color(0xFF10B981);
      statusBg = const Color(0xFFECFDF5);
      statusLabel = 'Completed';
    } else if (statusStr == 'cancelled') {
      statusColor = const Color(0xFFEF4444);
      statusBg = const Color(0xFFFEF2F2);
      statusLabel = 'Cancelled';
    }

    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: [
          Container(
            width: 48.w,
            height: 48.h,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Center(
              child: Text(
                customerName.isNotEmpty ? customerName[0].toUpperCase() : '?',
                style: GoogleFonts.poppins(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFE91E63),
                ),
              ),
            ),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  customerName,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 14.sp,
                  ),
                ),
                SizedBox(height: 4.h),
                Text(
                  serviceName,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF64748B),
                    fontSize: 12.sp,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                timeStr,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 12.sp,
                ),
              ),
              SizedBox(height: 4.h),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Text(
                  statusLabel,
                  style: GoogleFonts.inter(
                    color: statusColor,
                    fontSize: 10.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTopService(
    BuildContext context,
    Map<String, dynamic> service,
    int count,
    double fraction,
    String? imageUrl,
  ) {
    final name = service['name']?.toString() ?? 'Service';
    return GestureDetector(
      onTap: () => context.push('/services'),
      child: Padding(
        padding: EdgeInsets.only(bottom: 16.h),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12.r),
              child: imageUrl != null && imageUrl.isNotEmpty
                  ? Builder(
                      builder: (context) {
                        final rawUrl = imageUrl.split(',').first.trim();
                        final baseUrl = kBaseMediaUrl;
                        final fullUrl = rawUrl.startsWith('/')
                            ? '$baseUrl$rawUrl'
                            : rawUrl;
                        return Image.network(
                          fullUrl,
                          width: 40.w,
                          height: 40.h,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Image.asset(
                            'assets/images/service_thumbnail.jpg',
                            width: 40.w,
                            height: 40.h,
                            fit: BoxFit.cover,
                          ),
                        );
                      },
                    )
                  : Image.asset(
                      'assets/images/service_thumbnail.jpg',
                      width: 40.w,
                      height: 40.h,
                      fit: BoxFit.cover,
                    ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.inter(
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1A1A2E),
                    ),
                  ),
                  SizedBox(height: 6.h),
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4.r),
                          child: LinearProgressIndicator(
                            value: fraction,
                            backgroundColor: const Color(0xFFF1F5F9),
                            color: const Color(0xFFE91E63),
                            minHeight: 6,
                          ),
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Text(
                        '$count',
                        style: GoogleFonts.inter(
                          fontSize: 12.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1A1A2E),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentCustomer(
    BuildContext context,
    Map<String, dynamic> customer,
    String? imageUrl,
  ) {
    final name =
        customer['name']?.toString() ??
        customer['first_name']?.toString() ??
        'Unknown';
    final phone = customer['phone']?.toString() ?? '';
    final id = customer['id'] as int;
    final isNew = customer['is_new'] == true;

    return GestureDetector(
      onTap: () => context.push('/customers/$id'),
      child: Padding(
        padding: EdgeInsets.only(bottom: 16.h),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12.r),
              child: imageUrl != null && imageUrl.isNotEmpty
                  ? Builder(
                      builder: (context) {
                        final rawUrl = imageUrl.split(',').first.trim();
                        final baseUrl = kBaseMediaUrl;
                        final fullUrl = rawUrl.startsWith('/')
                            ? '$baseUrl$rawUrl'
                            : rawUrl;
                        return Image.network(
                          fullUrl,
                          width: 40.w,
                          height: 40.h,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Image.asset(
                            'assets/images/customer_profile_avatar.jpg',
                            width: 40.w,
                            height: 40.h,
                            fit: BoxFit.cover,
                          ),
                        );
                      },
                    )
                  : Image.asset(
                      'assets/images/customer_profile_avatar.jpg',
                      width: 40.w,
                      height: 40.h,
                      fit: BoxFit.cover,
                    ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.inter(
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1A1A2E),
                    ),
                  ),
                  Text(
                    phone,
                    style: GoogleFonts.inter(
                      fontSize: 12.sp,
                      color: const Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
            if (isNew)
              Container(
                padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(6.r),
                ),
                child: Text(
                  'New',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF10B981),
                    fontSize: 11.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            SizedBox(width: 12.w),
            Icon(
              Icons.arrow_forward_ios_rounded,
              color: Color(0xFFCBD5E1),
              size: 14.sp,
            ),
          ],
        ),
      ),
    );
  }

  void _showBranchSelector(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Only Primary Branch is currently active.')),
    );
  }

  void _showDateSelector(BuildContext context, WidgetRef ref) {
    final currentLabel = ref.watch(dashboardDateRangeProvider).label;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 24.h, horizontal: 20.w),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Time Period',
                        style: GoogleFonts.poppins(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      IconButton(
                        icon: Icon(Icons.close),
                        onPressed: () => Navigator.pop(sheetContext),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  _buildDateOption(
                    context,
                    sheetContext,
                    ref,
                    'Today',
                    null,
                    currentLabel == 'Today',
                  ),
                  _buildDateOption(
                    context,
                    sheetContext,
                    ref,
                    'Yesterday',
                    null,
                    currentLabel == 'Yesterday',
                  ),
                  _buildDateOption(
                    context,
                    sheetContext,
                    ref,
                    'This Week',
                    null,
                    currentLabel == 'This Week',
                  ),
                  _buildDateOption(
                    context,
                    sheetContext,
                    ref,
                    'This Month',
                    null,
                    currentLabel == 'This Month',
                  ),
                  _buildDateOption(
                    context,
                    sheetContext,
                    ref,
                    'Custom Range',
                    null,
                    currentLabel == 'Custom Range',
                    icon: Icons.calendar_today_outlined,
                    isCustomDate: true,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildDateOption(
    BuildContext parentContext,
    BuildContext sheetContext,
    WidgetRef ref,
    String title,
    String? subtitle,
    bool isSelected, {
    IconData? icon,
    bool isCustomDate = false,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: icon != null
          ? Icon(icon, color: const Color(0xFF64748B), size: 20.sp)
          : null,
      title: Text(
        title,
        style: GoogleFonts.inter(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          color: const Color(0xFF0F172A),
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: GoogleFonts.inter(
                fontSize: 12.sp,
                color: const Color(0xFF64748B),
              ),
            )
          : null,
      trailing: isSelected
          ? Icon(Icons.check_circle, color: Color(0xFFE91E63))
          : null,
      onTap: () async {
        Navigator.pop(sheetContext);
        if (isCustomDate) {
          final range = await showDateRangePicker(
            context: parentContext,
            firstDate: DateTime(2020),
            lastDate: DateTime.now(),
            builder: (context, child) {
              return Theme(
                data: Theme.of(context).copyWith(
                  colorScheme: const ColorScheme.light(
                    primary: Color(0xFFE91E63),
                    onPrimary: Colors.white,
                    onSurface: Color(0xFF0F172A),
                  ),
                ),
                child: child!,
              );
            },
          );
          if (range != null && parentContext.mounted) {
            ref.read(dashboardDateRangeProvider.notifier).state =
                DashboardDateRangeState(range: range, label: 'Custom Range');
          }
        } else {
          DateTime? start;
          DateTime? end;
          final today = DateTime.now();
          if (title == 'Today') {
            start = today;
            end = today;
          } else if (title == 'Yesterday') {
            start = today.subtract(const Duration(days: 1));
            end = start;
          } else if (title == 'This Week') {
            final diff = today.weekday == 7 ? 6 : today.weekday - 1;
            start = today.subtract(Duration(days: diff));
            end = today;
          } else if (title == 'This Month') {
            start = DateTime(today.year, today.month, 1);
            end = today;
          }
          ref
              .read(dashboardDateRangeProvider.notifier)
              .state = DashboardDateRangeState(
            range: start != null && end != null
                ? DateTimeRange(start: start, end: end)
                : null,
            label: title,
          );
        }
      },
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'GOOD MORNING,';
    if (hour < 17) return 'GOOD AFTERNOON,';
    return 'GOOD EVENING,';
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../core/network/dio_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../../data/customer_provider.dart';

class CustomerProfileScreen extends ConsumerStatefulWidget {
  final int customerId;

  const CustomerProfileScreen({super.key, required this.customerId});

  @override
  ConsumerState<CustomerProfileScreen> createState() =>
      _CustomerProfileScreenState();
}

class _CustomerProfileScreenState extends ConsumerState<CustomerProfileScreen> {
  @override
  Widget build(BuildContext context) {
    final customerAsync = ref.watch(customerProfileProvider(widget.customerId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Customer Details',
          style: GoogleFonts.playfairDisplay(
            fontSize: 24.sp,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        actions: [
          IconButton(
            icon: Icon(Icons.edit_outlined, color: AppColors.primary),
            onPressed: () {
              // We'll just fetch the current data and pass it to edit screen if it's loaded
              final customerState = ref.read(
                customerProfileProvider(widget.customerId),
              );
              if (customerState.hasValue && customerState.value != null) {
                final c =
                    customerState.value!['customer'] ?? customerState.value!;
                context.push('/customers/edit', extra: c);
              }
            },
          ),
        ],
      ),
      body: customerAsync.when(
        loading: () => const SkeletonList(),
        error: (err, stack) =>
            Center(child: Text('Error: $err', style: GoogleFonts.inter())),
        data: (customerData) {
          final customer = customerData['customer'] ?? customerData;
          final stats = customerData['stats'] ?? {};

          final firstName = customer['first_name']?.toString() ?? 'Customer';
          final lastName = customer['last_name']?.toString() ?? '';
          final fullName = '$firstName $lastName'.trim();
          final phone = customer['phone']?.toString() ?? 'N/A';
          final email = customer['email']?.toString() ?? 'N/A';

          final totalVisits =
              stats['total_visits'] ?? customer['total_visits'] ?? 0;
          final totalSpent =
              stats['total_spent'] ?? customer['total_revenue'] ?? 0;
          final joinDate = customer['created_at'] != null
              ? DateFormat(
                  'dd MMM yyyy',
                ).format(DateTime.parse(customer['created_at'].toString()))
              : 'N/A';
          final isActive =
              customer['is_active'] == true || customer['is_active'] == 1;

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile Card
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: 20.w,
                    vertical: 16.h,
                  ),
                  child: Container(
                    padding: EdgeInsets.all(20.w),
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
                    child: Row(
                      children: [
                        Container(
                          width: 72.r,
                          height: 72.r,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFFE91E63),
                              width: 2.2,
                            ),
                          ),
                          child: ClipOval(
                            child: Builder(
                              builder: (context) {
                                final rawImageUrl =
                                    customer['profile_image_url'] ??
                                        customer['profile_picture'] ??
                                        customer['avatar_url'] ??
                                        customer['profile_image'] ??
                                        customer['image_url'];
                                final rawUrl = rawImageUrl != null &&
                                        rawImageUrl
                                            .toString()
                                            .trim()
                                            .isNotEmpty
                                    ? rawImageUrl
                                        .toString()
                                        .split(',')
                                        .first
                                        .trim()
                                    : null;
                                final fullUrl = (rawUrl != null &&
                                        rawUrl.startsWith('/'))
                                    ? '$kBaseMediaUrl$rawUrl'
                                    : rawUrl;

                                if (fullUrl != null && fullUrl.isNotEmpty) {
                                  return Image.network(
                                    fullUrl,
                                    width: 72.r,
                                    height: 72.r,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Image.asset(
                                      'assets/images/customer_profile_avatar.jpg',
                                      width: 72.r,
                                      height: 72.r,
                                      fit: BoxFit.cover,
                                    ),
                                  );
                                }
                                return Image.asset(
                                  'assets/images/customer_profile_avatar.jpg',
                                  width: 72.r,
                                  height: 72.r,
                                  fit: BoxFit.cover,
                                );
                              },
                            ),
                          ),
                        ),
                        SizedBox(width: 20.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                fullName,
                                style: GoogleFonts.poppins(
                                  fontSize: 20.sp,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              SizedBox(height: 12.h),
                              _buildContactRow(Icons.phone_outlined, phone),
                              SizedBox(height: 6.h),
                              _buildContactRow(Icons.email_outlined, email),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Stats Cards
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20.w),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: EdgeInsets.all(20.w),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20.r),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 15,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Status',
                                style: GoogleFonts.inter(
                                  fontSize: 12.sp,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              SizedBox(height: 4.h),
                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: 10.w,
                                  vertical: 4.h,
                                ),
                                decoration: BoxDecoration(
                                  color: isActive
                                      ? const Color(0xFFECFDF5)
                                      : const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(8.r),
                                ),
                                child: Text(
                                  isActive ? 'Active' : 'Inactive',
                                  style: GoogleFonts.inter(
                                    color: isActive
                                        ? const Color(0xFF10B981)
                                        : const Color(0xFFEF4444),
                                    fontSize: 11.sp,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              SizedBox(height: 16.h),
                              Text(
                                'Member Since',
                                style: GoogleFonts.inter(
                                  fontSize: 12.sp,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              SizedBox(height: 4.h),
                              Text(
                                joinDate,
                                style: GoogleFonts.poppins(
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      SizedBox(width: 16.w),
                      Expanded(
                        child: Container(
                          padding: EdgeInsets.all(20.w),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20.r),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 15,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Total Visits',
                                style: GoogleFonts.inter(
                                  fontSize: 12.sp,
                                  color: Colors.blue.shade600,
                                ),
                              ),
                              SizedBox(height: 4.h),
                              Text(
                                totalVisits.toString(),
                                style: GoogleFonts.poppins(
                                  fontSize: 24.sp,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              SizedBox(height: 16.h),
                              Text(
                                'Total Spent',
                                style: GoogleFonts.inter(
                                  fontSize: 12.sp,
                                  color: const Color(0xFF10B981),
                                ),
                              ),
                              SizedBox(height: 4.h),
                              Text(
                                '₹ $totalSpent',
                                style: GoogleFonts.poppins(
                                  fontSize: 18.sp,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                SizedBox(height: 24.h),

                // Tabs
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: 20.w),
                  child: Row(
                    children: [
                      _buildPillTab(
                        'Appointments',
                        Icons.calendar_today_outlined,
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 16.h),

                // Appointments List
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20.w),
                  child: ref
                      .watch(customerAppointmentsProvider(widget.customerId))
                      .when(
                        loading: () => Padding(
                          padding: EdgeInsets.all(20.0.w),
                          child: Center(child: CircularProgressIndicator()),
                        ),
                        error: (err, _) => Padding(
                          padding: EdgeInsets.all(20.0.w),
                          child: Text(
                            'Error loading appointments: $err',
                            style: GoogleFonts.inter(),
                          ),
                        ),
                        data: (appointments) {
                          if (appointments.isEmpty) {
                            return Padding(
                              padding: EdgeInsets.all(32.0.w),
                              child: Center(
                                child: Text(
                                  'No previous appointments found.',
                                  style: GoogleFonts.inter(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ),
                            );
                          }

                          return Column(
                            children: appointments.map((appt) {
                              final dateStr =
                                  appt['appointment_date']?.toString() ??
                                  appt['date']?.toString() ??
                                  '';
                              String displayDate = dateStr;
                              try {
                                if (dateStr.isNotEmpty) {
                                  final dt = DateTime.parse(dateStr);
                                  displayDate = DateFormat(
                                    'dd MMM yyyy',
                                  ).format(dt);
                                }
                              } catch (_) {}

                              final status = (appt['status'] ?? 'planned')
                                  .toString()
                                  .toLowerCase();
                              final serviceName =
                                  appt['service_name']?.toString() ?? 'Service';
                              final staffName =
                                  appt['staff_first_name']?.toString() ??
                                  'Staff';

                              Color statusBg = const Color(0xFFF3E8FF);
                              Color statusText = const Color(0xFF8B5CF6);
                              String statusLabel = 'Planned';

                              if (status == 'planned') {
                                statusBg = const Color(0xFFFFF0F5);
                                statusText = const Color(0xFFE91E63);
                                statusLabel = 'Planned';
                              } else if (status == 'ongoing') {
                                statusBg = const Color(0xFFFFFBEB);
                                statusText = const Color(0xFFF59E0B);
                                statusLabel = 'Ongoing';
                              } else if (status == 'cancelled') {
                                statusBg = const Color(0xFFFEF2F2);
                                statusText = const Color(0xFFEF4444);
                                statusLabel = 'Cancelled';
                              } else if (status == 'completed') {
                                statusBg = const Color(0xFFECFDF5);
                                statusText = const Color(0xFF059669);
                                statusLabel = 'Completed';
                              } else if (status == 'no_show') {
                                statusBg = const Color(0xFFF8FAFC);
                                statusText = const Color(0xFF64748B);
                                statusLabel = 'No Show';
                              }

                              return GestureDetector(
                                onTap: () =>
                                    context.push('/appointments/${appt['id']}'),
                                child: Container(
                                  margin: EdgeInsets.only(bottom: 12.h),
                                  padding: EdgeInsets.all(16.w),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16.r),
                                    border: Border.all(
                                      color: const Color(0xFFF1F5F9),
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.01),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              serviceName,
                                              style: GoogleFonts.poppins(
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.textPrimary,
                                              ),
                                            ),
                                            SizedBox(height: 4.h),
                                            Text(
                                              '$displayDate  •  With $staffName',
                                              style: GoogleFonts.inter(
                                                fontSize: 12.sp,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: EdgeInsets.symmetric(
                                          horizontal: 10.w,
                                          vertical: 4.h,
                                        ),
                                        decoration: BoxDecoration(
                                          color: statusBg,
                                          borderRadius: BorderRadius.circular(
                                            12.r,
                                          ),
                                        ),
                                        child: Text(
                                          statusLabel,
                                          style: GoogleFonts.inter(
                                            fontSize: 10.sp,
                                            fontWeight: FontWeight.bold,
                                            color: statusText,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          );
                        },
                      ),
                ),

                SizedBox(height: 40.h),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16.sp, color: AppColors.primary),
        SizedBox(width: 8.w),
        Flexible(
          child: Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 13.sp,
              color: AppColors.textPrimary,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildPillTab(String label, IconData icon) {
    const isSelected =
        true; // Hardcoded for now since only appointments is active
    return Container(
      margin: EdgeInsets.only(right: 12.w),
      padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primary : Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(
          color: isSelected ? Colors.transparent : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 16.sp,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
          SizedBox(width: 8.w),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13.sp,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? Colors.white : AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

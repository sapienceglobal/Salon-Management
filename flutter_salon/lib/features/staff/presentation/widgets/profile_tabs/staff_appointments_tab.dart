import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_salon/features/staff/presentation/providers/staff_profile_provider.dart';

class StaffAppointmentsTab extends ConsumerStatefulWidget {
  final int staffId;
  const StaffAppointmentsTab({super.key, required this.staffId});

  @override
  ConsumerState<StaffAppointmentsTab> createState() =>
      _StaffAppointmentsTabState();
}

class _StaffAppointmentsTabState extends ConsumerState<StaffAppointmentsTab> {
  String _statusFilter = 'All';

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return const Color(0xFF10B981);
      case 'ongoing':
        return const Color(0xFFF59E0B);
      case 'planned':
        return const Color(0xFF3B82F6);
      case 'cancelled':
      case 'no_show':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  Color _getStatusBg(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return const Color(0xFFECFDF5);
      case 'ongoing':
        return const Color(0xFFFEF3C7);
      case 'planned':
        return const Color(0xFFEFF6FF);
      case 'cancelled':
      case 'no_show':
        return const Color(0xFFFEF2F2);
      default:
        return const Color(0xFFF1F5F9);
    }
  }

  @override
  Widget build(BuildContext context) {
    final apptsAsync = ref.watch(staffProfileAppointmentsProvider(widget.staffId));

    return apptsAsync.when(
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
                'Failed to load appointments: $err',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: Colors.red),
              ),
              SizedBox(height: 12.h),
              ElevatedButton(
                onPressed: () => ref.invalidate(staffProfileAppointmentsProvider(widget.staffId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (appts) {
        final filtered = appts.where((a) {
          if (_statusFilter == 'All') return true;
          final s = (a['status'] ?? '').toString().toLowerCase();
          if (_statusFilter == 'Upcoming') return s == 'planned' || s == 'ongoing';
          if (_statusFilter == 'Completed') return s == 'completed';
          if (_statusFilter == 'Cancelled') return s == 'cancelled' || s == 'no_show';
          return true;
        }).toList();

        return Column(
          children: [
            // Filter Pills
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              color: Colors.white,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['All', 'Upcoming', 'Completed', 'Cancelled'].map((f) {
                    final isSel = _statusFilter == f;
                    return Padding(
                      padding: EdgeInsets.only(right: 8.w),
                      child: InkWell(
                        onTap: () => setState(() => _statusFilter = f),
                        borderRadius: BorderRadius.circular(20.r),
                        child: Container(
                          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 7.h),
                          decoration: BoxDecoration(
                            color: isSel ? const Color(0xFFE91E63) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(20.r),
                            border: Border.all(
                              color: isSel ? const Color(0xFFE91E63) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Text(
                            f,
                            style: GoogleFonts.inter(
                              fontSize: 12.5.sp,
                              fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                              color: isSel ? Colors.white : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.event_available_rounded, size: 48.sp, color: const Color(0xFFCBD5E1)),
                          SizedBox(height: 12.h),
                          Text(
                            'No appointments found for this filter.',
                            style: GoogleFonts.inter(
                              color: const Color(0xFF64748B),
                              fontSize: 14.sp,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: EdgeInsets.all(16.w),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final apt = filtered[index];
                        final customerName = '${apt['customer_first_name'] ?? ''} ${apt['customer_last_name'] ?? ''}'.trim();
                        final serviceName = apt['service_name'] ?? apt['service']?['name'] ?? 'Custom Service';
                        final dateStr = apt['appointment_date'] ?? apt['date'] ?? 'N/A';
                        final timeStr = apt['start_time'] != null
                            ? '${apt['start_time']} - ${apt['end_time'] ?? ''}'
                            : 'Scheduled';
                        final status = apt['status']?.toString() ?? 'planned';
                        final price = apt['total_price'] ?? apt['price'] ?? 0;
                        final aptId = apt['id'] as int?;

                        return InkWell(
                          onTap: () {
                            if (aptId != null) {
                              context.push('/appointments/$aptId');
                            }
                          },
                          borderRadius: BorderRadius.circular(16.r),
                          child: Container(
                            margin: EdgeInsets.only(bottom: 12.h),
                            padding: EdgeInsets.all(16.w),
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
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: EdgeInsets.all(10.w),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFDF2F8),
                                    borderRadius: BorderRadius.circular(12.r),
                                  ),
                                  child: Icon(Icons.person_pin_rounded, color: const Color(0xFFE91E63), size: 22.sp),
                                ),
                                SizedBox(width: 14.w),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              customerName.isEmpty ? 'Walk-in Client' : customerName,
                                              style: GoogleFonts.poppins(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14.sp,
                                                color: const Color(0xFF1E293B),
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          Container(
                                            padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
                                            decoration: BoxDecoration(
                                              color: _getStatusBg(status),
                                              borderRadius: BorderRadius.circular(8.r),
                                            ),
                                            child: Text(
                                              status.replaceAll('_', ' ').toUpperCase(),
                                              style: GoogleFonts.inter(
                                                fontSize: 10.5.sp,
                                                fontWeight: FontWeight.bold,
                                                color: _getStatusColor(status),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      SizedBox(height: 4.h),
                                      Text(
                                        serviceName,
                                        style: GoogleFonts.inter(
                                          fontSize: 12.5.sp,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFFE91E63),
                                        ),
                                      ),
                                      SizedBox(height: 6.h),
                                      Row(
                                        children: [
                                          Icon(Icons.calendar_today_rounded, size: 12.sp, color: const Color(0xFF64748B)),
                                          SizedBox(width: 4.w),
                                          Text(
                                            dateStr,
                                            style: GoogleFonts.inter(
                                              fontSize: 11.5.sp,
                                              color: const Color(0xFF64748B),
                                            ),
                                          ),
                                          SizedBox(width: 12.w),
                                          Icon(Icons.access_time_rounded, size: 12.sp, color: const Color(0xFF64748B)),
                                          SizedBox(width: 4.w),
                                          Text(
                                            timeStr,
                                            style: GoogleFonts.inter(
                                              fontSize: 11.5.sp,
                                              color: const Color(0xFF64748B),
                                            ),
                                          ),
                                          const Spacer(),
                                          Text(
                                            '₹$price',
                                            style: GoogleFonts.inter(
                                              fontSize: 13.sp,
                                              fontWeight: FontWeight.bold,
                                              color: const Color(0xFF1E293B),
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
                      },
                    ),
            ),
          ],
        );
      },
    );
  }
}

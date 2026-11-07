import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/appointment_provider.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../../../settings/presentation/providers/settings_provider.dart';

class AppointmentDetailScreen extends ConsumerStatefulWidget {
  final int id;
  const AppointmentDetailScreen({super.key, required this.id});

  @override
  ConsumerState<AppointmentDetailScreen> createState() =>
      _AppointmentDetailScreenState();
}

class _AppointmentDetailScreenState
    extends ConsumerState<AppointmentDetailScreen> {
  bool _isLoading = false;

  Future<void> _updateStatus(String status) async {
    setState(() => _isLoading = true);
    try {
      final repository = ref.read(appointmentRepositoryProvider);
      await repository.updateAppointmentStatus(widget.id, status);
      ref.invalidate(appointmentsListProvider);
      ref.invalidate(appointmentDetailProvider(widget.id));
      ref.invalidate(monthlyAppointmentsProvider);
      ref.invalidate(appointmentStatsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Appointment status updated successfully.'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.r),
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = e.toString().replaceAll(
          RegExp(r'Exception:\s*'),
          '',
        );
        if (errorMessage.contains('Cannot change status')) {
          errorMessage =
              'Appointment is already in this status or transition is invalid.';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.r),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appointmentAsync = ref.watch(appointmentDetailProvider(widget.id));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Appointment Details',
          style: GoogleFonts.poppins(
            fontSize: 18.sp,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1E293B),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFF1F5F9), height: 1),
        ),
      ),
      body: appointmentAsync.when(
        loading: () => const SkeletonList(),
        error: (err, stack) =>
            Center(child: Text('Error: $err', style: GoogleFonts.inter())),
        data: (apt) {
          if (apt.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.search_off_rounded,
                    size: 64.sp,
                    color: const Color(0xFFCBD5E1),
                  ),
                  SizedBox(height: 16.h),
                  Text(
                    'Appointment not found',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF64748B),
                      fontSize: 16.sp,
                    ),
                  ),
                ],
              ),
            );
          }

          final status = (apt['status'] ?? 'planned').toString().toLowerCase();
          final hasActions = status != 'completed' &&
              status != 'cancelled' &&
              status != 'no_show';

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 20.h),
                  children: [
                    _buildStatusHeader(status),
                    SizedBox(height: 24.h),

                    _buildSectionCard('Customer Details', [
                      _buildInfoRow(
                        'Name',
                        '${apt['customer_first_name'] ?? ''} ${apt['customer_last_name'] ?? ''}'
                            .trim(),
                        Icons.person_outline,
                      ),
                      _buildInfoRow(
                        'Phone',
                        apt['customer_phone'] ?? 'N/A',
                        Icons.phone_outlined,
                      ),
                    ]),

                    _buildSectionCard('Appointment Info', [
                      _buildInfoRow(
                        'Service',
                        apt['service_name'] ?? 'Custom Service',
                        Icons.content_cut_rounded,
                      ),
                      _buildInfoRow(
                        'Date',
                        apt['appointment_date'] ?? apt['date'] ?? 'N/A',
                        Icons.calendar_today_outlined,
                      ),
                      _buildInfoRow(
                        'Time',
                        '${_formatTime(apt['start_time'] ?? '')} - ${_formatTime(apt['end_time'] ?? '')}',
                        Icons.access_time_rounded,
                      ),
                      _buildInfoRow(
                        'Room / Station',
                        apt['room_number'] ?? 'Standard Station',
                        Icons.meeting_room_outlined,
                      ),
                      _buildInfoRow(
                        'Notes',
                        apt['notes'] ?? 'None',
                        Icons.notes_rounded,
                      ),
                    ]),

                    _buildSectionCard('Staff Assigned', [
                      _buildInfoRow(
                        'Name',
                        '${apt['staff_first_name'] ?? 'Any'} ${apt['staff_last_name'] ?? ''}'
                            .trim(),
                        Icons.badge_outlined,
                      ),
                    ]),

                    _buildSectionCard('Billing Info', [
                      _buildInfoRow(
                        'Total Price',
                        '₹${apt['total_price'] ?? 0}',
                        Icons.receipt_long_outlined,
                        isHighlight: true,
                      ),
                    ]),

                    Consumer(
                      builder: (context, ref, _) {
                        final settings = ref.watch(settingsDataProvider).value?['settings'] as Map<String, dynamic>? ?? {};
                        final policy = settings['cancellation_policy']?.toString().trim();
                        if (policy == null || policy.isEmpty) return const SizedBox.shrink();
                        return _buildSectionCard('Cancellation & Reschedule Policy', [
                          Padding(
                            padding: EdgeInsets.symmetric(vertical: 4.h),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.policy_outlined, size: 18.sp, color: const Color(0xFF64748B)),
                                SizedBox(width: 8.w),
                                Expanded(
                                  child: Text(
                                    policy,
                                    style: GoogleFonts.inter(
                                      fontSize: 12.5.sp,
                                      color: const Color(0xFF64748B),
                                      height: 1.4,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ]);
                      },
                    ),
                    SizedBox(height: 12.h),
                  ],
                ),
              ),

              if (hasActions)
                Container(
                  padding: EdgeInsets.only(
                    left: 20.w,
                    right: 20.w,
                    top: 16.h,
                    bottom: MediaQuery.of(context).padding.bottom > 0
                        ? MediaQuery.of(context).padding.bottom + 8.h
                        : 20.h,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.06),
                        blurRadius: 20,
                        offset: const Offset(0, -6),
                      ),
                    ],
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(28.r),
                    ),
                  ),
                  child: _buildActionButtons(status),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatusHeader(String status) {
    Color primaryColor;
    Color secondaryColor;
    IconData statusIcon;
    String statusTitle;

    switch (status.toLowerCase()) {
      case 'planned':
        primaryColor = const Color(0xFFE91E63);
        secondaryColor = const Color(0xFFFCE7F3);
        statusIcon = Icons.event_available_rounded;
        statusTitle = 'Planned';
        break;
      case 'ongoing':
        primaryColor = const Color(0xFFF59E0B);
        secondaryColor = const Color(0xFFFEF3C7);
        statusIcon = Icons.hourglass_top_rounded;
        statusTitle = 'Ongoing';
        break;
      case 'completed':
        primaryColor = const Color(0xFF10B981);
        secondaryColor = const Color(0xFFD1FAE5);
        statusIcon = Icons.check_circle_rounded;
        statusTitle = 'Completed';
        break;
      case 'no_show':
      case 'cancelled':
        primaryColor = const Color(0xFFEF4444);
        secondaryColor = const Color(0xFFFEE2E2);
        statusIcon = Icons.cancel_rounded;
        statusTitle = status.toLowerCase() == 'no_show'
            ? 'No Show'
            : 'Cancelled';
        break;
      default:
        primaryColor = const Color(0xFF64748B);
        secondaryColor = const Color(0xFFF1F5F9);
        statusIcon = Icons.info_rounded;
        statusTitle = 'Unknown';
    }

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(vertical: 24.h, horizontal: 20.w),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [primaryColor.withOpacity(0.1), secondaryColor],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24.r),
        border: Border.all(color: primaryColor.withOpacity(0.2), width: 1.5),
      ),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: primaryColor.withOpacity(0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(statusIcon, color: primaryColor, size: 36.sp),
          ),
          SizedBox(height: 16.h),
          Text(
            statusTitle.toUpperCase(),
            style: GoogleFonts.poppins(
              fontSize: 20.sp,
              fontWeight: FontWeight.bold,
              color: primaryColor,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard(String title, List<Widget> children) {
    return Container(
      margin: EdgeInsets.only(bottom: 20.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      padding: EdgeInsets.all(20.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 16.sp,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF0F172A),
            ),
          ),
          SizedBox(height: 16.h),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value,
    IconData icon, {
    bool isHighlight = false,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(10.w),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12.r),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Icon(
              icon,
              color: isHighlight
                  ? const Color(0xFFE91E63)
                  : const Color(0xFF64748B),
              size: 18.sp,
            ),
          ),
          SizedBox(width: 16.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF64748B),
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 4.h),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    color: isHighlight
                        ? const Color(0xFFE91E63)
                        : const Color(0xFF1E293B),
                    fontWeight: isHighlight ? FontWeight.bold : FontWeight.w600,
                    fontSize: isHighlight ? 16.sp : 14.sp,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(String status) {
    if (_isLoading) {
      return SizedBox(
        height: 60.h,
        child: const Center(
          child: CircularProgressIndicator(color: Color(0xFFE91E63)),
        ),
      );
    }

    final s = status.toLowerCase();
    List<Widget> buttons = [];

    if (s == 'planned') {
      buttons.add(
        _buildPrimaryButton(
          'Start Appointment',
          () => _updateStatus('ongoing'),
        ),
      );
    }

    if (s == 'ongoing') {
      buttons.add(
        _buildPrimaryButton(
          'Mark as Completed',
          () => _updateStatus('completed'),
          color: const Color(0xFF10B981),
        ),
      );
    } else if (s == 'planned') {
      buttons.add(SizedBox(height: 12.h));
      buttons.add(
        _buildPrimaryButton(
          'Mark as Completed',
          () => _updateStatus('completed'),
          isOutlined: true,
          color: const Color(0xFF10B981),
        ),
      );
    }

    if (s == 'planned' || s == 'ongoing') {
      buttons.add(SizedBox(height: 12.h));
      buttons.add(
        Row(
          children: [
            Expanded(
              child: _buildSecondaryButton(
                'No Show',
                () => _updateStatus('no_show'),
                const Color(0xFF64748B),
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: _buildSecondaryButton(
                'Cancel',
                () => _updateStatus('cancelled'),
                const Color(0xFFEF4444),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: buttons,
    );
  }

  Widget _buildPrimaryButton(
    String text,
    VoidCallback onPressed, {
    bool isOutlined = false,
    Color color = const Color(0xFFE91E63),
  }) {
    if (isOutlined) {
      return OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: color,
          side: BorderSide(color: color, width: 2.w),
          padding: EdgeInsets.symmetric(vertical: 16.h),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16.r),
          ),
        ),
        child: Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 14.sp,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }

    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: EdgeInsets.symmetric(vertical: 16.h),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
        ),
        elevation: 0,
      ),
      child: Text(
        text,
        style: GoogleFonts.inter(fontSize: 14.sp, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildSecondaryButton(
    String text,
    VoidCallback onPressed,
    Color color,
  ) {
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        foregroundColor: color,
        backgroundColor: color.withOpacity(0.1),
        padding: EdgeInsets.symmetric(vertical: 16.h),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
        ),
      ),
      child: Text(
        text,
        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13.sp),
      ),
    );
  }

  String _formatTime(String timeStr) {
    if (timeStr.isEmpty) return '--:--';
    try {
      final parts = timeStr.split(':');
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1]);
      // ignore: non_constant_identifier_names
      String am_pm = hour >= 12 ? "PM" : "AM";
      int displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
      return '${displayHour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')} $am_pm';
    } catch (_) {
      return timeStr;
    }
  }
}

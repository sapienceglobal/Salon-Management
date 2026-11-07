import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';

import 'package:flutter_salon/features/crm/data/crm_provider.dart';
import '../../../../core/theme/app_colors.dart';

class EnquiryDetailsSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> enquiry;

  const EnquiryDetailsSheet({super.key, required this.enquiry});

  @override
  ConsumerState<EnquiryDetailsSheet> createState() =>
      _EnquiryDetailsSheetState();
}

class _EnquiryDetailsSheetState extends ConsumerState<EnquiryDetailsSheet> {
  bool _isLoading = false;
  late Map<String, dynamic> _lead;

  @override
  void initState() {
    super.initState();
    _lead = Map<String, dynamic>.from(widget.enquiry);
  }

  // ── Helper: Format Dates ──────────────────────────────────────────
  String _formatDate(dynamic dateVal) {
    if (dateVal == null) return 'Not scheduled';
    final str = dateVal.toString().trim();
    if (str.isEmpty || str == '-') return 'Not scheduled';
    try {
      final dt = DateTime.parse(str);
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final targetDate = DateTime(dt.year, dt.month, dt.day);

      final diffDays = targetDate.difference(today).inDays;
      if (diffDays == 0) return 'Today (${DateFormat('dd MMM yyyy').format(dt)})';
      if (diffDays == 1) return 'Tomorrow (${DateFormat('dd MMM yyyy').format(dt)})';
      if (diffDays == -1) return 'Yesterday (${DateFormat('dd MMM yyyy').format(dt)})';

      return DateFormat('dd MMM yyyy').format(dt);
    } catch (_) {
      return str;
    }
  }

  // ── Status Styling ────────────────────────────────────────────────
  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'new':
        return const Color(0xFF2563EB); // Royal Blue
      case 'contacted':
        return const Color(0xFF7C3AED); // Violet
      case 'follow_up':
      case 'followup':
        return const Color(0xFFD97706); // Amber
      case 'converted':
        return const Color(0xFF059669); // Emerald
      case 'lost':
        return const Color(0xFFDC2626); // Crimson
      default:
        return const Color(0xFF64748B);
    }
  }

  Color _getStatusBg(String? status) {
    switch (status?.toLowerCase()) {
      case 'new':
        return const Color(0xFFEFF6FF);
      case 'contacted':
        return const Color(0xFFF5F3FF);
      case 'follow_up':
      case 'followup':
        return const Color(0xFFFFFBEB);
      case 'converted':
        return const Color(0xFFECFDF5);
      case 'lost':
        return const Color(0xFFFEF2F2);
      default:
        return const Color(0xFFF1F5F9);
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status?.toLowerCase()) {
      case 'new':
        return Icons.fiber_new_rounded;
      case 'contacted':
        return Icons.ring_volume_rounded;
      case 'follow_up':
      case 'followup':
        return Icons.schedule_rounded;
      case 'converted':
        return Icons.verified_rounded;
      case 'lost':
        return Icons.cancel_rounded;
      default:
        return Icons.info_outline_rounded;
    }
  }

  String _getStatusLabel(String? status) {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'New';
      case 'contacted':
        return 'Contacted';
      case 'follow_up':
      case 'followup':
        return 'Follow Up';
      case 'converted':
        return 'Converted';
      case 'lost':
        return 'Lost';
      default:
        return (status != null && status.isNotEmpty)
            ? status[0].toUpperCase() + status.substring(1)
            : 'New';
    }
  }

  // ── Source Styling ────────────────────────────────────────────────
  IconData _getSourceIcon(String? source) {
    final s = source?.toLowerCase() ?? '';
    if (s.contains('fb') || s.contains('facebook')) return Icons.facebook_rounded;
    if (s.contains('ig') || s.contains('instagram')) return Icons.camera_alt_rounded;
    if (s.contains('wa') || s.contains('whatsapp')) return Icons.chat_bubble_rounded;
    if (s.contains('web') || s.contains('online')) return Icons.language_rounded;
    if (s.contains('walk')) return Icons.storefront_rounded;
    return Icons.person_pin_circle_rounded;
  }

  Color _getSourceColor(String? source) {
    final s = source?.toLowerCase() ?? '';
    if (s.contains('fb') || s.contains('facebook')) return const Color(0xFF1877F2);
    if (s.contains('ig') || s.contains('instagram')) return const Color(0xFFE1306C);
    if (s.contains('wa') || s.contains('whatsapp')) return const Color(0xFF25D366);
    if (s.contains('web') || s.contains('online')) return const Color(0xFF3B82F6);
    if (s.contains('walk')) return const Color(0xFF06B6D4);
    return const Color(0xFF8B5CF6);
  }

  // ── Actions: Copy, Share, Edit, Status ────────────────────────────
  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
            SizedBox(width: 8.w),
            Text('$label copied to clipboard'),
          ],
        ),
        backgroundColor: const Color(0xFF0F172A),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.r)),
      ),
    );
  }

  void _shareLeadDetails() {
    final name = _lead['name'] ?? 'Unnamed Lead';
    final phone = _lead['phone'] ?? 'N/A';
    final email = _lead['email'] ?? 'N/A';
    final source = _lead['source'] ?? 'N/A';
    final status = _getStatusLabel(_lead['status']);
    final notes = _lead['notes'] ?? 'None';

    final shareText = '''
📋 Lead Details - $name
━━━━━━━━━━━━━━━━━━━━
👤 Name: $name
📞 Phone: $phone
📧 Email: $email
🏷️ Status: $status
🌐 Source: $source
📝 Notes: $notes
''';

    Share.share(shareText, subject: 'Lead Details - $name');
  }

  Future<void> _showEditForm() async {
    Navigator.pop(context);
    await context.push('/leads/edit', extra: _lead);
  }

  Future<void> _updateStatus(String newStatus) async {
    final oldStatus = _lead['status'];
    if (oldStatus == newStatus) return;

    setState(() {
      _isLoading = true;
      _lead['status'] = newStatus;
    });

    try {
      await ref.read(crmRepositoryProvider).updateLead(_lead['id'], {
        'status': newStatus,
      });
      ref.invalidate(leadsListProvider);
      ref.invalidate(leadStatsProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8.w),
                Text('Status changed to ${_getStatusLabel(newStatus)}'),
              ],
            ),
            backgroundColor: _getStatusColor(newStatus),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.r)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _lead['status'] = oldStatus;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update status: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── POPUP: Assign Staff (With Empty State Handling) ───────────────
  Future<void> _showAssignDialog() async {
    // Show non-blocking loading indicator if fetching takes a moment
    List<dynamic> staffList = [];
    try {
      setState(() => _isLoading = true);
      staffList = await ref.read(staffListForAssignProvider.future);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load staff list: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return;
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }

    if (!mounted) return;

    // CASE 1: If no staff members exist (Empty State)
    if (staffList.isEmpty) {
      await showDialog(
        context: context,
        builder: (ctx) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
          insetPadding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: 440.w),
            child: Padding(
              padding: EdgeInsets.all(28.w),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72.w,
                    height: 72.w,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF0F5),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFFFD1DC), width: 1.5),
                    ),
                    child: Icon(
                      Icons.badge_outlined,
                      size: 36.sp,
                      color: const Color(0xFFE91E63),
                    ),
                  ),
                  SizedBox(height: 20.h),
                  Text(
                    'No Staff Available',
                    style: GoogleFonts.poppins(
                      fontSize: 18.sp,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 10.h),
                  Text(
                    'There are currently no active staff members in the salon to assign this lead. Please add or activate staff in Staff Management.',
                    style: GoogleFonts.inter(
                      fontSize: 13.sp,
                      color: const Color(0xFF64748B),
                      height: 1.45,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 24.h),
                  SizedBox(
                    width: double.infinity,
                    height: 48.h,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE91E63),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14.r),
                        ),
                      ),
                      child: Text(
                        'Understood',
                        style: GoogleFonts.inter(
                          fontSize: 14.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      return;
    }

    // CASE 2: Staff members exist -> Show Premium Selection Modal
    String searchQuery = '';
    final int? currentlyAssignedId = int.tryParse(_lead['assigned_to']?.toString() ?? '');

    final selectedStaff = await showModalBottomSheet<dynamic>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final filteredStaff = staffList.where((s) {
            if (searchQuery.isEmpty) return true;
            final fullName = '${s['first_name'] ?? ''} ${s['last_name'] ?? ''}'.toLowerCase();
            final role = (s['role'] ?? s['designation'] ?? '').toString().toLowerCase();
            final q = searchQuery.toLowerCase();
            return fullName.contains(q) || role.contains(q);
          }).toList();

          return Align(
            alignment: Alignment.bottomCenter,
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: 580.w,
                maxHeight: MediaQuery.of(context).size.height * 0.85,
              ),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 30,
                      offset: const Offset(0, -6),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(height: 12.h),
                      Center(
                        child: Container(
                          width: 44.w,
                          height: 4.5.h,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(3.r),
                          ),
                        ),
                      ),
                      Padding(
                        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 12.h),
                        child: Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(10.w),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: const Icon(
                                Icons.assignment_ind_rounded,
                                color: Color(0xFF3B82F6),
                                size: 22,
                              ),
                            ),
                            SizedBox(width: 14.w),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Assign Staff Member',
                                    style: GoogleFonts.poppins(
                                      fontSize: 17.sp,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  Text(
                                    'Select a team member to manage this lead',
                                    style: GoogleFonts.inter(
                                      fontSize: 12.sp,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () => Navigator.pop(ctx),
                              icon: const Icon(Icons.close_rounded),
                              color: const Color(0xFF64748B),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 20.w),
                        child: TextField(
                          onChanged: (val) => setModalState(() => searchQuery = val),
                          decoration: InputDecoration(
                            hintText: 'Search staff by name or role...',
                            hintStyle: GoogleFonts.inter(
                              color: const Color(0xFF94A3B8),
                              fontSize: 13.sp,
                            ),
                            prefixIcon: const Icon(
                              Icons.search_rounded,
                              color: Color(0xFF94A3B8),
                              size: 20,
                            ),
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14.r),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14.r),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14.r),
                              borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 1.5),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 12.h),
                      const Divider(height: 1, color: Color(0xFFF1F5F9)),

                      // Unassign Option if currently assigned
                      if (currentlyAssignedId != null)
                        ListTile(
                          leading: Container(
                            padding: EdgeInsets.all(8.w),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.person_remove_rounded,
                              color: Color(0xFFEF4444),
                              size: 18,
                            ),
                          ),
                          title: Text(
                            'Remove Assignment / Unassign',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w600,
                              fontSize: 13.sp,
                              color: const Color(0xFFEF4444),
                            ),
                          ),
                          onTap: () => Navigator.pop(ctx, 'UNASSIGN'),
                        ),

                      Expanded(
                        child: filteredStaff.isEmpty
                            ? Center(
                                child: Padding(
                                  padding: EdgeInsets.all(24.w),
                                  child: Text(
                                    'No staff matching "$searchQuery"',
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFF94A3B8),
                                      fontSize: 13.sp,
                                    ),
                                  ),
                                ),
                              )
                            : ListView.separated(
                                padding: EdgeInsets.fromLTRB(
                                  20.w,
                                  10.h,
                                  20.w,
                                  (MediaQuery.of(ctx).padding.bottom > 0
                                      ? MediaQuery.of(ctx).padding.bottom + 20.h
                                      : 28.h),
                                ),
                                itemCount: filteredStaff.length,
                                separatorBuilder: (_, __) => SizedBox(height: 8.h),
                                itemBuilder: (ctx, i) {
                                  final s = filteredStaff[i];
                                  final id = int.tryParse(s['id']?.toString() ?? '0') ?? 0;
                                  final name = '${s['first_name'] ?? ''} ${s['last_name'] ?? ''}'.trim();
                                  final role = s['role'] ?? s['designation'] ?? 'Stylist';
                                  final isCurrent = id == currentlyAssignedId;

                                  return InkWell(
                                    onTap: () => Navigator.pop(ctx, s),
                                    borderRadius: BorderRadius.circular(14.r),
                                    child: Container(
                                      padding: EdgeInsets.all(12.w),
                                      decoration: BoxDecoration(
                                        color: isCurrent ? const Color(0xFFEFF6FF) : Colors.white,
                                        borderRadius: BorderRadius.circular(14.r),
                                        border: Border.all(
                                          color: isCurrent ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
                                          width: isCurrent ? 1.5 : 1,
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 20.r,
                                            backgroundColor: const Color(0xFFEFF6FF),
                                            child: Text(
                                              name.isNotEmpty ? name[0].toUpperCase() : '?',
                                              style: GoogleFonts.poppins(
                                                color: const Color(0xFF3B82F6),
                                                fontWeight: FontWeight.bold,
                                                fontSize: 15.sp,
                                              ),
                                            ),
                                          ),
                                          SizedBox(width: 12.w),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  name.isNotEmpty ? name : 'Unnamed Staff',
                                                  style: GoogleFonts.inter(
                                                    fontWeight: FontWeight.w700,
                                                    fontSize: 14.sp,
                                                    color: const Color(0xFF0F172A),
                                                  ),
                                                ),
                                                SizedBox(height: 3.h),
                                                Container(
                                                  padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFF1F5F9),
                                                    borderRadius: BorderRadius.circular(6.r),
                                                  ),
                                                  child: Text(
                                                    role.toString(),
                                                    style: GoogleFonts.inter(
                                                      fontSize: 11.sp,
                                                      fontWeight: FontWeight.w500,
                                                      color: const Color(0xFF475569),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          if (isCurrent)
                                            Container(
                                              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF3B82F6),
                                                borderRadius: BorderRadius.circular(20.r),
                                              ),
                                              child: Text(
                                                'Assigned',
                                                style: GoogleFonts.inter(
                                                  color: Colors.white,
                                                  fontSize: 11.sp,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            )
                                          else
                                            const Icon(
                                              Icons.chevron_right_rounded,
                                              color: Color(0xFFCBD5E1),
                                            ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );

    if (selectedStaff != null && mounted) {
      setState(() => _isLoading = true);
      try {
        if (selectedStaff == 'UNASSIGN') {
          await ref.read(crmRepositoryProvider).assignLead(_lead['id'], null);
          setState(() {
            _lead['assigned_to'] = null;
            _lead['assigned_first_name'] = null;
            _lead['assigned_last_name'] = null;
            _lead['assigned_role'] = null;
          });
          ref.invalidate(leadsListProvider);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Lead assignment cleared'),
                behavior: SnackBarBehavior.floating,
                backgroundColor: Color(0xFF0F172A),
              ),
            );
          }
        } else if (selectedStaff is Map) {
          final staffId = int.tryParse(selectedStaff['id']?.toString() ?? '') ?? 0;
          await ref.read(crmRepositoryProvider).assignLead(_lead['id'], staffId);
          setState(() {
            _lead['assigned_to'] = staffId;
            _lead['assigned_first_name'] = selectedStaff['first_name'];
            _lead['assigned_last_name'] = selectedStaff['last_name'];
            _lead['assigned_role'] = selectedStaff['role'] ?? selectedStaff['designation'];
          });
          ref.invalidate(leadsListProvider);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                    SizedBox(width: 8.w),
                    Expanded(
                      child: Text(
                        'Assigned to ${selectedStaff['first_name']} ${selectedStaff['last_name'] ?? ''}'.trim(),
                      ),
                    ),
                  ],
                ),
                behavior: SnackBarBehavior.floating,
                backgroundColor: const Color(0xFF10B981),
              ),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error assigning staff: $e'),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  // ── POPUP: Follow-up Dialog ───────────────────────────────────────
  Future<void> _showFollowUpDialog() async {
    final notesCtrl = TextEditingController();
    DateTime? followUpDate = DateTime.now().add(const Duration(days: 1));
    String followUpType = 'call';

    final types = [
      {'key': 'call', 'label': 'Call', 'icon': Icons.phone_rounded, 'color': const Color(0xFF10B981)},
      {'key': 'whatsapp', 'label': 'WhatsApp', 'icon': Icons.chat_bubble_rounded, 'color': const Color(0xFF25D366)},
      {'key': 'email', 'label': 'Email', 'icon': Icons.mail_rounded, 'color': const Color(0xFF3B82F6)},
      {'key': 'visit', 'label': 'Visit', 'icon': Icons.storefront_rounded, 'color': const Color(0xFFE91E63)},
      {'key': 'sms', 'label': 'SMS', 'icon': Icons.sms_rounded, 'color': const Color(0xFF8B5CF6)},
    ];

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
          insetPadding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 24.h),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: 460.w),
            child: Padding(
              padding: EdgeInsets.all(24.w),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: EdgeInsets.all(10.w),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF0F5),
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                          child: const Icon(
                            Icons.schedule_rounded,
                            color: Color(0xFFE91E63),
                            size: 22,
                          ),
                        ),
                        SizedBox(width: 14.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Record Follow-up',
                                style: GoogleFonts.poppins(
                                  fontSize: 17.sp,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                'Log communication & set next reminder',
                                style: GoogleFonts.inter(
                                  fontSize: 12.sp,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(ctx),
                          icon: const Icon(Icons.close_rounded),
                          color: const Color(0xFF64748B),
                        ),
                      ],
                    ),
                    SizedBox(height: 20.h),

                    // Channel / Type Chips
                    Text(
                      'CHANNEL / TYPE',
                      style: GoogleFonts.inter(
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    SizedBox(height: 8.h),
                    Wrap(
                      spacing: 8.w,
                      runSpacing: 8.h,
                      children: types.map((t) {
                        final isSelected = followUpType == t['key'];
                        final color = t['color'] as Color;
                        return InkWell(
                          onTap: () => setDialogState(() => followUpType = t['key'] as String),
                          borderRadius: BorderRadius.circular(12.r),
                          child: Container(
                            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
                            decoration: BoxDecoration(
                              color: isSelected ? color.withValues(alpha: 0.12) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12.r),
                              border: Border.all(
                                color: isSelected ? color : const Color(0xFFE2E8F0),
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  t['icon'] as IconData,
                                  size: 16.sp,
                                  color: isSelected ? color : const Color(0xFF64748B),
                                ),
                                SizedBox(width: 6.w),
                                Text(
                                  t['label'] as String,
                                  style: GoogleFonts.inter(
                                    fontSize: 12.sp,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                    color: isSelected ? color : const Color(0xFF334155),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    SizedBox(height: 18.h),

                    // Next Follow-up Date
                    Text(
                      'NEXT FOLLOW-UP DATE',
                      style: GoogleFonts.inter(
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    SizedBox(height: 8.h),
                    InkWell(
                      onTap: () async {
                        final d = await showDatePicker(
                          context: ctx,
                          initialDate: followUpDate ?? DateTime.now().add(const Duration(days: 1)),
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                          builder: (context, child) => Theme(
                            data: Theme.of(context).copyWith(
                              colorScheme: const ColorScheme.light(
                                primary: Color(0xFFE91E63),
                                onPrimary: Colors.white,
                                surface: Colors.white,
                                onSurface: Color(0xFF0F172A),
                              ),
                            ),
                            child: child!,
                          ),
                        );
                        if (d != null) setDialogState(() => followUpDate = d);
                      },
                      borderRadius: BorderRadius.circular(14.r),
                      child: Container(
                        padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          borderRadius: BorderRadius.circular(14.r),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_month_rounded, size: 20, color: Color(0xFFE91E63)),
                            SizedBox(width: 10.w),
                            Expanded(
                              child: Text(
                                followUpDate != null
                                    ? DateFormat('EEEE, dd MMM yyyy').format(followUpDate!)
                                    : 'Select reminder date',
                                style: GoogleFonts.inter(
                                  color: followUpDate != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                  fontSize: 13.sp,
                                  fontWeight: followUpDate != null ? FontWeight.w600 : FontWeight.w400,
                                ),
                              ),
                            ),
                            const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF94A3B8)),
                          ],
                        ),
                      ),
                    ),

                    SizedBox(height: 18.h),

                    // Notes
                    Text(
                      'CONVERSATION NOTES',
                      style: GoogleFonts.inter(
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    SizedBox(height: 8.h),
                    TextField(
                      controller: notesCtrl,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'What did the lead say? Any specific services required?',
                        hintStyle: GoogleFonts.inter(fontSize: 12.sp, color: const Color(0xFF94A3B8)),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        contentPadding: EdgeInsets.all(12.w),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14.r),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14.r),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14.r),
                          borderSide: const BorderSide(color: Color(0xFFE91E63), width: 1.5),
                        ),
                      ),
                    ),

                    SizedBox(height: 24.h),

                    // Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 48.h,
                            child: OutlinedButton(
                              onPressed: () => Navigator.pop(ctx),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFFE2E8F0)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                              ),
                              child: Text(
                                'Cancel',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Expanded(
                          child: SizedBox(
                            height: 48.h,
                            child: ElevatedButton(
                              onPressed: () => Navigator.pop(ctx, {
                                'type': followUpType,
                                'notes': notesCtrl.text.trim(),
                                if (followUpDate != null)
                                  'next_follow_up_date': followUpDate!.toIso8601String().split('T')[0],
                              }),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE91E63),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                              ),
                              child: Text(
                                'Save Follow-up',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13.sp,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );

    if (result != null && mounted) {
      setState(() => _isLoading = true);
      try {
        await ref.read(crmRepositoryProvider).recordFollowUp(_lead['id'], result);
        if (result['next_follow_up_date'] != null) {
          setState(() {
            _lead['follow_up_date'] = result['next_follow_up_date'];
          });
        }
        ref.invalidate(leadsListProvider);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Follow-up activity recorded successfully'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Color(0xFF10B981),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: ${e.toString().replaceAll("Exception: ", "")}'),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  // ── POPUP: Convert to Customer Confirmation ───────────────────────
  Future<void> _convert() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
        insetPadding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: 440.w),
          child: Padding(
            padding: EdgeInsets.all(24.w),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64.w,
                  height: 64.w,
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFA7F3D0), width: 1.5),
                  ),
                  child: const Icon(
                    Icons.verified_user_rounded,
                    size: 32,
                    color: Color(0xFF059669),
                  ),
                ),
                SizedBox(height: 18.h),
                Text(
                  'Convert to Customer?',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 8.h),
                Text(
                  'This will convert ${_lead['name'] ?? 'this lead'} into a registered salon customer and unlock full appointment & billing history.',
                  style: GoogleFonts.inter(
                    fontSize: 13.sp,
                    color: const Color(0xFF64748B),
                    height: 1.45,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 24.h),
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 48.h,
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFE2E8F0)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                          ),
                          child: Text(
                            'Cancel',
                            style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: SizedBox(
                        height: 48.h,
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF059669),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                          ),
                          child: Text(
                            'Convert Now',
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13.sp),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isLoading = true);
      try {
        await ref.read(crmRepositoryProvider).convertLead(_lead['id']);
        ref.invalidate(leadsListProvider);
        ref.invalidate(leadStatsProvider);

        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🎉 Lead successfully converted to Customer!'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Color(0xFF059669),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Conversion failed: $e'),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  // ── POPUP: Delete Lead Confirmation ───────────────────────────────
  Future<void> _markInactive() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
        insetPadding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: 440.w),
          child: Padding(
            padding: EdgeInsets.all(24.w),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64.w,
                  height: 64.w,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFFECACA), width: 1.5),
                  ),
                  child: const Icon(
                    Icons.delete_outline_rounded,
                    size: 32,
                    color: Color(0xFFDC2626),
                  ),
                ),
                SizedBox(height: 18.h),
                Text(
                  'Delete Lead?',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 8.h),
                Text(
                  'Are you sure you want to delete ${_lead['name'] ?? 'this lead'}? This action is permanent and cannot be undone.',
                  style: GoogleFonts.inter(
                    fontSize: 13.sp,
                    color: const Color(0xFF64748B),
                    height: 1.45,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 24.h),
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 48.h,
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFE2E8F0)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                          ),
                          child: Text(
                            'Cancel',
                            style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: SizedBox(
                        height: 48.h,
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFDC2626),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                          ),
                          child: Text(
                            'Delete Lead',
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13.sp),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isLoading = true);
      try {
        await ref.read(crmRepositoryProvider).deleteLead(_lead['id']);
        ref.invalidate(leadsListProvider);
        ref.invalidate(leadStatsProvider);

        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Lead removed successfully'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Color(0xFF0F172A),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Delete failed: $e'),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  // ── MAIN BUILD ───────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final name = _lead['name']?.toString() ?? 'Unnamed Lead';
    final phone = _lead['phone']?.toString();
    final email = _lead['email']?.toString();
    final gender = _lead['gender']?.toString();
    final location = _lead['location']?.toString();
    final source = _lead['source']?.toString();
    final notes = _lead['notes']?.toString();
    final status = _lead['status']?.toString() ?? 'new';
    final isConverted = status.toLowerCase() == 'converted';

    // Staff details
    final hasStaffAssigned = _lead['assigned_to'] != null &&
        _lead['assigned_to'].toString().isNotEmpty &&
        _lead['assigned_to'].toString() != '0';
    final assignedStaffName = (_lead['assigned_first_name'] != null &&
            _lead['assigned_first_name'].toString().isNotEmpty)
        ? '${_lead['assigned_first_name']} ${_lead['assigned_last_name'] ?? ''}'.trim()
        : (hasStaffAssigned ? 'Assigned Staff (#${_lead['assigned_to']})' : null);
    final assignedStaffRole = _lead['assigned_role'] ?? _lead['assigned_designation'] ?? 'Staff Member';

    return Align(
      alignment: Alignment.bottomCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: 620.w,
          maxHeight: MediaQuery.of(context).size.height * 0.90,
        ),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.20),
                blurRadius: 36,
                offset: const Offset(0, -8),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            bottom: true,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(height: 12.h),

                // Drag Handle
                Center(
                  child: Container(
                    width: 44.w,
                    height: 4.5.h,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(3.r),
                    ),
                  ),
                ),

                // Top Navigation Bar
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
                  child: Row(
                    children: [
                      Text(
                        'Lead Profile',
                        style: GoogleFonts.poppins(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const Spacer(),
                      // Share
                      IconButton(
                        onPressed: _shareLeadDetails,
                        icon: const Icon(Icons.share_outlined),
                        color: const Color(0xFF64748B),
                        tooltip: 'Share lead',
                      ),
                      // Edit
                      IconButton(
                        onPressed: _showEditForm,
                        icon: const Icon(Icons.edit_outlined),
                        color: const Color(0xFFE91E63),
                        tooltip: 'Edit lead',
                      ),
                      // Delete
                      IconButton(
                        onPressed: _markInactive,
                        icon: const Icon(Icons.delete_outline_rounded),
                        color: const Color(0xFFEF4444),
                        tooltip: 'Delete lead',
                      ),
                      // Close
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close_rounded),
                        color: const Color(0xFF64748B),
                      ),
                    ],
                  ),
                ),

                const Divider(height: 1, color: Color(0xFFF1F5F9)),

                if (_isLoading)
                  const LinearProgressIndicator(
                    color: Color(0xFFE91E63),
                    backgroundColor: Color(0xFFFFF0F5),
                  ),

                // Scrollable Body
                Flexible(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── 1. Hero Identity Card ───────────────────────
                        Container(
                          padding: EdgeInsets.all(16.w),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFFFFF5F7), Color(0xFFFFFFFF)],
                            ),
                            borderRadius: BorderRadius.circular(20.r),
                            border: Border.all(color: const Color(0xFFFFE4EC)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 56.w,
                                height: 56.w,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFFE91E63), Color(0xFFFF5252)],
                                  ),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFFE91E63).withValues(alpha: 0.3),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: Text(
                                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                                    style: GoogleFonts.playfairDisplay(
                                      fontSize: 24.sp,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
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
                                      name,
                                      style: GoogleFonts.poppins(
                                        fontSize: 18.sp,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF0F172A),
                                      ),
                                    ),
                                    SizedBox(height: 4.h),
                                    if (phone != null && phone.isNotEmpty)
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.phone_rounded,
                                            size: 14.sp,
                                            color: const Color(0xFF64748B),
                                          ),
                                          SizedBox(width: 6.w),
                                          Text(
                                            phone,
                                            style: GoogleFonts.inter(
                                              fontSize: 13.sp,
                                              color: const Color(0xFF334155),
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          SizedBox(width: 6.w),
                                          InkWell(
                                            onTap: () => _copyToClipboard(phone, 'Phone number'),
                                            child: Icon(
                                              Icons.copy_rounded,
                                              size: 14.sp,
                                              color: const Color(0xFF94A3B8),
                                            ),
                                          ),
                                        ],
                                      ),
                                    if (email != null && email.isNotEmpty) ...[
                                      SizedBox(height: 2.h),
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.mail_outline_rounded,
                                            size: 14.sp,
                                            color: const Color(0xFF64748B),
                                          ),
                                          SizedBox(width: 6.w),
                                          Expanded(
                                            child: Text(
                                              email,
                                              style: GoogleFonts.inter(
                                                fontSize: 12.sp,
                                                color: const Color(0xFF64748B),
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          InkWell(
                                            onTap: () => _copyToClipboard(email, 'Email address'),
                                            child: Icon(
                                              Icons.copy_rounded,
                                              size: 14.sp,
                                              color: const Color(0xFF94A3B8),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        SizedBox(height: 16.h),

                        // ── 2. Interactive Status Workflow ──────────────
                        Text(
                          'LEAD STATUS',
                          style: GoogleFonts.inter(
                            fontSize: 11.sp,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        SizedBox(height: 8.h),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: ['new', 'contacted', 'follow_up', 'converted', 'lost'].map((st) {
                              final isCurrent = status.toLowerCase() == st;
                              final color = _getStatusColor(st);
                              final bg = _getStatusBg(st);
                              final icon = _getStatusIcon(st);
                              final label = _getStatusLabel(st);

                              return Padding(
                                padding: EdgeInsets.only(right: 8.w),
                                child: InkWell(
                                  onTap: () => _updateStatus(st),
                                  borderRadius: BorderRadius.circular(12.r),
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 8.h),
                                    decoration: BoxDecoration(
                                      color: isCurrent ? color : bg,
                                      borderRadius: BorderRadius.circular(12.r),
                                      border: Border.all(
                                        color: isCurrent ? color : color.withValues(alpha: 0.25),
                                        width: isCurrent ? 1.5 : 1,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          icon,
                                          size: 15.sp,
                                          color: isCurrent ? Colors.white : color,
                                        ),
                                        SizedBox(width: 6.w),
                                        Text(
                                          label,
                                          style: GoogleFonts.inter(
                                            fontSize: 12.sp,
                                            fontWeight: isCurrent ? FontWeight.bold : FontWeight.w600,
                                            color: isCurrent ? Colors.white : color,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),

                        SizedBox(height: 20.h),

                        // ── 3. Staff Assignment Card ────────────────────
                        Text(
                          'ASSIGNED STAFF',
                          style: GoogleFonts.inter(
                            fontSize: 11.sp,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        SizedBox(height: 8.h),
                        Container(
                          padding: EdgeInsets.all(14.w),
                          decoration: BoxDecoration(
                            color: hasStaffAssigned ? const Color(0xFFEFF6FF) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16.r),
                            border: Border.all(
                              color: hasStaffAssigned ? const Color(0xFFBFDBFE) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 20.r,
                                backgroundColor: hasStaffAssigned
                                    ? const Color(0xFF3B82F6)
                                    : const Color(0xFFE2E8F0),
                                child: Icon(
                                  hasStaffAssigned ? Icons.person_rounded : Icons.person_outline_rounded,
                                  color: hasStaffAssigned ? Colors.white : const Color(0xFF94A3B8),
                                  size: 20.sp,
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      assignedStaffName ?? 'Unassigned',
                                      style: GoogleFonts.inter(
                                        fontSize: 14.sp,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF0F172A),
                                      ),
                                    ),
                                    SizedBox(height: 2.h),
                                    Text(
                                      hasStaffAssigned
                                          ? assignedStaffRole
                                          : 'No team member assigned yet',
                                      style: GoogleFonts.inter(
                                        fontSize: 12.sp,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              OutlinedButton.icon(
                                onPressed: _isLoading ? null : _showAssignDialog,
                                icon: Icon(
                                  hasStaffAssigned ? Icons.sync_rounded : Icons.person_add_rounded,
                                  size: 16.sp,
                                ),
                                label: Text(
                                  hasStaffAssigned ? 'Change' : 'Assign',
                                  style: GoogleFonts.inter(
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF3B82F6),
                                  side: const BorderSide(color: Color(0xFF3B82F6)),
                                  padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10.r),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        SizedBox(height: 20.h),

                        // ── 4. Key Details Grid ─────────────────────────
                        Text(
                          'KEY DETAILS',
                          style: GoogleFonts.inter(
                            fontSize: 11.sp,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        SizedBox(height: 8.h),
                        Container(
                          padding: EdgeInsets.all(16.w),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16.r),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            children: [
                              _buildDetailItem(
                                icon: _getSourceIcon(source),
                                iconColor: _getSourceColor(source),
                                label: 'Lead Source',
                                value: source != null && source.isNotEmpty
                                    ? source[0].toUpperCase() + source.substring(1)
                                    : 'Not specified',
                              ),
                              const Divider(height: 20, color: Color(0xFFE2E8F0)),
                              _buildDetailItem(
                                icon: Icons.calendar_month_rounded,
                                iconColor: const Color(0xFFE91E63),
                                label: 'Next Follow-up',
                                value: _formatDate(_lead['follow_up_date']),
                              ),
                              if (gender != null && gender.isNotEmpty) ...[
                                const Divider(height: 20, color: Color(0xFFE2E8F0)),
                                _buildDetailItem(
                                  icon: Icons.wc_rounded,
                                  iconColor: const Color(0xFF8B5CF6),
                                  label: 'Gender',
                                  value: gender,
                                ),
                              ],
                              if (location != null && location.isNotEmpty) ...[
                                const Divider(height: 20, color: Color(0xFFE2E8F0)),
                                _buildDetailItem(
                                  icon: Icons.location_on_rounded,
                                  iconColor: const Color(0xFFEF4444),
                                  label: 'Location',
                                  value: location,
                                ),
                              ],
                            ],
                          ),
                        ),

                        // ── 5. Notes / Inquiry Message ──────────────────
                        if (notes != null && notes.isNotEmpty) ...[
                          SizedBox(height: 20.h),
                          Text(
                            'ENQUIRY NOTES',
                            style: GoogleFonts.inter(
                              fontSize: 11.sp,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          SizedBox(height: 8.h),
                          Container(
                            width: double.infinity,
                            padding: EdgeInsets.all(16.w),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(16.r),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(
                                  Icons.chat_bubble_outline_rounded,
                                  size: 18,
                                  color: Color(0xFF64748B),
                                ),
                                SizedBox(width: 12.w),
                                Expanded(
                                  child: Text(
                                    notes,
                                    style: GoogleFonts.inter(
                                      fontSize: 13.sp,
                                      color: const Color(0xFF1E293B),
                                      height: 1.45,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        SizedBox(height: 24.h),

                        // ── 6. Bottom Floating Action Buttons ───────────
                        if (!isConverted) ...[
                          Row(
                            children: [
                              Expanded(
                                child: SizedBox(
                                  height: 48.h,
                                  child: OutlinedButton.icon(
                                    onPressed: _isLoading ? null : _showFollowUpDialog,
                                    icon: Icon(Icons.phone_callback_rounded, size: 18.sp),
                                    label: Text(
                                      'Follow-up',
                                      style: GoogleFonts.inter(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13.sp,
                                      ),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: const Color(0xFFE91E63),
                                      side: const BorderSide(color: Color(0xFFE91E63)),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14.r),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                child: SizedBox(
                                  height: 48.h,
                                  child: OutlinedButton.icon(
                                    onPressed: _isLoading ? null : _showAssignDialog,
                                    icon: Icon(Icons.assignment_ind_rounded, size: 18.sp),
                                    label: Text(
                                      'Assign Staff',
                                      style: GoogleFonts.inter(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13.sp,
                                      ),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: const Color(0xFF3B82F6),
                                      side: const BorderSide(color: Color(0xFF3B82F6)),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14.r),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 12.h),
                          SizedBox(
                            width: double.infinity,
                            height: 52.h,
                            child: ElevatedButton.icon(
                              onPressed: _isLoading ? null : _convert,
                              icon: const Icon(
                                Icons.verified_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                              label: Text(
                                'Convert to Customer',
                                style: GoogleFonts.inter(
                                  fontSize: 15.sp,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF059669),
                                elevation: 2,
                                shadowColor: const Color(0xFF059669).withValues(alpha: 0.3),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14.r),
                                ),
                              ),
                            ),
                          ),
                        ] else ...[
                          Container(
                            width: double.infinity,
                            padding: EdgeInsets.symmetric(vertical: 14.h),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(14.r),
                              border: Border.all(color: const Color(0xFFA7F3D0)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.verified_rounded,
                                  color: Color(0xFF059669),
                                  size: 20,
                                ),
                                SizedBox(width: 8.w),
                                Text(
                                  'Customer Converted',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14.sp,
                                    color: const Color(0xFF059669),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        SizedBox(
                          height: (MediaQuery.of(context).padding.bottom > 0
                                  ? MediaQuery.of(context).padding.bottom + 16.h
                                  : 24.h) +
                              16.h,
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
    );
  }

  Widget _buildDetailItem({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          padding: EdgeInsets.all(8.w),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10.r),
          ),
          child: Icon(icon, size: 16.sp, color: iconColor),
        ),
        SizedBox(width: 12.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11.sp,
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 2.h),
              Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

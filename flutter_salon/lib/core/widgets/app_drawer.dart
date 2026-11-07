import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/appointments/presentation/providers/appointment_provider.dart';
import '../../features/crm/data/crm_provider.dart';

class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String currentRoute = GoRouterState.of(context).uri.toString();

    return Drawer(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(32.r)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        // App Logo (pink and black icon placeholder)
                        Container(
                          width: 40.w,
                          height: 40.w,
                          decoration: BoxDecoration(
                            image: const DecorationImage(
                              image: AssetImage('assets/images/icon-dark.png'),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              RichText(
                                text: TextSpan(
                                  text: 'Salon',
                                  style: GoogleFonts.poppins(
                                    color: const Color(0xFF1E1B4B),
                                    fontSize: 20.sp,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.5,
                                  ),
                                  children: [
                                    TextSpan(
                                      text: 'Time',
                                      style: TextStyle(
                                        color: const Color(0xFFE91E63), // Pink
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                'APPOINTMENTS | CRM | SALON MANAGEMENT',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF94A3B8),
                                  fontSize: 7.sp,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: 8.w),
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    borderRadius: BorderRadius.circular(20.r),
                    child: Container(
                      padding: EdgeInsets.all(8.w),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDF2F8), // Light pink
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.close_rounded,
                        color: const Color(0xFFE91E63),
                        size: 16.sp,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Profile Card
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFFFDF2F8),
                      Color(0xFFFCE7F3),
                      Color(0xFFFBCFE8),
                      Color(0xFFFCE7F3)
                    ],
                    stops: [0.0, 0.4, 0.8, 1.0],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24.r),
                ),
                padding: EdgeInsets.all(16.w),
                child: Consumer(
                  builder: (context, ref, child) {
                    final userProfile = ref.watch(userProfileProvider);
                    final isManager = ref.watch(isManagerProvider);

                    return userProfile.when(
                      data: (user) {
                        final firstName = user?['first_name'] ?? 'Super';
                        final lastName = user?['last_name'] ?? 'Admin';
                        final email = user?['email'] ?? 'No email';
                        final role = (user?['role']?.toString() ?? ref.watch(userRoleProvider) ?? 'admin').toLowerCase();
                        final bool isUserAccountManager = role == 'manager' || isManager;
                        final name = '$firstName $lastName'.trim();
                        final initials = name.isNotEmpty
                            ? name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join()
                            : (isUserAccountManager ? 'MG' : 'SA');

                        return Row(
                          children: [
                            CircleAvatar(
                              radius: 28.r,
                              backgroundColor: isUserAccountManager
                                  ? const Color(0xFF2563EB)
                                  : const Color(0xFFE91E63),
                              child: Text(
                                initials.toUpperCase(),
                                style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18.sp,
                                ),
                              ),
                            ),
                            SizedBox(width: 12.w),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          name,
                                          style: GoogleFonts.poppins(
                                            color: const Color(0xFF1E1B4B),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16.sp,
                                          ),
                                        ),
                                      ),
                                      SizedBox(width: 4.w),
                                      Icon(
                                        Icons.verified_rounded,
                                        color: isUserAccountManager
                                            ? const Color(0xFF2563EB)
                                            : const Color(0xFFE91E63),
                                        size: 16.sp,
                                      ),
                                    ],
                                  ),
                                  Text(
                                    email,
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFF64748B),
                                      fontSize: 12.sp,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  SizedBox(height: 6.h),
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 10.w,
                                      vertical: 4.h,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isUserAccountManager
                                          ? const Color(0xFFEFF6FF)
                                          : const Color(0xFFFFF1F2),
                                      borderRadius: BorderRadius.circular(12.r),
                                      border: Border.all(
                                        color: isUserAccountManager
                                            ? const Color(0xFFBFDBFE)
                                            : const Color(0xFFF9A8D4).withOpacity(0.5),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          isUserAccountManager
                                              ? Icons.manage_accounts_rounded
                                              : Icons.admin_panel_settings_rounded,
                                          color: isUserAccountManager
                                              ? const Color(0xFF2563EB)
                                              : const Color(0xFFE91E63),
                                          size: 13.sp,
                                        ),
                                        SizedBox(width: 4.w),
                                        Text(
                                          isUserAccountManager ? 'Manager' : 'Admin',
                                          style: GoogleFonts.inter(
                                            color: isUserAccountManager
                                                ? const Color(0xFF1D4ED8)
                                                : const Color(0xFFE91E63),
                                            fontSize: 10.sp,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      },
                      loading: () => Center(
                          child: CircularProgressIndicator(color: Color(0xFFE91E63))),
                      error: (_, __) => Text('Error loading profile'),
                    );
                  },
                ),
              ),
            ),
            SizedBox(height: 16.h),

            // Scrollable Menu
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildDrawerItem(context, Icons.dashboard_outlined, 'Dashboard', '/dashboard', currentRoute),
                  if (!ref.watch(isManagerProvider))
                    _buildDrawerItem(context, Icons.point_of_sale_outlined, 'POS', '/pos', currentRoute),
                  Consumer(
                    builder: (context, ref, child) {
                      final appointmentsAsync = ref.watch(appointmentsListProvider(null));
                      final count = appointmentsAsync.maybeWhen(
                        data: (list) => list.length,
                        orElse: () => 0,
                      );
                      return _buildDrawerItem(
                        context,
                        Icons.calendar_today_outlined,
                        'Appointments',
                        '/appointments',
                        currentRoute,
                        badgeCount: count > 0 ? count : null,
                      );
                    },
                  ),
                  _buildDrawerItem(context, Icons.people_outline, 'Customers', '/customers', currentRoute),
                  _buildDrawerItem(context, Icons.spa_outlined, 'Services', '/services', currentRoute),
                  _buildDrawerItem(context, Icons.badge_outlined, 'Staff', '/staff', currentRoute),
                  _buildDrawerItem(context, Icons.how_to_reg_outlined, 'Attendance', '/staff/attendance', currentRoute),
                  _buildDrawerItem(context, Icons.inventory_2_outlined, 'Inventory', '/inventory', currentRoute),
                  if (!ref.watch(isManagerProvider))
                    _buildDrawerItem(context, Icons.money_off_outlined, 'Expenses', '/expenses', currentRoute),
                  if (!ref.watch(isManagerProvider))
                    _buildDrawerItem(context, Icons.bar_chart_outlined, 'Reports', '/reports', currentRoute),
                  _buildDrawerItem(context, Icons.star_outline, 'Packages & Memberships', '/catalog', currentRoute),
                  if (!ref.watch(isManagerProvider))
                    _buildDrawerItem(context, Icons.receipt_outlined, 'Invoices', '/invoices', currentRoute),
                  
                  SizedBox(height: 16.h),
                  _buildSectionHeader(Icons.campaign_outlined, 'CRM & MARKETING'),
                  Consumer(
                    builder: (context, ref, child) {
                      final leadsAsync = ref.watch(leadsListProvider);
                      final count = leadsAsync.maybeWhen(
                        data: (list) => list.length,
                        orElse: () => 0,
                      );
                      return _buildDrawerItem(
                        context,
                        Icons.person_add_outlined,
                        'Leads',
                        '/leads',
                        currentRoute,
                        badgeCount: count > 0 ? count : null,
                      );
                    },
                  ),
                  _buildDrawerItem(context, Icons.campaign_outlined, 'Campaigns', '/campaigns', currentRoute),
                  _buildDrawerItem(context, Icons.rate_review_outlined, 'Feedback & Reviews', '/feedback', currentRoute),

                  SizedBox(height: 32.h),
                ],
              ),
            ),
            
            // Bottom Actions Container
            _buildBottomActions(context, ref),

            // Delete Account (Google Play Mandatory Compliance)
            _buildDeleteAccountButton(context, ref),
            SizedBox(height: 12.h),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Padding(
      padding: EdgeInsets.only(left: 20.w, right: 20.w, bottom: 8.h),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF64748B), size: 16.sp),
          SizedBox(width: 8.w),
          Text(
            title,
            style: GoogleFonts.inter(
              color: const Color(0xFF64748B),
              fontWeight: FontWeight.bold,
              fontSize: 11.sp,
              letterSpacing: 1.2,
            ),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Container(
              height: 1,
              color: const Color(0xFFE2E8F0), // slate-200
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context,
    IconData icon,
    String title,
    String route,
    String currentRoute, {
    int? badgeCount,
  }) {
    // Exact match or sub-route match logic
    bool isSelected = currentRoute == route;
    if (route != '/' && currentRoute.startsWith(route)) {
      isSelected = true;
    }

    final Color bgColor = isSelected ? const Color(0xFFFDF2F8) : Colors.transparent;
    final Color textColor = isSelected ? const Color(0xFFE91E63) : const Color(0xFF1E1B4B);
    final Color iconColor = const Color(0xFFE91E63);
    final Color iconBg = isSelected ? const Color(0xFFFCE7F3) : const Color(0xFFFDF2F8);

    return InkWell(
      onTap: () {
        context.pop();
        context.go(route);
      },
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 12.h),
        margin: EdgeInsets.only(bottom: 4.h),
        decoration: BoxDecoration(
          color: bgColor,
          border: isSelected
              ? Border(
                  left: BorderSide(
                    color: const Color(0xFFE91E63),
                    width: 4.w,
                  ),
                )
              : null,
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(8.w),
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(10.r),
              ),
              child: Icon(
                icon,
                color: iconColor,
                size: 20.sp,
              ),
            ),
            SizedBox(width: 16.w),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.inter(
                  color: textColor,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  fontSize: 14.sp,
                ),
              ),
            ),
            if (badgeCount != null)
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                decoration: BoxDecoration(
                  color: const Color(0xFFE91E63),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Text(
                  badgeCount.toString(),
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 10.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            SizedBox(width: 8.w),
            Icon(
              Icons.chevron_right_rounded,
              color: isSelected ? const Color(0xFFE91E63) : const Color(0xFF94A3B8),
              size: 20.sp,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomActions(BuildContext context, WidgetRef ref) {
    final isManager = ref.watch(isManagerProvider);

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 20.h),
      margin: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFDF2F8), Color(0xFFFCE7F3)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Row(
        mainAxisAlignment: isManager ? MainAxisAlignment.center : MainAxisAlignment.spaceAround,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (!isManager)
            _buildBottomActionItem(
              Icons.settings_outlined,
              'Settings',
              onTap: () {
                context.pop();
                context.go('/settings');
              },
            ),
          _buildBottomActionItem(
            Icons.logout_rounded,
            'Logout',
            onTap: () async {
              Navigator.pop(context);
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActionItem(IconData icon, String label, {required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: EdgeInsets.all(10.w),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14.r),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFF9A8D4).withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(
              icon,
              color: const Color(0xFFE91E63),
              size: 22.sp,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              color: const Color(0xFFE91E63),
              fontSize: 10.sp,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeleteAccountButton(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20.w),
      child: InkWell(
        onTap: () => _showDeleteAccountDialog(context, ref),
        borderRadius: BorderRadius.circular(12.r),
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 10.h, horizontal: 14.w),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF2F2),
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(color: const Color(0xFFFECACA), width: 1),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.delete_forever_rounded,
                size: 16.sp,
                color: const Color(0xFFDC2626),
              ),
              SizedBox(width: 8.w),
              Text(
                'Delete Account',
                style: GoogleFonts.inter(
                  color: const Color(0xFFDC2626),
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context, WidgetRef ref) {
    final passwordCtrl = TextEditingController();
    bool obscurePassword = true;
    String? errorMessage;
    bool isDeleting = false;

    showDialog(
      context: context,
      barrierDismissible: !isDeleting,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
          insetPadding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: 420.w),
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
                      Icons.delete_forever_rounded,
                      size: 32,
                      color: Color(0xFFDC2626),
                    ),
                  ),
                  SizedBox(height: 16.h),
                  Text(
                    'Delete Account',
                    style: GoogleFonts.poppins(
                      fontSize: 18.sp,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    'To permanently delete your account and all associated salon data, please enter your password to confirm.',
                    style: GoogleFonts.inter(
                      fontSize: 13.sp,
                      color: const Color(0xFF64748B),
                      height: 1.45,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 18.h),
                  TextField(
                    controller: passwordCtrl,
                    obscureText: obscurePassword,
                    enabled: !isDeleting,
                    decoration: InputDecoration(
                      hintText: 'Enter your password',
                      hintStyle: GoogleFonts.inter(fontSize: 13.sp, color: const Color(0xFF94A3B8)),
                      prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFF94A3B8), size: 20),
                      suffixIcon: IconButton(
                        icon: Icon(
                          obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: const Color(0xFF94A3B8),
                          size: 20,
                        ),
                        onPressed: () => setDialogState(() => obscurePassword = !obscurePassword),
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
                        borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.5),
                      ),
                    ),
                  ),
                  if (errorMessage != null) ...[
                    SizedBox(height: 8.h),
                    Row(
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 16),
                        SizedBox(width: 6.w),
                        Expanded(
                          child: Text(
                            errorMessage!,
                            style: GoogleFonts.inter(
                              color: const Color(0xFFDC2626),
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                  SizedBox(height: 24.h),
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 48.h,
                          child: OutlinedButton(
                            onPressed: isDeleting ? null : () => Navigator.pop(ctx),
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
                            onPressed: isDeleting
                                ? null
                                : () async {
                                    final pwd = passwordCtrl.text.trim();
                                    if (pwd.isEmpty) {
                                      setDialogState(() => errorMessage = 'Please enter your password');
                                      return;
                                    }
                                    setDialogState(() {
                                      isDeleting = true;
                                      errorMessage = null;
                                    });
                                    try {
                                      await ref.read(authStateProvider.notifier).deleteAccount(pwd);
                                      if (ctx.mounted) {
                                        Navigator.pop(ctx);
                                      }
                                      if (context.mounted) {
                                        Navigator.pop(context); // Close drawer
                                        context.go('/login');
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(
                                            content: Text('Account permanently deleted.'),
                                            behavior: SnackBarBehavior.floating,
                                            backgroundColor: Color(0xFF0F172A),
                                          ),
                                        );
                                      }
                                    } catch (e) {
                                      setDialogState(() {
                                        isDeleting = false;
                                        errorMessage = e.toString().replaceAll('Exception: ', '');
                                      });
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFDC2626),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                            ),
                            child: isDeleting
                                ? SizedBox(
                                    width: 20.w,
                                    height: 20.w,
                                    child: const CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(
                                    'Delete Account',
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
    );
  }
}

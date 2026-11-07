import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_drawer.dart';
import '../../features/notifications/presentation/providers/notification_provider.dart';
import '../../features/dashboard/presentation/screens/global_search_delegate.dart';

final GlobalKey<ScaffoldState> mainScaffoldKey = GlobalKey<ScaffoldState>();

class MainLayoutScreen extends ConsumerStatefulWidget {
  final Widget child;

  const MainLayoutScreen({super.key, required this.child});

  @override
  ConsumerState<MainLayoutScreen> createState() => _MainLayoutScreenState();
}

class _MainLayoutScreenState extends ConsumerState<MainLayoutScreen> {
  DateTime? currentBackPressTime;

  @override
  Widget build(BuildContext context) {
    // Determine the current index based on the GoRouter location
    final String location = GoRouterState.of(context).uri.path;
    int currentIndex = 0;
    if (location.startsWith('/dashboard')) {
      currentIndex = 0;
    } else if (location.startsWith('/appointments'))
      currentIndex = 1;
    else if (location.startsWith('/customers'))
      currentIndex = 2;
    else if (location.startsWith('/leads'))
      currentIndex = 3;
    else if (location.startsWith('/services'))
      currentIndex = 4;

    final notifications = ref.watch(notificationProvider);
    final unreadCount = notifications.where((n) => !n.isRead).length;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (currentIndex != 0) {
          context.go('/dashboard');
          return;
        }

        final now = DateTime.now();
        if (currentBackPressTime == null ||
            now.difference(currentBackPressTime!) >
                const Duration(seconds: 2)) {
          currentBackPressTime = now;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Press back again to exit',
                style: GoogleFonts.inter(),
              ),
              duration: const Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFF1A1A2E),
            ),
          );
          return;
        }
        SystemNavigator.pop();
      },
      child: Scaffold(
        key: mainScaffoldKey,
        drawer: const AppDrawer(),
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(70),
          child: SafeArea(
            child: Container(
              color: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              child: Row(
                children: [
                  // Hamburger menu
                  GestureDetector(
                    onTap: () {
                      mainScaffoldKey.currentState?.openDrawer();
                    },
                    child: Icon(
                      Icons.menu_rounded,
                      color: Colors.black87,
                      size: 24.sp,
                    ),
                  ),
                  SizedBox(width: 16.w),
                  // SalonTime Logo
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Image.asset('assets/images/icon-dark.png', height: 44.h),
                      SizedBox(width: 8.w),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          RichText(
                            text: TextSpan(
                              style: GoogleFonts.poppins(
                                fontSize: 22.sp,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.5,
                                height: 1.0.h,
                              ),
                              children: const [
                                TextSpan(
                                  text: 'Salon',
                                  style: TextStyle(color: Color(0xFF1A1A2E)),
                                ),
                                TextSpan(
                                  text: 'Time',
                                  style: TextStyle(color: Color(0xFFE91E63)),
                                ),
                              ],
                            ),
                          ),
                          RichText(
                            text: TextSpan(
                              style: GoogleFonts.inter(
                                fontSize: 6.5.sp,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.5,
                                color: Colors.black87,
                              ),
                              children: const [
                                TextSpan(text: 'APPOINTMENTS'),
                                TextSpan(
                                  text: '  |  ',
                                  style: TextStyle(color: Color(0xFFE91E63)),
                                ),
                                TextSpan(text: 'SALON'),
                                TextSpan(
                                  text: '  |  ',
                                  style: TextStyle(color: Color(0xFFE91E63)),
                                ),
                                TextSpan(text: 'CRM'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Search Icon
                  GestureDetector(
                    onTap: () {
                      showSearch(
                        context: context,
                        delegate: GlobalSearchDelegate(ref),
                      );
                    },
                    child: Icon(
                      Icons.search_rounded,
                      color: Colors.black87,
                      size: 24.sp,
                    ),
                  ),
                  SizedBox(width: 16.w),
                  // Notification Bell
                  GestureDetector(
                    onTap: () => context.push('/notifications'),
                    child: Stack(
                      children: [
                        Icon(
                          Icons.notifications_none_rounded,
                          color: Colors.black87,
                          size: 26.sp,
                        ),
                        if (unreadCount > 0)
                          Positioned(
                            right: 0,
                            top: 0,
                            child: Container(
                              padding: EdgeInsets.all(4.w),
                              decoration: const BoxDecoration(
                                color: Color(0xFFE91E63),
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '$unreadCount',
                                style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontSize: 8.sp,
                                  fontWeight: FontWeight.bold,
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
          ),
        ),
        body: widget.child,
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 15,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: SafeArea(
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: 8.0.w,
                vertical: 10.0.h,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(
                    0,
                    Icons.home_rounded,
                    'Home',
                    currentIndex == 0,
                    context,
                  ),
                  _buildNavItem(
                    1,
                    Icons.calendar_month_rounded,
                    'Appts',
                    currentIndex == 1,
                    context,
                  ),
                  _buildNavItem(
                    2,
                    Icons.people_rounded,
                    'Customers',
                    currentIndex == 2,
                    context,
                  ),
                  _buildNavItem(
                    3,
                    Icons.campaign_rounded,
                    'Leads',
                    currentIndex == 3,
                    context,
                  ),
                  _buildNavItem(
                    4,
                    Icons.auto_awesome_mosaic_rounded,
                    'Services',
                    currentIndex == 4,
                    context,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    int index,
    IconData icon,
    String label,
    bool isSelected,
    BuildContext context,
  ) {
    final screenWidth = MediaQuery.of(context).size.width;

    // Responsive Breakpoints
    bool showText = screenWidth >= 360;
    bool textBelow = screenWidth < 700;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (index == 0) {
          context.go('/dashboard');
        } else if (index == 1) {
          context.go('/appointments');
        } else if (index == 2) {
          context.go('/customers');
        } else if (index == 3) {
          context.go('/leads');
        } else if (index == 4) {
          context.go('/services');
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(
          horizontal: textBelow ? (showText ? 8 : 16) : 16,
          vertical: textBelow ? 6 : 10,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFE91E63).withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(textBelow ? 12 : 24),
        ),
        child: textBelow
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    icon,
                    color: isSelected
                        ? const Color(0xFFE91E63)
                        : const Color(0xFF94A3B8),
                    size: 24.sp,
                  ),
                  if (showText) ...[
                    SizedBox(height: 4.h),
                    Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 10.sp,
                        fontWeight: isSelected
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: isSelected
                            ? const Color(0xFFE91E63)
                            : const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ],
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    icon,
                    color: isSelected
                        ? const Color(0xFFE91E63)
                        : const Color(0xFF94A3B8),
                    size: 24.sp,
                  ),
                  if (showText) ...[
                    SizedBox(width: 8.w),
                    Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 13.sp,
                        fontWeight: isSelected
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: isSelected
                            ? const Color(0xFFE91E63)
                            : const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }
}

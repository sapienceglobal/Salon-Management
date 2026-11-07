import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/network/dio_client.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _progressAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    );

    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    _animationController.forward();

    _checkAuth();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _checkAuth() async {
    // Wait for the animation to finish
    await Future.delayed(const Duration(milliseconds: 3200));

    final storage = ref.read(secureStorageProvider);
    final token = await safeStorageRead(storage, 'auth_token');

    if (mounted) {
      if (token != null && token.isNotEmpty) {
        final role = await safeStorageRead(storage, 'user_role');
        CurrentUserSession.currentRole = role;
        ref.read(userRoleProvider.notifier).state = role;
        ref.read(inMemoryTokenProvider.notifier).state = token;
        context.go('/dashboard');
      } else {
        context.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final sw = MediaQuery.of(context).size.width;
    final sh = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Background top-left abstract shapes
          Positioned(
            top: -60,
            left: -40,
            child: Container(
              width: 180.w,
              height: 180.h,
              decoration: BoxDecoration(
                color: const Color(0xFFFF4081).withOpacity(0.15),
                borderRadius: BorderRadius.circular(100.r),
              ),
            ),
          ),
          Positioned(
            top: -120,
            left: -100,
            child: Container(
              width: 300.w,
              height: 300.h,
              decoration: BoxDecoration(
                color: const Color(0xFFF48FB1).withOpacity(0.2),
                borderRadius: BorderRadius.circular(200.r),
              ),
            ),
          ),

          // Background right side pink curved blob
          Positioned(
            top: sh * 0.15,
            right: -sw * 0.4,
            child: Container(
              width: sw * 1.2,
              height: sh * 0.65,
              decoration: BoxDecoration(
                color: Color(0xFFFDE4EC), // Very light pink
                borderRadius: BorderRadius.horizontal(
                  left: Radius.circular(500.r),
                ),
              ),
            ),
          ),

          // Bottom right abstract shapes
          Positioned(
            bottom: -50,
            right: -50,
            child: Container(
              width: 200.w,
              height: 200.h,
              decoration: BoxDecoration(
                color: const Color(0xFFFF4081).withOpacity(0.1),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(200.r),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -30,
            right: 40,
            child: Transform.rotate(
              angle: 0.5,
              child: Container(
                width: 100.w,
                height: 100.h,
                decoration: BoxDecoration(
                  color: const Color(0xFFF48FB1).withOpacity(0.25),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(100.r),
                    bottomRight: Radius.circular(100.r),
                  ),
                ),
              ),
            ),
          ),

          // Main Layout Content
          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                children: [
                  SizedBox(height: 20.h),

                  // --- LOGO SECTION ---
                  Center(
                    child: Container(
                      height: (sh * 0.12).clamp(60.0, 90.0),
                      padding: EdgeInsets.symmetric(horizontal: 20.w),
                      child: FittedBox(
                        fit: BoxFit.contain,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Image.asset(
                              'assets/images/icon-transparent.png',
                              height: 85.h,
                            ),
                            SizedBox(width: 8.w),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                RichText(
                                  text: TextSpan(
                                    style: GoogleFonts.poppins(
                                      fontSize: 46.sp,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -1.5,
                                      height: 1.0.h,
                                    ),
                                    children: const [
                                      TextSpan(
                                        text: 'Salon',
                                        style: TextStyle(
                                          color: Color(0xFF1A1A2E),
                                        ),
                                      ),
                                      TextSpan(
                                        text: 'Time',
                                        style: TextStyle(
                                          color: Color(0xFFE91E63),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(height: 2.h),
                                RichText(
                                  text: TextSpan(
                                    style: GoogleFonts.inter(
                                      fontSize: 7.2.sp,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 1.3,
                                      color: Colors.black87,
                                    ),
                                    children: const [
                                      TextSpan(text: 'APPOINTMENTS'),
                                      TextSpan(
                                        text: '   |   ',
                                        style: TextStyle(
                                          color: Color(0xFFE91E63),
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      TextSpan(text: 'CRM'),
                                      TextSpan(
                                        text: '   |   ',
                                        style: TextStyle(
                                          color: Color(0xFFE91E63),
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      TextSpan(text: 'SALON MANAGEMENT'),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Middle Section (Model & Typography)
                  Expanded(
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        // The Model image on the right
                        Positioned(
                          right: -30,
                          bottom: 0,
                          top: 40,
                          child: ShaderMask(
                            shaderCallback: (rect) {
                              return const LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.black,
                                  Colors.black,
                                  Colors.transparent,
                                ],
                                stops: [0.0, 0.8, 1.0],
                              ).createShader(rect);
                            },
                            blendMode: BlendMode.dstIn,
                            child: ClipRRect(
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(300.r),
                                bottomLeft: Radius.circular(300.r),
                              ),
                              child: Image.asset(
                                'assets/images/splash_model.jpg',
                                width: sw * 0.75,
                                fit: BoxFit.cover,
                                alignment: Alignment.topCenter,
                              ),
                            ),
                          ),
                        ),

                        // Typography on the left
                        Positioned(
                          left: 28,
                          top: 20,
                          bottom: 20,
                          child: SizedBox(
                            width: sw * 0.55,
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Manage',
                                    style: GoogleFonts.inter(
                                      fontSize: 28.sp,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  Text(
                                    'Beauty Business',
                                    style: GoogleFonts.inter(
                                      fontSize: 28.sp,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.black,
                                    ),
                                  ),
                                  Transform.translate(
                                    offset: const Offset(0, -10),
                                    child: Text(
                                      'Smarter',
                                      style: GoogleFonts.dancingScript(
                                        fontSize: 60.sp,
                                        color: const Color(0xFFE91E63),
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  SizedBox(height: 16.h),
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 1.5.w,
                                        height: 120.h,
                                        color: Colors.black45,
                                        margin: EdgeInsets.only(
                                          left: 10.w,
                                          right: 20.w,
                                          top: 4.h,
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          _buildSpacedText('B O O K'),
                                          SizedBox(height: 16.h),
                                          _buildSpacedText('M A N A G E'),
                                          SizedBox(height: 16.h),
                                          _buildSpacedText('G R O W'),
                                          SizedBox(height: 16.h),
                                          Container(
                                            width: 25.w,
                                            height: 2.5.h,
                                            color: const Color(0xFFE91E63),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Bottom Section
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.only(
                      left: 20.w,
                      right: 20.w,
                      top: 20.h,
                      bottom: 24.h,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.white.withOpacity(0.9),
                          blurRadius: 40,
                          spreadRadius: 20,
                          offset: const Offset(0, -20),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // 4 Icons Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildBottomIcon(
                              Icons.calendar_today_rounded,
                              'Appointments',
                            ),
                            _buildBottomIcon(
                              Icons.people_alt_rounded,
                              'Customers',
                            ),
                            _buildBottomIcon(
                              Icons.bar_chart_rounded,
                              'Analytics',
                            ),
                            _buildBottomIcon(
                              Icons.settings_suggest_rounded,
                              'Complete\nManagement',
                            ),
                          ],
                        ),
                        SizedBox(height: 36.h),

                        // Progress Bar
                        AnimatedBuilder(
                          animation: _progressAnimation,
                          builder: (context, child) {
                            return Container(
                              width: sw * 0.65,
                              height: 8.h,
                              decoration: BoxDecoration(
                                color: const Color(0xFFFDE4EC),
                                borderRadius: BorderRadius.circular(4.r),
                              ),
                              child: FractionallySizedBox(
                                alignment: Alignment.centerLeft,
                                widthFactor: _progressAnimation.value,
                                child: Container(
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        Color(0xFFF06292),
                                        Color(0xFFE91E63),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(4.r),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                        SizedBox(height: 12.h),
                        Text(
                          'Loading...',
                          style: GoogleFonts.inter(
                            fontSize: 13.sp,
                            color: Colors.black54,
                            letterSpacing: 1.0,
                          ),
                        ),
                        SizedBox(height: 32.h),

                        // Footer Text
                        Text(
                          'BEAUTY BUSINESS. A BRIGHTER TOMORROW.',
                          style: GoogleFonts.inter(
                            fontSize: 10.sp,
                            letterSpacing: 2.0,
                            fontWeight: FontWeight.w700,
                            color: Colors.black87,
                          ),
                        ),
                        SizedBox(height: 10.h),
                        Container(
                          width: 40.w,
                          height: 2.5.h,
                          color: const Color(0xFFF06292),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpacedText(String text) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 13.sp,
        fontWeight: FontWeight.w600,
        letterSpacing: 5.0,
        color: Colors.black87,
      ),
    );
  }

  Widget _buildBottomIcon(IconData icon, String label) {
    return Expanded(
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF0F5), // very soft pink background
              borderRadius: BorderRadius.circular(16.r),
              border: Border.all(
                color: const Color(0xFFF8BBD0),
                width: 1.5.w,
              ), // pink outline
            ),
            child: Icon(icon, color: const Color(0xFFE91E63), size: 30.sp),
          ),
          SizedBox(height: 12.h),
          Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 11.sp,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
              height: 1.3.h,
            ),
          ),
        ],
      ),
    );
  }
}

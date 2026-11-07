import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _rememberMe = false;
  bool _isPasswordVisible = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final success = await ref
          .read(authStateProvider.notifier)
          .login(
            _emailController.text.trim(),
            _passwordController.text,
            _rememberMe,
          );

      if (success && mounted) {
        context.go('/dashboard');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final isLoading = authState is AsyncLoading;
    final sw = MediaQuery.of(context).size.width;
    final sh = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // 1. Background Image (Salon interior on the right)
          Positioned(
            right: 0,
            top: 0,
            bottom: 0,
            width: sw * 0.7,
            child: IgnorePointer(
              child: ShaderMask(
                shaderCallback: (rect) {
                  return const LinearGradient(
                    begin: Alignment.centerRight,
                    end: Alignment.centerLeft,
                    colors: [Colors.black, Colors.black, Colors.transparent],
                    stops: [0.0, 0.5, 1.0],
                  ).createShader(rect);
                },
                blendMode: BlendMode.dstIn,
                child: Image.asset(
                  'assets/images/login_bg.jpg',
                  fit: BoxFit.cover,
                  alignment: Alignment.centerLeft,
                ),
              ),
            ),
          ),

          // 2. White Fade Overlay (to make text readable)
          Positioned.fill(
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      Colors.white,
                      Colors.white.withOpacity(0.95),
                      Colors.white.withOpacity(0.7),
                      Colors.white.withOpacity(0.0),
                    ],
                    stops: const [0.0, 0.4, 0.7, 1.0],
                  ),
                ),
              ),
            ),
          ),

          // 3. Scrollable Content
          SafeArea(
            child: SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight:
                      sh -
                      MediaQuery.of(context).padding.top -
                      MediaQuery.of(context).padding.bottom,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Spacer(flex: 2), // Top flexible space
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
                                  'assets/images/icon-dark.png',
                                  height: 85.h,
                                ),

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

                      SizedBox(height: 30.h),
                      Container(
                        width: 40.w,
                        height: 2.h,
                        color: const Color(0xFFE91E63),
                      ),
                      SizedBox(height: 16.h),

                      // --- WELCOME TEXT ---
                      RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: GoogleFonts.poppins(
                            fontSize: 26.sp,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1A1A2E),
                          ),
                          children: const [
                            TextSpan(text: 'Glad to See '),
                            TextSpan(
                              text: 'You Again!',
                              style: TextStyle(color: Color(0xFFE91E63)),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: 8.h),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 40.w),
                        child: Text(
                          'Login to manage your salon, clients and\nappointments all in one place.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 12.sp,
                            color: Colors.grey.shade700,
                            height: 1.5.h,
                          ),
                        ),
                      ),

                      SizedBox(height: 30.h),

                      // --- LOGIN FORM ---
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 28.w),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              // Username Field
                              Container(
                                decoration: BoxDecoration(
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.grey.withOpacity(0.05),
                                      blurRadius: 15,
                                      offset: const Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: TextFormField(
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  onTapOutside: (event) => FocusManager
                                      .instance
                                      .primaryFocus
                                      ?.unfocus(),
                                  onTap: () {
                                    if (_emailController.selection.baseOffset !=
                                        _emailController
                                            .selection
                                            .extentOffset) {
                                      _emailController.selection =
                                          TextSelection.collapsed(
                                            offset: _emailController
                                                .selection
                                                .extentOffset,
                                          );
                                    }
                                  },
                                  style: GoogleFonts.inter(fontSize: 14.sp),
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: Colors.white.withOpacity(0.9),
                                    hintText: 'Username',
                                    hintStyle: GoogleFonts.inter(
                                      color: Colors.grey.shade400,
                                      fontSize: 14.sp,
                                    ),
                                    prefixIcon: Icon(
                                      Icons.person_outline,
                                      color: Color(0xFFE91E63),
                                      size: 22.sp,
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16.r),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade200,
                                        width: 1.5.w,
                                      ),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16.r),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade200,
                                        width: 1.5.w,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16.r),
                                      borderSide: BorderSide(
                                        color: Color(0xFFE91E63),
                                        width: 1.5.w,
                                      ),
                                    ),
                                    contentPadding: EdgeInsets.symmetric(
                                      horizontal: 20.w,
                                      vertical: 18.h,
                                    ),
                                  ),
                                  validator: (value) =>
                                      (value == null || value.isEmpty)
                                      ? 'Please enter your username'
                                      : null,
                                ),
                              ),
                              SizedBox(height: 16.h),

                              // Password Field
                              Container(
                                decoration: BoxDecoration(
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.grey.withOpacity(0.05),
                                      blurRadius: 15,
                                      offset: const Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: TextFormField(
                                  controller: _passwordController,
                                  obscureText: !_isPasswordVisible,
                                  onTapOutside: (event) => FocusManager
                                      .instance
                                      .primaryFocus
                                      ?.unfocus(),
                                  onTap: () {
                                    if (_passwordController
                                            .selection
                                            .baseOffset !=
                                        _passwordController
                                            .selection
                                            .extentOffset) {
                                      _passwordController.selection =
                                          TextSelection.collapsed(
                                            offset: _passwordController
                                                .selection
                                                .extentOffset,
                                          );
                                    }
                                  },
                                  style: GoogleFonts.inter(fontSize: 14.sp),
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: Colors.white.withOpacity(0.9),
                                    hintText: 'Password',
                                    hintStyle: GoogleFonts.inter(
                                      color: Colors.grey.shade400,
                                      fontSize: 14.sp,
                                    ),
                                    prefixIcon: Icon(
                                      Icons.lock_outline,
                                      color: Color(0xFFE91E63),
                                      size: 22.sp,
                                    ),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _isPasswordVisible
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                        color: Colors.black54,
                                        size: 20.sp,
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _isPasswordVisible =
                                              !_isPasswordVisible;
                                        });
                                      },
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16.r),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade200,
                                        width: 1.5.w,
                                      ),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16.r),
                                      borderSide: BorderSide(
                                        color: Colors.grey.shade200,
                                        width: 1.5.w,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16.r),
                                      borderSide: BorderSide(
                                        color: Color(0xFFE91E63),
                                        width: 1.5.w,
                                      ),
                                    ),
                                    contentPadding: EdgeInsets.symmetric(
                                      horizontal: 20.w,
                                      vertical: 18.h,
                                    ),
                                  ),
                                  validator: (value) =>
                                      (value == null || value.isEmpty)
                                      ? 'Please enter your password'
                                      : null,
                                ),
                              ),
                              SizedBox(height: 16.h),

                              // Remember Me & Forgot Password
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _rememberMe = !_rememberMe;
                                      });
                                    },
                                    child: Row(
                                      children: [
                                        SizedBox(
                                          width: 20.w,
                                          height: 20.h,
                                          child: Checkbox(
                                            value: _rememberMe,
                                            onChanged: (value) {
                                              setState(() {
                                                _rememberMe = value ?? false;
                                              });
                                            },
                                            activeColor: const Color(
                                              0xFFE91E63,
                                            ),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(4.r),
                                            ),
                                            side: BorderSide(
                                              color: Colors.grey.shade400,
                                              width: 1.5.w,
                                            ),
                                          ),
                                        ),
                                        SizedBox(width: 8.w),
                                        Text(
                                          'Remember me',
                                          style: GoogleFonts.inter(
                                            fontSize: 12.sp,
                                            color: Colors.black87,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      context.push('/forgot-password');
                                    },
                                    child: Text(
                                      'Forgot Password?',
                                      style: GoogleFonts.inter(
                                        fontSize: 12.sp,
                                        color: const Color(0xFFE91E63),
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 30.h),

                              // Error message
                              if (authState is AsyncError)
                                Padding(
                                  padding: EdgeInsets.only(bottom: 16.h),
                                  child: Container(
                                    padding: EdgeInsets.all(12.w),
                                    decoration: BoxDecoration(
                                      color: Colors.red.shade50,
                                      borderRadius: BorderRadius.circular(12.r),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.error_outline,
                                          color: Colors.red,
                                          size: 20.sp,
                                        ),
                                        SizedBox(width: 8.w),
                                        Expanded(
                                          child: Text(
                                            authState.error
                                                .toString()
                                                .replaceAll('Exception: ', ''),
                                            style: GoogleFonts.inter(
                                              color: Colors.red,
                                              fontSize: 12.sp,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),

                              // Login Button
                              Container(
                                width: double.infinity,
                                height: 55.h,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFFE91E63),
                                      Color(0xFFD81B60),
                                    ],
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                  ),
                                  borderRadius: BorderRadius.circular(28.r),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(
                                        0xFFE91E63,
                                      ).withOpacity(0.3),
                                      blurRadius: 15,
                                      offset: const Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: ElevatedButton(
                                  onPressed: isLoading ? null : _handleLogin,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.transparent,
                                    shadowColor: Colors.transparent,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(28.r),
                                    ),
                                  ),
                                  child: isLoading
                                      ? SizedBox(
                                          height: 24.h,
                                          width: 24.w,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2.5,
                                          ),
                                        )
                                      : Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              'Login',
                                              style: GoogleFonts.inter(
                                                fontSize: 16.sp,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.white,
                                              ),
                                            ),
                                            SizedBox(width: 8.w),
                                            Icon(
                                              Icons.arrow_forward,
                                              color: Colors.white,
                                              size: 20.sp,
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      if (sh > 650) ...[
                        const Spacer(flex: 3), // Bottom flexible space
                        // --- BOTTOM ICONS ---
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 20.w),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              _buildBottomIcon(
                                Icons.calendar_today_rounded,
                                'Manage\nAppointments',
                              ),
                              _buildVerticalDivider(),
                              _buildBottomIcon(
                                Icons.people_alt_rounded,
                                'Grow\nYour Clients',
                              ),
                              _buildVerticalDivider(),
                              _buildBottomIcon(
                                Icons.bar_chart_rounded,
                                'Track\nYour Business',
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 30.h),

                        // --- FOOTER TEXT ---
                        Padding(
                          padding: EdgeInsets.only(
                            left: 24.w,
                            right: 24.w,
                            bottom: 20.h,
                          ),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 30.w,
                                  height: 2.h,
                                  color: const Color(0xFFE91E63),
                                ),
                                SizedBox(height: 8.h),
                                Text(
                                  'MORE THAN A SOFTWARE\nA BRIGHTER TOMORROW',
                                  style: GoogleFonts.inter(
                                    fontSize: 8.sp,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 2.5,
                                    color: Colors.black87,
                                    height: 1.5.h,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ] else ...[
                        SizedBox(
                          height: sh * 0.04,
                        ), // Just enough padding below login button for mini screens
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerticalDivider() {
    return Container(height: 30.h, width: 1.w, color: Colors.grey.shade300);
  }

  Widget _buildBottomIcon(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.all(10.w),
          decoration: const BoxDecoration(
            color: Color(0xFFFFF0F5),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: const Color(0xFFE91E63), size: 18.sp),
        ),
        SizedBox(height: 8.h),
        Text(
          label,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 9.sp,
            color: Colors.black87,
            fontWeight: FontWeight.w500,
            height: 1.3.h,
          ),
        ),
      ],
    );
  }
}

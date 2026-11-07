import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_fonts/google_fonts.dart';

class PremiumStatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color mainColor;
  final Color bgColor;
  final String? subtext;
  final bool? isUp;
  final VoidCallback? onTap;
  final double? width;

  const PremiumStatCard({
    Key? key,
    required this.title,
    required this.value,
    required this.icon,
    required this.mainColor,
    required this.bgColor,
    this.subtext,
    this.isUp,
    this.onTap,
    this.width,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: width?.w ?? 160.w,
        margin: EdgeInsets.only(right: 12.w),
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20.r),
          boxShadow: [
            BoxShadow(
              color: mainColor.withOpacity(0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
          border: Border.all(color: mainColor.withOpacity(0.1), width: 1.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 13.sp,
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w600,
                      height: 1.2,
                    ),
                  ),
                ),
                Container(
                  padding: EdgeInsets.all(10.w),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Icon(icon, color: mainColor, size: 22.sp),
                ),
              ],
            ),
            SizedBox(height: 16.h),
            Text(
              value,
              style: GoogleFonts.poppins(
                fontSize: 24.sp,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1A1A2E),
                height: 1.1,
              ),
            ),
            if (subtext != null) ...[
              SizedBox(height: 8.h),
              Row(
                children: [
                  if (isUp != null)
                    Container(
                      padding: EdgeInsets.all(4.w),
                      decoration: BoxDecoration(
                        color: isUp!
                            ? const Color(0xFFECFDF5)
                            : const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(6.r),
                      ),
                      child: Icon(
                        isUp!
                            ? Icons.trending_up_rounded
                            : Icons.trending_down_rounded,
                        color: isUp!
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444),
                        size: 12.sp,
                      ),
                    ),
                  if (isUp != null) SizedBox(width: 6.w),
                  Text(
                    subtext!,
                    style: GoogleFonts.inter(
                      fontSize: 11.sp,
                      color: const Color(0xFF94A3B8),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

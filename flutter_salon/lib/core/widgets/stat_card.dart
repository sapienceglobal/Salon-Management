import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_salon/core/theme/app_colors.dart';

class StatCardData {
  final String title;
  final String value;
  final String? subtitle;
  final IconData? icon;
  final Color backgroundColor;

  StatCardData({
    required this.title,
    required this.value,
    this.subtitle,
    this.icon,
    required this.backgroundColor,
  });
}

class StatCard extends StatelessWidget {
  final StatCardData data;

  const StatCard({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140.w,
      margin: EdgeInsets.only(right: 12.w),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.01),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (data.icon != null) ...[
            Container(
              padding: EdgeInsets.all(8.w),
              decoration: BoxDecoration(
                color: data.backgroundColor.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(data.icon, color: data.backgroundColor, size: 20.sp),
            ),
            SizedBox(height: 12.h),
          ],
          Text(
            data.value,
            style: GoogleFonts.poppins(
              fontSize: 24.sp,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1A1A2E),
              height: 1.h,
            ),
          ),
          SizedBox(height: 4.h),
          Text(
            data.title,
            style: GoogleFonts.inter(
              color: const Color(0xFF64748B),
              fontSize: 12.sp,
            ),
          ),
          if (data.subtitle != null) ...[
            SizedBox(height: 4.h),
            Text(
              data.subtitle!,
              style: GoogleFonts.inter(
                color: AppColors.textSecondary.withOpacity(0.7),
                fontSize: 11.sp,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class StatCardRow extends StatelessWidget {
  final List<StatCardData> cards;

  const StatCardRow({super.key, required this.cards});

  @override
  Widget build(BuildContext context) {
    if (cards.isEmpty) return SizedBox.shrink();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
      child: Row(children: cards.map((c) => StatCard(data: c)).toList()),
    );
  }
}

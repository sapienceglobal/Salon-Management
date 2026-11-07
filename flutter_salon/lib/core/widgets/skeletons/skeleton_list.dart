import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'skeleton_item.dart';

class SkeletonList extends StatelessWidget {
  final int itemCount;

  const SkeletonList({super.key, this.itemCount = 8});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemCount: itemCount,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.all(16.w),
      separatorBuilder: (context, index) => Divider(height: 32.h),
      itemBuilder: (context, index) {
        return Row(
          children: [
            SkeletonItem(width: 48.w, height: 48.h, shape: BoxShape.circle),
            SizedBox(width: 16.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonItem(width: double.infinity, height: 16.h),
                  SizedBox(height: 8.h),
                  SkeletonItem(width: 120.w, height: 14.h),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

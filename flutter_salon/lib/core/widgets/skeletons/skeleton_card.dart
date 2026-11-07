import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'skeleton_item.dart';

class SkeletonCard extends StatelessWidget {
  final double width;
  final double height;
  final int count;
  final bool horizontal;

  const SkeletonCard({
    super.key,
    this.width = double.infinity,
    this.height = 100,
    this.count = 1,
    this.horizontal = false,
  });

  @override
  Widget build(BuildContext context) {
    List<Widget> children = List.generate(
      count,
      (index) => SkeletonItem(
        width: width,
        height: height,
        margin: horizontal
            ? EdgeInsets.only(right: 16.w)
            : EdgeInsets.only(bottom: 16.h),
      ),
    );

    if (horizontal) {
      return SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: children),
      );
    }
    return Column(children: children);
  }
}

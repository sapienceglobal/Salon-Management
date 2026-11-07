import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_fonts/google_fonts.dart';

class CustomDropdownField<T> extends FormField<T> {
  CustomDropdownField({
    Key? key,
    required String hintText,
    required List<DropdownMenuItem<T>> items,
    required T? value,
    required void Function(T?) onChanged,
    String? Function(T?)? validator,
    IconData? prefixIcon,
  }) : super(
          key: key,
          initialValue: value,
          validator: validator,
          builder: (FormFieldState<T> state) {
            Widget? displayWidget;
            if (state.value != null) {
              final selectedItem = items.firstWhere(
                (item) => item.value == state.value,
                orElse: () => DropdownMenuItem<T>(
                  value: state.value as T,
                  child: Text(hintText),
                ),
              );
              displayWidget = selectedItem.child;
            } else {
              displayWidget = Text(
                hintText,
                style: GoogleFonts.inter(
                  color: const Color(0xFF94A3B8),
                  fontSize: 14.sp,
                ),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                InkWell(
                  onTap: () {
                    FocusScope.of(state.context).unfocus();
                    FocusManager.instance.primaryFocus?.unfocus();
                    // Show premium modal bottom sheet
                    showModalBottomSheet(
                      context: state.context,
                      backgroundColor: Colors.transparent,
                      isScrollControlled: true,
                      builder: (context) {
                        return Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
                          ),
                          padding: EdgeInsets.only(
                            top: 12.h,
                            bottom: 24.h + MediaQuery.of(context).padding.bottom,
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Center(
                                child: Container(
                                  width: 40.w,
                                  height: 4.h,
                                  margin: EdgeInsets.only(bottom: 16.h),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE2E8F0),
                                    borderRadius: BorderRadius.circular(2.r),
                                  ),
                                ),
                              ),
                              Padding(
                                padding: EdgeInsets.symmetric(horizontal: 20.w),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: EdgeInsets.all(8.w),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFDF2F8),
                                        borderRadius: BorderRadius.circular(10.r),
                                      ),
                                      child: Icon(
                                        prefixIcon ?? Icons.tune_rounded,
                                        color: const Color(0xFFE91E63),
                                        size: 18.sp,
                                      ),
                                    ),
                                    SizedBox(width: 12.w),
                                    Expanded(
                                      child: Text(
                                        'Select $hintText',
                                        style: GoogleFonts.poppins(
                                          fontSize: 16.sp,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF0F172A),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    InkWell(
                                      onTap: () {
                                        FocusScope.of(state.context).unfocus();
                                        FocusManager.instance.primaryFocus?.unfocus();
                                        Navigator.pop(context);
                                      },
                                      borderRadius: BorderRadius.circular(20.r),
                                      child: Container(
                                        padding: EdgeInsets.all(6.w),
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFF1F5F9),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          Icons.close_rounded,
                                          color: const Color(0xFF64748B),
                                          size: 16.sp,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(height: 16.h),
                              Flexible(
                                child: ListView.builder(
                                  shrinkWrap: true,
                                  itemCount: items.length,
                                  itemBuilder: (context, index) {
                                    final item = items[index];
                                    final isSelected = item.value == state.value;
                                    return InkWell(
                                      onTap: () {
                                        FocusScope.of(state.context).unfocus();
                                        FocusManager.instance.primaryFocus?.unfocus();
                                        Navigator.pop(context);
                                        state.didChange(item.value);
                                        onChanged(item.value);
                                      },
                                      child: Container(
                                        padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 16.h),
                                        color: isSelected ? const Color(0xFFFDF2F8) : Colors.transparent,
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: DefaultTextStyle(
                                                style: GoogleFonts.inter(
                                                  fontSize: 15.sp,
                                                  color: isSelected ? const Color(0xFFE91E63) : const Color(0xFF334155),
                                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                                                ),
                                                child: item.child,
                                              ),
                                            ),
                                            if (isSelected)
                                              Icon(Icons.check_circle_rounded, color: const Color(0xFFE91E63), size: 20.sp),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    );
                  },
                  borderRadius: BorderRadius.circular(14.r),
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 14.w,
                      vertical: prefixIcon != null ? 10.h : 14.h,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14.r),
                      border: Border.all(
                        color: state.hasError ? const Color(0xFFEF4444) : const Color(0xFFF1E4E8),
                        width: 1.2,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (prefixIcon != null) ...[
                          Container(
                            padding: EdgeInsets.all(8.w),
                            margin: EdgeInsets.only(right: 12.w),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFDF2F8),
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                            child: Icon(
                              prefixIcon,
                              color: const Color(0xFFE91E63),
                              size: 18.sp,
                            ),
                          ),
                        ],
                        Expanded(
                          child: DefaultTextStyle(
                            style: GoogleFonts.inter(
                              color: state.value != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                              fontSize: 14.sp,
                              fontWeight: state.value != null ? FontWeight.w500 : FontWeight.normal,
                            ),
                            child: displayWidget,
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.all(4.w),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.keyboard_arrow_down_rounded,
                            color: const Color(0xFF64748B),
                            size: 18.sp,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (state.hasError)
                  Padding(
                    padding: EdgeInsets.only(top: 8.h, left: 16.w),
                    child: Text(
                      state.errorText!,
                      style: GoogleFonts.inter(
                        color: const Color(0xFFEF4444),
                        fontSize: 12.sp,
                      ),
                    ),
                  ),
              ],
            );
          },
        );
}

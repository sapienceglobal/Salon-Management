import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_fonts/google_fonts.dart';

/// Represents a field in a form to check for errors and scroll to if invalid.
class FormFieldTarget {
  final dynamic target; // FocusNode or GlobalKey or BuildContext
  final bool Function() isInvalid;
  final String? errorMessage;

  FormFieldTarget({
    required this.target,
    required this.isInvalid,
    this.errorMessage,
  });
}

class FormScrollHelper {
  /// Unfocuses any active keyboard across the app safely.
  static void unfocus() {
    FocusManager.instance.primaryFocus?.unfocus();
  }

  /// Smoothly scrolls to target FocusNode or GlobalKey and optionally focuses it.
  static void scrollTo(dynamic target, {double alignment = 0.12}) {
    BuildContext? ctx;
    FocusNode? focusNode;

    if (target is FocusNode) {
      focusNode = target;
      ctx = target.context;
    } else if (target is GlobalKey) {
      ctx = target.currentContext;
    } else if (target is BuildContext) {
      ctx = target;
    }

    if (ctx != null) {
      Scrollable.ensureVisible(
        ctx,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
        alignment: alignment,
      );
    }

    if (focusNode != null) {
      Future.delayed(const Duration(milliseconds: 150), () {
        if (focusNode?.canRequestFocus == true) {
          focusNode?.requestFocus();
        }
      });
    }
  }

  /// Validates the form and if invalid, auto-scrolls and focuses the first invalid field.
  /// Also displays a clean floating error banner.
  static bool validateAndScroll({
    required BuildContext context,
    required GlobalKey<FormState> formKey,
    required List<FormFieldTarget> fields,
  }) {
    unfocus();
    final isFormValid = formKey.currentState?.validate() ?? true;

    for (final field in fields) {
      if (field.isInvalid()) {
        scrollTo(field.target);

        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
                SizedBox(width: 10.w),
                Expanded(
                  child: Text(
                    field.errorMessage ?? 'Please check the highlighted field above',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13.sp),
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 3),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
          ),
        );
        return false;
      }
    }

    // If a validator failed that was not listed explicitly, return false
    return isFormValid;
  }
}

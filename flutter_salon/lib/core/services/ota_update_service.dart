import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

/// Official Google Play Store Update Helper.
/// All app updates are officially handled by Google Play Store.
/// 3rd party GitHub checking and custom download popups have been removed.
class OtaUpdateService {
  /// Opens the official app page on Google Play Store
  static Future<void> openPlayStore([String? customPackageName]) async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final pkg = customPackageName ?? packageInfo.packageName;
      final marketUri = Uri.parse('market://details?id=$pkg');
      final webUri = Uri.parse('https://play.google.com/store/apps/details?id=$pkg');

      final launched = await launchUrl(
        marketUri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      try {
        final packageInfo = await PackageInfo.fromPlatform();
        final pkg = customPackageName ?? packageInfo.packageName;
        final webUri = Uri.parse('https://play.google.com/store/apps/details?id=$pkg');
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      } catch (e) {
        debugPrint('Failed to open Google Play Store: $e');
      }
    }
  }

  /// Manually trigger check by directly redirecting user to Google Play Store.
  /// (Automatic updates are managed directly by Google Play Store in the background).
  Future<void> checkForUpdate(
    BuildContext context, {
    bool isManual = false,
  }) async {
    if (isManual) {
      await openPlayStore();
    }
  }
}

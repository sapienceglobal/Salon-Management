import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/general_settings_tab.dart';
import '../widgets/operations_tab.dart';
import '../widgets/billing_tax_tab.dart';
import '../widgets/users_tab.dart';
import '../widgets/commissions_tab.dart';
import '../widgets/rooms_tab.dart';
import '../widgets/notifications_tab.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<String> _tabs = [
    'General',
    'Operations',
    'Billing & Tax',
    'Staff & Roles',
    'Commissions',
    'Service Rooms',
    'Notifications',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(userRoleProvider);
    if (role != 'admin' && role != 'super_admin') {
      return Scaffold(
        appBar: AppBar(title: Text('Settings')),
        body: Center(child: Text('Unauthorized access. Admin only.')),
      );
    }

    final settingsAsync = ref.watch(settingsDataProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Settings',
          style: GoogleFonts.playfairDisplay(
            fontSize: 28.sp,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: false,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: settingsAsync.when(
        loading: () => Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Text(
            'Error: $err',
            style: GoogleFonts.inter(color: AppColors.error),
          ),
        ),
        data: (data) {
          final business = data['business'] ?? {};
          final settings = data['settings'] ?? {};

          return TabBarView(
            controller: _tabController,
            children: [
              GeneralSettingsTab(business: business),
              OperationsTab(settings: settings),
              BillingTaxTab(settings: settings),
              const UsersTab(),
              const CommissionsTab(),
              const RoomsTab(),
              const NotificationsTab(),
            ],
          );
        },
      ),
    );
  }
}

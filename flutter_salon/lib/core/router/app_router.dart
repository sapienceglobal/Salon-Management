import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/appointments/presentation/screens/appointments_list_screen.dart';
import '../../features/appointments/presentation/screens/appointment_detail_screen.dart';
import '../../features/appointments/presentation/screens/book_appointment_screen.dart';
import '../../features/customers/presentation/screens/customers_list_screen.dart';
import '../../features/customers/presentation/screens/add_edit_customer_screen.dart';
import '../../features/customers/presentation/screens/customer_profile_screen.dart';
import '../../features/staff/presentation/screens/staff_list_screen.dart';
import '../../features/staff/presentation/screens/add_edit_staff_screen.dart';
import '../../features/staff/presentation/screens/staff_attendance_screen.dart';
import '../../features/staff/presentation/screens/staff_profile_screen.dart';
import '../../features/packages/presentation/screens/catalog_screen.dart';
import '../../features/billing/presentation/screens/payment_screen.dart';
import '../../features/crm/presentation/screens/leads_screen.dart';
import '../../features/crm/presentation/screens/add_edit_lead_screen.dart';
import '../../features/crm/presentation/screens/campaigns_screen.dart';
import '../../features/crm/presentation/screens/feedback_screen.dart';
import '../../features/services/presentation/screens/services_list_screen.dart';
import '../../features/services/presentation/screens/add_edit_service_screen.dart';
import '../../features/billing/presentation/screens/checkout_screen.dart';
import '../../features/billing/presentation/screens/drafts_list_screen.dart';
import '../../features/billing/presentation/screens/invoice_history_screen.dart';
import '../../features/billing/presentation/screens/pos_billing_screen.dart';
import '../../features/inventory/presentation/screens/inventory_screen.dart';
import '../../features/inventory/presentation/screens/add_edit_product_screen.dart';
import '../../features/expenses/presentation/screens/expenses_list_screen.dart';
import '../../features/expenses/presentation/screens/add_expense_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/reports/presentation/screens/reports_screen.dart';
import '../../features/wallet/presentation/screens/wallet_screen.dart';

import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../widgets/main_layout_screen.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>(
  debugLabel: 'root',
);
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>(
  debugLabel: 'shell',
);
final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

final goRouter = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/splash',
  redirect: (context, state) {
    final path = state.uri.path;
    if (CurrentUserSession.isManager) {
      final isRestricted = path == '/pos' ||
          path.startsWith('/pos/') ||
          path == '/checkout' ||
          path.startsWith('/checkout/') ||
          path == '/invoices' ||
          path.startsWith('/invoices/') ||
          path == '/drafts' ||
          path.startsWith('/drafts/') ||
          path.startsWith('/payment') ||
          path == '/expenses' ||
          path.startsWith('/expenses/') ||
          path == '/reports' ||
          path.startsWith('/reports/') ||
          path == '/settings' ||
          path.startsWith('/settings/') ||
          path == '/wallet' ||
          path.startsWith('/wallet/');

      if (isRestricted) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          scaffoldMessengerKey.currentState?.hideCurrentSnackBar();
          scaffoldMessengerKey.currentState?.showSnackBar(
            const SnackBar(
              content: Text(
                'Access Restricted: Managers cannot access billing, financial reports, or settings.',
              ),
              backgroundColor: Color(0xFF1E1B4B),
              behavior: SnackBarBehavior.floating,
              duration: Duration(seconds: 3),
            ),
          );
        });
        return '/dashboard';
      }
    }
    return null;
  },
  routes: [
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/splash',
      pageBuilder: (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: const SplashScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 400),
      ),
    ),
    GoRoute(
      path: '/login',
      pageBuilder: (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: const LoginScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 400),
      ),
    ),
    GoRoute(
      path: '/forgot-password',
      pageBuilder: (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: const ForgotPasswordScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 400),
      ),
    ),
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) {
        return MainLayoutScreen(child: child);
      },
      routes: [
        GoRoute(
          path: '/dashboard',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: DashboardScreen()),
        ),
        GoRoute(
          path: '/appointments',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: AppointmentsListScreen()),
        ),

        GoRoute(
          path: '/customers',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: CustomersListScreen()),
        ),
        GoRoute(
          path: '/leads',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: LeadsScreen()),
        ),
        GoRoute(
          path: '/services',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: ServicesListScreen()),
        ),
      ],
    ),
    GoRoute(
      path: '/customers/add',
      builder: (context, state) {
        final extra = state.extra;
        if (extra is Map<String, dynamic>) {
          return AddEditCustomerScreen(
            initialName: extra['initialName'] as String?,
            initialPhone: extra['initialPhone'] as String?,
          );
        }
        return const AddEditCustomerScreen();
      },
    ),
    GoRoute(
      path: '/customers_full',
      builder: (context, state) => const RootScreenWrapper(child: CustomersListScreen()),
    ),
    GoRoute(
      path: '/appointments_full',
      builder: (context, state) => const RootScreenWrapper(child: AppointmentsListScreen()),
    ),
    GoRoute(
      path: '/leads_full',
      builder: (context, state) => const RootScreenWrapper(child: LeadsScreen()),
    ),
    GoRoute(
      path: '/services_full',
      builder: (context, state) => const RootScreenWrapper(child: ServicesListScreen()),
    ),
    GoRoute(
      path: '/book-appointment',
      builder: (context, state) => const BookAppointmentScreen(),
    ),
    GoRoute(
      path: '/customers/edit',
      builder: (context, state) {
        final customer = state.extra as Map<String, dynamic>?;
        return AddEditCustomerScreen(customer: customer);
      },
    ),
    GoRoute(
      path: '/leads/add',
      builder: (context, state) => const AddEditLeadScreen(),
    ),
    GoRoute(
      path: '/leads/edit',
      builder: (context, state) {
        final lead = state.extra as Map<String, dynamic>?;
        return AddEditLeadScreen(lead: lead);
      },
    ),
    GoRoute(
      path: '/customers/:id',
      builder: (context, state) {
        final id = int.tryParse(state.pathParameters['id'] ?? '0') ?? 0;
        return CustomerProfileScreen(customerId: id);
      },
    ),
    GoRoute(
      path: '/staff',
      builder: (context, state) => const RootScreenWrapper(child: StaffListScreen()),
    ),
    GoRoute(
      path: '/staff/attendance',
      builder: (context, state) => const RootScreenWrapper(child: StaffAttendanceScreen()),
    ),
    GoRoute(
      path: '/staff/add',
      builder: (context, state) => const AddEditStaffScreen(),
    ),
    GoRoute(
      path: '/staff/edit',
      builder: (context, state) {
        final staff = state.extra as Map<String, dynamic>?;
        return AddEditStaffScreen(staff: staff);
      },
    ),
    GoRoute(
      path: '/staff/profile/:id',
      builder: (context, state) {
        final id = int.tryParse(state.pathParameters['id'] ?? '0') ?? 0;
        return StaffProfileScreen(staffId: id);
      },
    ),
    GoRoute(
      path: '/catalog',
      builder: (context, state) => const RootScreenWrapper(child: CatalogScreen()),
    ),
    GoRoute(
      path: '/services/add',
      builder: (context, state) => const AddEditServiceScreen(),
    ),
    GoRoute(
      path: '/services/edit',
      builder: (context, state) {
        final service = state.extra as Map<String, dynamic>?;
        return AddEditServiceScreen(service: service);
      },
    ),
    GoRoute(
      path: '/payment/:id',
      builder: (context, state) {
        final id = int.parse(state.pathParameters['id']!);
        return PaymentScreen(invoiceId: id);
      },
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutScreen(),
    ),
    GoRoute(
      path: '/drafts',
      builder: (context, state) => const RootScreenWrapper(child: DraftsListScreen()),
    ),
    GoRoute(
      path: '/invoices',
      builder: (context, state) => const RootScreenWrapper(child: InvoiceHistoryScreen()),
    ),
    GoRoute(
      path: '/pos',
      builder: (context, state) => const RootScreenWrapper(child: PosBillingScreen()),
    ),
    GoRoute(
      path: '/appointments/:id',
      builder: (context, state) {
        final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
        return AppointmentDetailScreen(id: id);
      },
    ),
    GoRoute(
      path: '/inventory',
      builder: (context, state) => const RootScreenWrapper(child: InventoryScreen()),
    ),
    GoRoute(
      path: '/inventory/add',
      builder: (context, state) => const AddEditProductScreen(),
    ),
    GoRoute(
      path: '/inventory/edit/:id',
      builder: (context, state) {
        final product = state.extra as Map<String, dynamic>?;
        return AddEditProductScreen(
          productId:
              product?['id'] ?? int.tryParse(state.pathParameters['id'] ?? ''),
          productData: product,
        );
      },
    ),
    GoRoute(
      path: '/expenses',
      builder: (context, state) => const RootScreenWrapper(child: ExpensesListScreen()),
    ),
    GoRoute(
      path: '/campaigns',
      builder: (context, state) => const RootScreenWrapper(child: CampaignsScreen()),
    ),
    GoRoute(
      path: '/feedback',
      builder: (context, state) => const RootScreenWrapper(child: FeedbackScreen()),
    ),
    GoRoute(
      path: '/expenses/add',
      builder: (context, state) => AddExpenseScreen(expense: state.extra as Map<String, dynamic>?),
    ),
    GoRoute(path: '/wallet', builder: (context, state) => const RootScreenWrapper(child: WalletScreen())),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const RootScreenWrapper(child: SettingsScreen()),
    ),
    GoRoute(
      path: '/reports',
      builder: (context, state) => const RootScreenWrapper(child: ReportsScreen()),
    ),
  ],
);

class RootScreenWrapper extends StatelessWidget {
  final Widget child;
  const RootScreenWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final bool canPop = context.canPop();
    return PopScope(
      canPop: canPop,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (!canPop) {
          context.go('/dashboard');
        }
      },
      child: child,
    );
  }
}

class PlaceholderScreen extends StatelessWidget {
  final String title;
  const PlaceholderScreen({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(
          '$title - Under Construction',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
    );
  }
}




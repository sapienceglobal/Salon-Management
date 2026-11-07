import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../search/presentation/providers/search_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class GlobalSearchDelegate extends SearchDelegate {
  final WidgetRef ref;

  GlobalSearchDelegate(this.ref)
    : super(
        searchFieldLabel: 'Search customers, services, bills, anything...',
        searchFieldStyle: TextStyle(fontSize: 15.sp),
      );

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: Icon(Icons.clear, color: AppColors.textSecondary),
          onPressed: () {
            query = '';
            showSuggestions(context);
          },
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: Icon(Icons.arrow_back, color: AppColors.textSecondary),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchResults(context);
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.length < 2) {
      return Center(
        child: Text(
          'Type at least 2 characters to search...',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return _buildSearchResults(context);
  }

  Widget _buildSearchResults(BuildContext context) {
    return Consumer(
      builder: (context, ref, child) {
        final searchAsync = ref.watch(globalSearchProvider(query));

        return searchAsync.when(
          loading: () => Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          error: (err, stack) => Center(
            child: Text(
              'Error: $err',
              style: TextStyle(color: AppColors.error),
            ),
          ),
          data: (results) {
            if (results.isEmpty ||
                !results.values.any(
                  (list) => list != null && list.isNotEmpty,
                )) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.search_off_rounded,
                      size: 48.sp,
                      color: AppColors.textSecondary,
                    ),
                    SizedBox(height: 16.h),
                    Text(
                      'No results found for "$query"',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              );
            }

            final orderedCategories = [
              'customers',
              'appointments',
              'services',
              'products',
              'staff',
              'invoices',
              'expenses',
              'enquiries',
              'links',
            ];

            return ListView(
              padding: EdgeInsets.symmetric(vertical: 16.h),
              children: orderedCategories.map((category) {
                final items = results[category];
                if (items == null || items.isEmpty) return SizedBox();

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 8.h,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _getCategoryIcon(category),
                            size: 16.sp,
                            color: AppColors.primary,
                          ),
                          SizedBox(width: 8.w),
                          Text(
                            _getCategoryLabel(category),
                            style: TextStyle(
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textSecondary,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ...items.map(
                      (item) => _buildResultItem(context, category, item),
                    ),
                    Divider(height: 24.h),
                  ],
                );
              }).toList(),
            );
          },
        );
      },
    );
  }

  Widget _buildResultItem(BuildContext context, String category, dynamic item) {
    return ListTile(
      leading: Container(
        padding: EdgeInsets.all(8.w),
        decoration: BoxDecoration(
          color: AppColors.primaryLight.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Icon(
          _getCategoryIcon(category),
          color: AppColors.primary,
          size: 20.sp,
        ),
      ),
      title: Text(
        _getItemTitle(category, item),
        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.sp),
      ),
      subtitle: Text(
        _getItemSubtitle(category, item),
        style: TextStyle(fontSize: 12.sp),
      ),
      onTap: () => _handleNavigation(context, category, item),
    );
  }

  String _getCategoryLabel(String category) {
    switch (category) {
      case 'customers':
        return 'CUSTOMERS';
      case 'appointments':
        return 'APPOINTMENTS';
      case 'services':
        return 'SERVICES';
      case 'products':
        return 'PRODUCTS';
      case 'staff':
        return 'STAFF';
      case 'invoices':
        return 'INVOICES';
      case 'expenses':
        return 'EXPENSES';
      case 'enquiries':
        return 'ENQUIRIES';
      case 'links':
        return 'QUICK LINKS';
      default:
        return category.toUpperCase();
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'customers':
        return Icons.person_outline;
      case 'appointments':
        return Icons.calendar_today_outlined;
      case 'services':
        return Icons.content_cut_outlined;
      case 'products':
        return Icons.local_offer_outlined;
      case 'staff':
        return Icons.badge_outlined;
      case 'invoices':
        return Icons.receipt_long_outlined;
      case 'expenses':
        return Icons.money_off_outlined;
      case 'enquiries':
        return Icons.chat_bubble_outline;
      case 'links':
        return Icons.link;
      default:
        return Icons.search;
    }
  }

  String _getItemTitle(String category, dynamic item) {
    switch (category) {
      case 'customers':
      case 'appointments':
      case 'staff':
        return '${item['first_name'] ?? ''} ${item['last_name'] ?? ''}'.trim();
      case 'services':
      case 'products':
      case 'enquiries':
        return item['name'] ?? '';
      case 'invoices':
        return item['invoice_number'] ?? '';
      case 'expenses':
        return '₹${item['amount'] ?? 0} • ${item['category'] ?? ''}';
      case 'links':
        return item['title'] ?? '';
      default:
        return item['name'] ??
            item['title'] ??
            item['id']?.toString() ??
            'Unknown';
    }
  }

  String _getItemSubtitle(String category, dynamic item) {
    switch (category) {
      case 'customers':
        return item['phone'] ?? item['email'] ?? '';
      case 'appointments':
        return '#${item['id']} • ${item['appointment_date'] ?? ''}';
      case 'services':
        return '₹${item['price'] ?? 0}';
      case 'products':
        return 'SKU: ${item['sku'] ?? ''} • Stock: ${item['stock_quantity'] ?? 0}';
      case 'staff':
        return item['role'] ?? '';
      case 'invoices':
        return '₹${item['total_amount'] ?? 0} • ${item['status'] ?? ''}';
      case 'expenses':
        return item['notes'] ?? '';
      case 'enquiries':
        return '${item['phone'] ?? ''} • ${item['status'] ?? ''}';
      case 'links':
        return item['route'] ?? '';
      default:
        return '';
    }
  }

  void _handleNavigation(BuildContext context, String category, dynamic item) {
    close(context, null);
    switch (category) {
      case 'customers':
        if (item['id'] != null) context.push('/customers/${item['id']}');
        break;
      case 'appointments':
        if (item['id'] != null) context.push('/appointments/${item['id']}');
        break;
      case 'services':
        context.push('/services');
        break;
      case 'products':
        context.push('/inventory');
        break;
      case 'staff':
        context.push('/staff');
        break;
      case 'invoices':
        if (CurrentUserSession.isManager) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Access Restricted: Managers cannot view invoices or billing.'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Color(0xFF1E1B4B),
            ),
          );
          return;
        }
        context.push('/invoices');
        break;
      case 'expenses':
        if (CurrentUserSession.isManager) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Access Restricted: Managers cannot view expense records.'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Color(0xFF1E1B4B),
            ),
          );
          return;
        }
        context.push('/expenses');
        break;
      case 'enquiries':
        context.push('/leads');
        break;
      case 'links':
        if (item['route'] != null) {
          String route = item['route'];
          if (route.startsWith('/admin')) {
            route = route.replaceFirst('/admin', '');
          }
          // Special cases where web routes differ from app routes
          if (route == '/billing') route = '/checkout';
          if (route == '/enquiry') route = '/leads';

          if (CurrentUserSession.isManager) {
            final isRestricted = route.startsWith('/pos') ||
                route.startsWith('/checkout') ||
                route.startsWith('/invoices') ||
                route.startsWith('/expenses') ||
                route.startsWith('/reports') ||
                route.startsWith('/settings') ||
                route.startsWith('/wallet');
            if (isRestricted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Access Restricted: Managers cannot access this section.'),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: Color(0xFF1E1B4B),
                ),
              );
              return;
            }
          }

          context.push(route);
        }
        break;
    }
  }
}

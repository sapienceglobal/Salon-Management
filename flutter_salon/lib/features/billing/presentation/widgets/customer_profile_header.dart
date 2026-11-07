import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../customers/data/customer_provider.dart';
import '../../../customers/presentation/screens/add_edit_customer_screen.dart';

class CustomerProfileHeader extends ConsumerStatefulWidget {
  final Map<String, dynamic>? customer;
  final Function(Map<String, dynamic>?) onCustomerSelected;

  const CustomerProfileHeader({
    super.key,
    required this.customer,
    required this.onCustomerSelected,
  });

  @override
  ConsumerState<CustomerProfileHeader> createState() =>
      _CustomerProfileHeaderState();
}

class _CustomerProfileHeaderState extends ConsumerState<CustomerProfileHeader> {
  void _showAddEditCustomerSheet(
    BuildContext context, {
    Map<String, dynamic>? existingCustomer,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
        ),
        clipBehavior: Clip.antiAlias,
        child: AddEditCustomerScreen(customer: existingCustomer),
      ),
    ).then((result) async {
      if (result != null && result is Map<String, dynamic>) {
        widget.onCustomerSelected(result);
      } else if (existingCustomer != null) {
        try {
          final custData = await ref.read(
            customerProfileProvider(existingCustomer['id']).future,
          );
          widget.onCustomerSelected(custData);
        } catch (e) {
          // ignore
        }
      }
      ref.invalidate(customersListProvider);
    });
  }

  void _showCustomerSearchSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
        ),
        padding: EdgeInsets.only(
          top: 20.h,
          left: 20.w,
          right: 20.w,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Customer',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            SizedBox(height: 20.h),
            Row(
              children: [
                Expanded(
                  child: Autocomplete<Map<String, dynamic>>(
                    optionsBuilder: (TextEditingValue textEditingValue) async {
                      if (textEditingValue.text.isEmpty) {
                        return const Iterable<Map<String, dynamic>>.empty();
                      }
                      final customers = await ref.read(
                        customersListProvider(textEditingValue.text).future,
                      );
                      return customers.cast<Map<String, dynamic>>();
                    },
                    displayStringForOption: (option) =>
                        '${option['first_name']} ${option['last_name'] ?? ''} - ${option['phone'] ?? ''}',
                    onSelected: (option) {
                      Navigator.pop(context);
                      widget.onCustomerSelected(option);
                    },
                    fieldViewBuilder:
                        (context, controller, focusNode, onEditingComplete) {
                          return TextField(
                            controller: controller,
                            focusNode: focusNode,
                            onEditingComplete: onEditingComplete,
                            autofocus: true,
                            decoration: InputDecoration(
                              hintText: 'Search by name or phone...',
                              prefixIcon: Icon(Icons.search),
                              filled: true,
                              fillColor: AppColors.card,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide: BorderSide.none,
                              ),
                            ),
                          );
                        },
                  ),
                ),
              ],
            ),
            SizedBox(height: 24.h),
            Center(
              child: Text(
                'OR',
                style: TextStyle(
                  color: AppColors.textSecondary.withOpacity(0.5),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            SizedBox(height: 24.h),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _showAddEditCustomerSheet(context);
                },
                icon: Icon(Icons.person_add),
                label: Text('Add New Customer'),
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 16.h),
                  backgroundColor: AppColors.primaryLight,
                  foregroundColor: AppColors.primary,
                  elevation: 0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.customer != null) {
      final cust = widget.customer!;
      final name = '${cust['first_name']} ${cust['last_name'] ?? ''}'.trim();
      final phone = cust['phone'] ?? 'No Phone';

      return Container(
        padding: EdgeInsets.all(16.w),
        margin: EdgeInsets.only(top: 16.h, left: 20.w, right: 20.w),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16.r),
          border: Border.all(color: AppColors.primary.withOpacity(0.3)),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.primaryLight,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 20.sp,
                    ),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        phone,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.edit, color: AppColors.primary),
                  onPressed: () => _showAddEditCustomerSheet(
                    context,
                    existingCustomer: cust,
                  ),
                  tooltip: 'Edit Customer',
                ),
                IconButton(
                  icon: Icon(Icons.close, color: AppColors.error),
                  onPressed: () => widget.onCustomerSelected(null),
                  tooltip: 'Remove Customer',
                ),
              ],
            ),
            Divider(height: 24.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStat('Wallet', '₹${cust['wallet_balance'] ?? 0}'),
                _buildStat('Points', '${cust['reward_points'] ?? 0}'),
                _buildStat('Visits', '${cust['total_visits'] ?? 0}'),
              ],
            ),
          ],
        ),
      );
    }

    return GestureDetector(
      onTap: () => _showCustomerSearchSheet(context),
      child: Container(
        padding: EdgeInsets.all(16.w),
        margin: EdgeInsets.only(top: 16.h, left: 20.w, right: 20.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18.r),
          border: Border.all(color: const Color(0xFFF1E4E8), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(12.w),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF0F5),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.person_add_alt_1_rounded,
                color: const Color(0xFFE91E63),
                size: 24.sp,
              ),
            ),
            SizedBox(width: 14.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Add / Select Customer',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 15.sp,
                      color: const Color(0xFF1A1A2E),
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    'Choose client or add new (or Walk-in)',
                    style: GoogleFonts.inter(
                      fontSize: 12.sp,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 8.h),
              decoration: BoxDecoration(
                color: const Color(0xFFE91E63),
                borderRadius: BorderRadius.circular(20.r),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFE91E63).withOpacity(0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.add_rounded, color: Colors.white, size: 16.sp),
                  SizedBox(width: 4.w),
                  Text(
                    'Add',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 12.sp,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16.sp),
        ),
        Text(
          label,
          style: TextStyle(fontSize: 12.sp, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

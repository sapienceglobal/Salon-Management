import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import 'package:flutter_salon/features/pos/presentation/providers/pos_provider.dart';
import 'package:flutter_salon/features/pos/presentation/providers/cart_provider.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';
import '../widgets/customer_profile_header.dart';
import '../widgets/quick_assign_staff_dialog.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class PosBillingScreen extends ConsumerStatefulWidget {
  const PosBillingScreen({super.key});

  @override
  ConsumerState<PosBillingScreen> createState() => _PosBillingScreenState();
}

class _PosBillingScreenState extends ConsumerState<PosBillingScreen> {
  int _selectedTab = 0;
  final List<String> _tabs = [
    'Services',
    'Products',
    'Packages',
    'Memberships',
  ];
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final posItemsAsync = ref.watch(posItemsProvider);
    final cartState = ref.watch(cartProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('POS & Billing'),
        actions: [
          PopupMenuButton<String>(
            icon: Icon(Icons.more_vert),
            onSelected: (value) async {
              if (value == 'staff') {
                showQuickAssignStaffDialog(context);
              } else if (value == 'drafts') {
                context.push('/drafts');
              } else if (value == 'expense') {
                // Navigate to expense
                context.push(
                  '/expenses/add',
                ); // Assuming a route like this exists or it will be handled
              } else if (value == 'money') {
                context.push('/wallet'); // Or whatever the wallet route is
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(value: 'staff', child: Text('Quick Assign Staff')),
              PopupMenuItem(value: 'drafts', child: Text('View Drafts')),
              PopupMenuItem(value: 'expense', child: Text('Add Expense')),
              PopupMenuItem(value: 'money', child: Text('Add Money')),
            ],
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              CustomerProfileHeader(
                customer: cartState.customer,
                onCustomerSelected: (customer) {
                  ref.read(cartProvider.notifier).setCustomer(customer);
                },
              ),
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: 20.w.w,
                  vertical: 10.h.h,
                ),
                child: TextField(
                  onChanged: (value) => setState(() => _searchQuery = value),
                  decoration: InputDecoration(
                    hintText: 'Search product or service...',
                    prefixIcon: Icon(Icons.search),
                    suffixIcon: Icon(Icons.qr_code_scanner),
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12.r),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              // Custom Tab Bar
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.w.w),
                child: Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(4.w),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: List.generate(_tabs.length, (index) {
                        final isSelected = _selectedTab == index;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedTab = index),
                          child: Container(
                            padding: EdgeInsets.symmetric(
                              vertical: 12.h.h,
                              horizontal: 16.w.w,
                            ),
                            margin: EdgeInsets.only(
                              right: index == _tabs.length - 1 ? 0 : 8.w,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.primary
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(8.r),
                            ),
                            child: Text(
                              _tabs[index],
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: isSelected
                                    ? Colors.white
                                    : AppColors.textSecondary,
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                fontSize: 14.sp,
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                ),
              ),
              SizedBox(height: 16.h),
              // List
              Expanded(
                child: posItemsAsync.when(
                  loading: () => const SkeletonList(),
                  error: (err, stack) => Center(child: Text('Error: $err')),
                  data: (data) {
                    final tabKeys = [
                      'services',
                      'products',
                      'packages',
                      'memberships',
                    ];
                    final currentKey = tabKeys[_selectedTab];
                    final List<dynamic> items = data[currentKey] ?? [];

                    final filteredItems = items.where((item) {
                      final name = item['name'].toString().toLowerCase();
                      return name.contains(_searchQuery.toLowerCase());
                    }).toList();

                    if (filteredItems.isEmpty) {
                      return Center(child: Text('No items found.'));
                    }

                    return ListView.separated(
                      padding: EdgeInsets.only(
                        left: 20.w.w,
                        right: 20.w.w,
                        bottom: 100.h.h,
                      ),
                      itemCount: filteredItems.length,
                      separatorBuilder: (context, index) =>
                          SizedBox(height: 16.h),
                      itemBuilder: (context, index) {
                        final item = filteredItems[index];
                        final typeMap = {
                          'services': 'service',
                          'products': 'product',
                          'packages': 'package',
                          'memberships': 'membership',
                        };
                        final type = typeMap[currentKey]!;

                        // Check if in cart
                        final cartIndex = cartState.items.indexWhere(
                          (c) => c.itemType == type && c.itemId == item['id'],
                        );
                        final isInCart = cartIndex >= 0;
                        final cartQty = isInCart
                            ? cartState.items[cartIndex].quantity
                            : 0;

                        return Container(
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: isInCart
                                  ? AppColors.primary
                                  : Colors.transparent,
                              width: 2.w,
                            ),
                            borderRadius: BorderRadius.circular(16.r),
                            color: isInCart
                                ? AppColors.primary.withOpacity(0.05)
                                : Colors.transparent,
                          ),
                          child: Row(
                            children: [
                              Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Container(
                                    width: 60.w,
                                    height: 60.h,
                                    margin: EdgeInsets.all(8.w),
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryLight,
                                      borderRadius: BorderRadius.circular(12.r),
                                    ),
                                    child: Icon(
                                      Icons.image,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  if (isInCart)
                                    Positioned(
                                      top: 0.h,
                                      right: 0.w,
                                      child: Container(
                                        padding: EdgeInsets.all(6.w),
                                        decoration: BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Colors.white,
                                            width: 2.w,
                                          ),
                                        ),
                                        child: Text(
                                          '$cartQty',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 10.sp,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              SizedBox(width: 8.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['name'] ?? '',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                    SizedBox(height: 4.h),
                                    Text(
                                      '₹ ${item['price'] ?? 0}',
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodyMedium,
                                    ),
                                    if (isInCart &&
                                        cartState
                                                .items[cartIndex]
                                                .staffMemberId !=
                                            null)
                                      Consumer(
                                        builder: (context, ref, child) {
                                          final staffAsync = ref.watch(
                                            staffListProvider,
                                          );
                                          return staffAsync.when(
                                            data: (staff) {
                                              final assignedStaff = staff
                                                  .firstWhere(
                                                    (s) =>
                                                        s['id'] ==
                                                        cartState
                                                            .items[cartIndex]
                                                            .staffMemberId,
                                                    orElse: () => null,
                                                  );
                                              if (assignedStaff != null) {
                                                return Padding(
                                                  padding: EdgeInsets.only(
                                                    top: 4.h.h,
                                                  ),
                                                  child: Text(
                                                    'Assigned to: ${assignedStaff['first_name']}',
                                                    style: TextStyle(
                                                      fontSize: 12.sp,
                                                      color: AppColors.primary
                                                          .withOpacity(0.8),
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                );
                                              }
                                              return SizedBox.shrink();
                                            },
                                            loading: () => SizedBox.shrink(),
                                            error: (_, _) => SizedBox.shrink(),
                                          );
                                        },
                                      ),
                                  ],
                                ),
                              ),
                              Padding(
                                padding: EdgeInsets.all(8.0.w),
                                child: isInCart
                                    ? Container(
                                        decoration: BoxDecoration(
                                          color: AppColors.primaryLight,
                                          borderRadius: BorderRadius.circular(
                                            20,
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            IconButton(
                                              icon: Icon(
                                                Icons.remove,
                                                color: AppColors.primary,
                                                size: 18.sp,
                                              ),
                                              onPressed: () {
                                                ref
                                                    .read(cartProvider.notifier)
                                                    .updateItemQuantity(
                                                      cartIndex,
                                                      cartQty - 1,
                                                    );
                                              },
                                            ),
                                            Text(
                                              '$cartQty',
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            IconButton(
                                              icon: Icon(
                                                Icons.add,
                                                color: AppColors.primary,
                                                size: 18.sp,
                                              ),
                                              onPressed: () {
                                                ref
                                                    .read(cartProvider.notifier)
                                                    .updateItemQuantity(
                                                      cartIndex,
                                                      cartQty + 1,
                                                    );
                                              },
                                            ),
                                          ],
                                        ),
                                      )
                                    : Container(
                                        decoration: BoxDecoration(
                                          color: AppColors.primaryLight,
                                          shape: BoxShape.circle,
                                        ),
                                        child: IconButton(
                                          icon: Icon(
                                            Icons.add,
                                            color: AppColors.primary,
                                            size: 20.sp,
                                          ),
                                          onPressed: () {
                                            ref
                                                .read(cartProvider.notifier)
                                                .addItem(
                                                  CartItem(
                                                    itemType: type,
                                                    itemId: item['id'],
                                                    name: item['name'] ?? '',
                                                    unitPrice:
                                                        double.tryParse(
                                                          item['price']
                                                              .toString(),
                                                        ) ??
                                                        0.0,
                                                  ),
                                                );
                                          },
                                        ),
                                      ),
                              ),
                            ],
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
          // Cart Floating Bottom Sheet
          if (cartState.items.isNotEmpty)
            Positioned(
              bottom: 20.h + MediaQuery.of(context).padding.bottom,
              left: 20.w,
              right: 20.w,
              child: Container(
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(20.r),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Icon(Icons.shopping_cart_outlined, size: 32.sp),
                        Positioned(
                          right: -4,
                          top: -4,
                          child: Container(
                            padding: EdgeInsets.all(4.w),
                            decoration: BoxDecoration(
                              color: AppColors.error,
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              '${cartState.items.length}',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10.sp,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(width: 16.w),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${cartState.items.length} Items',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Text(
                          '₹ ${cartState.subtotal}',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: () {
                        if (cartState.customer == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Please select or add a customer before proceeding to bill.',
                              ),
                            ),
                          );
                          return;
                        }
                        context.push('/checkout');
                      },
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.symmetric(
                          horizontal: 24.w.w,
                          vertical: 12.h.h,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Proceed to Bill'),
                          SizedBox(width: 8.w),
                          Icon(Icons.arrow_forward, size: 16.sp),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

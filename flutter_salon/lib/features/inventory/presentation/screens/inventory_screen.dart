import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_salon/core/theme/app_colors.dart';
import 'package:flutter_salon/features/inventory/presentation/providers/inventory_provider.dart';
import 'package:flutter_salon/features/inventory/presentation/widgets/product_detail_sheet.dart';
import 'package:flutter_salon/core/widgets/skeletons/skeleton_list.dart';
import 'package:flutter_salon/features/inventory/data/inventory_repository.dart';
import 'package:flutter_salon/core/widgets/premium_stat_card.dart';
import '../../../../core/widgets/skeletons/skeleton_card.dart';
import 'package:flutter_salon/core/network/dio_client.dart';

class InventoryScreen extends ConsumerWidget {
  const InventoryScreen({super.key});

  void _showFilterSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      builder: (context) {
        return Consumer(
          builder: (context, ref, _) {
            final isLowStock = ref.watch(inventoryLowStockProvider);
            return Padding(
              padding: EdgeInsets.all(24.0.w),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Filter Products',
                        style: GoogleFonts.poppins(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        icon: Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  SizedBox(height: 20.h),
                  Text(
                    'Stock Alerts',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  SizedBox(height: 8.h),
                  Wrap(
                    spacing: 8,
                    children: [
                      FilterChip(
                        label: Text(
                          'Low / Out of Stock',
                          style: GoogleFonts.inter(fontSize: 14.sp),
                        ),
                        selected: isLowStock,
                        onSelected: (val) {
                          ref.read(inventoryLowStockProvider.notifier).state =
                              val;
                        },
                        selectedColor: const Color(0xFFFDE68A),
                        checkmarkColor: const Color(0xFFD97706),
                      ),
                    ],
                  ),
                  SizedBox(height: 32.h),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE91E63),
                        padding: EdgeInsets.symmetric(vertical: 16.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                      ),
                      child: Text(
                        'Apply Filters',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(inventoryListProvider);
    final metrics = ref.watch(inventoryMetricsProvider);
    final categories = ref.watch(inventoryCategoriesProvider);

    final category = ref.watch(inventoryCategoryProvider);

    // Add default categories if backend is empty to match design request
    final displayCategories = categories.isEmpty
        ? ['Hair Care', 'Skin Care', 'Nail Care', 'Makeup']
        : categories;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 8.h),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24.r),
                  child: Container(
                    height: 210.h,
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF1F5F9), // Fallback
                    ),
                    child: Stack(
                      children: [
                        // Background Image
                        Positioned.fill(
                          child: Image.asset(
                            'assets/images/inventory_hero.jpg',
                            fit: BoxFit.cover,
                            alignment: Alignment.center,
                          ),
                        ),
                        // Gradient Overlay for Text
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [
                                  const Color(0xFFFCE7F3).withOpacity(0.95),
                                  const Color(0xFFFCE7F3).withOpacity(0.7),
                                  Colors.transparent,
                                ],
                                stops: const [0.0, 0.6, 1.0],
                              ),
                            ),
                          ),
                        ),
                        // Content Overlay
                        Positioned.fill(
                          child: Padding(
                            padding: EdgeInsets.all(24.w),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Top row with back button and Add button
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    InkWell(
                                      onTap: () {
                                        if (context.canPop()) {
                                          context.pop();
                                        } else {
                                          context.go('/dashboard');
                                        }
                                      },
                                      borderRadius: BorderRadius.circular(8.r),
                                      child: Container(
                                        padding: EdgeInsets.all(8.w),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.9),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          Icons.arrow_back_rounded,
                                          color: const Color(0xFF1A1A2E),
                                          size: 20.sp,
                                        ),
                                      ),
                                    ),
                                    LayoutBuilder(
                                      builder: (context, constraints) {
                                        // Use icon-only button on narrow screens to avoid overflow
                                        final totalWidth = MediaQuery.of(
                                          context,
                                        ).size.width;
                                        return totalWidth < 380
                                            ? FloatingActionButton.small(
                                                onPressed: () => context.push(
                                                  '/inventory/add',
                                                ),
                                                backgroundColor: const Color(
                                                  0xFFE91E63,
                                                ),
                                                child: Icon(
                                                  Icons.add,
                                                  color: Colors.white,
                                                ),
                                              )
                                            : ElevatedButton.icon(
                                                onPressed: () => context.push(
                                                  '/inventory/add',
                                                ),
                                                icon: Icon(
                                                  Icons.add,
                                                  size: 18.sp,
                                                ),
                                                label: Text('Add Product'),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: const Color(
                                                    0xFFE91E63,
                                                  ),
                                                  foregroundColor: Colors.white,
                                                  elevation: 0,
                                                  padding: EdgeInsets.symmetric(
                                                    horizontal: 16.w,
                                                    vertical: 10.h,
                                                  ),
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          10.r,
                                                        ),
                                                  ),
                                                  textStyle: GoogleFonts.inter(
                                                    fontSize: 14.sp,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              );
                                      },
                                    ),
                                  ],
                                ),
                                const Spacer(),
                                // Heading and Subtext
                                Text(
                                  'Products',
                                  style: GoogleFonts.poppins(
                                    fontSize: 28.sp,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1A1A2E),
                                  ),
                                ),
                                SizedBox(height: 4.h),
                                Text(
                                  'Manage your inventory & products',
                                  style: GoogleFonts.inter(
                                    fontSize: 14.sp,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.0.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: 16.h),

                    // Search and Filter Section
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 48.h,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8.r),
                              border: Border.all(
                                color: const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: TextField(
                              style: GoogleFonts.inter(fontSize: 14.sp),
                              decoration: InputDecoration(
                                hintText: 'Search products, brand or SKU...',
                                hintStyle: GoogleFonts.inter(
                                  color: const Color(0xFF94A3B8),
                                  fontSize: 14.sp,
                                ),
                                prefixIcon: Icon(
                                  Icons.search,
                                  color: Color(0xFF1E293B),
                                ),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16.w,
                                  vertical: 14.h,
                                ),
                              ),
                              onChanged: (val) =>
                                  ref
                                          .read(
                                            inventorySearchQueryProvider
                                                .notifier,
                                          )
                                          .state =
                                      val,
                            ),
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Container(
                          height: 48.h,
                          width: 48.w,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8.r),
                          ),
                          child: IconButton(
                            icon: Icon(
                              Icons.tune_rounded,
                              color: Color(0xFF1E293B),
                            ),
                            onPressed: () {
                              _showFilterSheet(context, ref);
                            },
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 24.h),

                    // Category Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildCategoryChip(
                            'All',
                            category.isEmpty || category == 'All',
                            ref,
                          ),
                          ...displayCategories.map(
                            (c) => Padding(
                              padding: EdgeInsets.only(left: 8.0.w),
                              child: _buildCategoryChip(c, category == c, ref),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 24.h),

                    // Metrics Row - Scrollable on very small screens
                    (productsAsync.isLoading && !productsAsync.hasValue)
                        ? SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: SkeletonCard(
                              horizontal: true,
                              count: 4,
                              width: 160.w,
                              height: 120.h,
                            ),
                          )
                        : SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildMetricCard(
                                  metrics['totalProducts'].toString(),
                                  'Total',
                                  Icons.inventory_2_outlined,
                                  const Color(0xFF3B82F6),
                                  const Color(0xFFEFF6FF),
                                ),
                                SizedBox(width: 12.w),
                                _buildMetricCard(
                                  (metrics['totalProducts'] -
                                          metrics['lowStockAlerts'] -
                                          metrics['outOfStock'])
                                      .toString(),
                                  'In Stock',
                                  Icons.inventory_2_outlined,
                                  const Color(0xFF10B981),
                                  const Color(0xFFECFDF5),
                                ),
                                SizedBox(width: 12.w),
                                _buildMetricCard(
                                  metrics['lowStockAlerts'].toString(),
                                  'Low Stock',
                                  Icons.error_outline_rounded,
                                  const Color(0xFFF59E0B),
                                  const Color(0xFFFFFBEB),
                                ),
                                SizedBox(width: 12.w),
                                _buildMetricCard(
                                  metrics['outOfStock'].toString(),
                                  'Out of Stock',
                                  Icons.cancel_outlined,
                                  const Color(0xFFEF4444),
                                  const Color(0xFFFEF2F2),
                                ),
                              ],
                            ),
                          ),
                    SizedBox(height: 24.h),
                  ],
                ),
              ),
            ),
            productsAsync.when(
              loading: () => const SliverFillRemaining(child: SkeletonList()),
              error: (err, stack) => SliverFillRemaining(
                child: Center(
                  child: Text(
                    'Error: $err',
                    style: GoogleFonts.inter(color: AppColors.error),
                  ),
                ),
              ),
              data: (products) {
                if (products.isEmpty) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.inventory_2_rounded,
                            size: 64.sp,
                            color: AppColors.textSecondary.withOpacity(0.3),
                          ),
                          SizedBox(height: 16.h),
                          Text(
                            'No products found.',
                            style: GoogleFonts.inter(
                              color: AppColors.textSecondary,
                              fontSize: 16.sp,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                return SliverPadding(
                  padding: EdgeInsets.symmetric(horizontal: 20.w),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate((context, index) {
                      final product = products[index];
                      return _buildProductCard(context, ref, product);
                    }, childCount: products.length),
                  ),
                );
              },
            ),
            SliverPadding(padding: EdgeInsets.only(bottom: 100.h)),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String title, bool isSelected, WidgetRef ref) {
    return GestureDetector(
      onTap: () {
        if (title == 'All') {
          ref.read(inventoryCategoryProvider.notifier).state = '';
        } else {
          ref.read(inventoryCategoryProvider.notifier).state = title;
        }
      },
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE91E63) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Text(
          title,
          style: GoogleFonts.inter(
            color: isSelected ? Colors.white : const Color(0xFF334155),
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            fontSize: 14.sp,
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard(
    String value,
    String title,
    IconData icon,
    Color iconColor,
    Color bgColor,
  ) {
    return PremiumStatCard(
      title: title,
      value: value,
      icon: icon,
      mainColor: iconColor,
      bgColor: bgColor,
    );
  }

  void _showStockAdjustDialog(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> product,
  ) {
    final qtyController = TextEditingController();

    showDialog(
      context: context,
      builder: (c) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
        ),
        title: Text(
          'Adjust Stock',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: 18.sp,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Current: ${product['stock_quantity'] ?? 0}',
              style: GoogleFonts.inter(fontSize: 14.sp),
            ),
            SizedBox(height: 16.h),
            TextField(
              controller: qtyController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'New Stock Quantity',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(color: const Color(0xFF64748B)),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE91E63),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
            onPressed: () async {
              final newQty = int.tryParse(qtyController.text);
              if (newQty != null) {
                try {
                  await ref.read(inventoryRepositoryProvider).updateProduct(
                    product['id'],
                    {'stock_quantity': newQty},
                  );
                  ref.invalidate(inventoryListProvider);
                  if (c.mounted) {
                    Navigator.pop(c);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Stock updated successfully'),
                      ),
                    );
                  }
                } catch (e) {
                  if (c.mounted) {
                    ScaffoldMessenger.of(
                      c,
                    ).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                }
              }
            },
            child: Text(
              'Update Stock',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> product,
  ) {
    final qty = product['stock_quantity'] ?? 0;
    final minAlert = product['min_stock_alert'] ?? 0;
    final isActive = product['is_active'] == true;

    // Ensure price is parsed as a double since it might be a String like "3200.00"
    final priceRaw = product['selling_price'];
    final double price = priceRaw is num
        ? priceRaw.toDouble()
        : double.tryParse(priceRaw?.toString() ?? '0') ?? 0.0;

    String statusLabel = 'In Stock';
    Color statusColor = const Color(0xFF10B981); // Green
    if (!isActive) {
      statusLabel = 'Inactive';
      statusColor = const Color(0xFF94A3B8);
    } else if (qty == 0) {
      statusLabel = 'Out of Stock';
      statusColor = const Color(0xFFEF4444); // Red
    } else if (qty <= minAlert) {
      statusLabel = 'Low Stock';
      statusColor = const Color(0xFFF59E0B); // Orange
    }

    // Add quantity count next to status if applicable
    final statusText = (qty > 0) ? '$statusLabel ($qty)' : statusLabel;

    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1.5.w),
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              useRootNavigator: true,
              backgroundColor: Colors.transparent,
              builder: (context) => ProductDetailSheet(
                product: product,
                onUpdateSuccess: () => ref.refresh(inventoryListProvider),
              ),
            );
          },
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 16.h),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Product Image Container
                Container(
                  width: 56.w,
                  height: 56.h,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Builder(
                    builder: (context) {
                      final fullUrl = resolveMediaUrl(product['image_url']);
                      if (fullUrl.isNotEmpty) {
                        return Image.network(
                          fullUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Center(
                            child: Icon(
                              Icons.inventory_2_outlined,
                              color: const Color(0xFF94A3B8),
                              size: 24.sp,
                            ),
                          ),
                        );
                      }
                      return Center(
                        child: Icon(
                          Icons.inventory_2_outlined,
                          color: const Color(0xFF94A3B8),
                          size: 24.sp,
                        ),
                      );
                    },
                  ),
                ),
                SizedBox(width: 16.w),

                // Product details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product['name'] ?? 'Unknown Product',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 15.sp,
                          color: const Color(0xFF1E293B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 4.h),
                      Text(
                        '${product['brand'] ?? 'No Brand'} | ${product['category'] ?? 'Uncategorized'}',
                        style: GoogleFonts.inter(
                          color: const Color(0xFF94A3B8),
                          fontSize: 12.sp,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                SizedBox(width: 16.w),

                // Price & Status
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹ ${NumberFormat('#,##,###').format(price)}',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        fontSize: 15.sp,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 10.w,
                        vertical: 4.h,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6.r),
                      ),
                      child: Text(
                        statusText,
                        style: GoogleFonts.inter(
                          color: statusColor,
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(width: 12.w),

                // More options
                PopupMenuButton<String>(
                  icon: Icon(
                    Icons.more_vert_rounded,
                    color: Color(0xFF64748B),
                    size: 20.sp,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  onSelected: (value) async {
                    if (value == 'edit') {
                      context.push(
                        '/inventory/edit/${product['id']}',
                        extra: product,
                      );
                    } else if (value == 'stock') {
                      _showStockAdjustDialog(context, ref, product);
                    } else if (value == 'delete') {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (c) => AlertDialog(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16.r),
                          ),
                          title: Text(
                            'Delete Product',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          content: Text(
                            'Are you sure you want to delete "${product['name']}"?',
                            style: GoogleFonts.inter(),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(c, false),
                              child: Text(
                                'Cancel',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                              ),
                              onPressed: () => Navigator.pop(c, true),
                              child: Text(
                                'Delete',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true) {
                        try {
                          await ref
                              .read(inventoryRepositoryProvider)
                              .deleteProduct(product['id']);
                          ref.invalidate(inventoryListProvider);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Product deleted'),
                                behavior: SnackBarBehavior.floating,
                                backgroundColor: Colors.red.shade600,
                              ),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Error: $e'),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        }
                      }
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          Icon(
                            Icons.edit_outlined,
                            size: 18.sp,
                            color: Color(0xFF3B82F6),
                          ),
                          SizedBox(width: 8.w),
                          Text('Edit', style: GoogleFonts.inter()),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'stock',
                      child: Row(
                        children: [
                          Icon(
                            Icons.inventory_outlined,
                            size: 18.sp,
                            color: Color(0xFF10B981),
                          ),
                          SizedBox(width: 8.w),
                          Text('Adjust Stock', style: GoogleFonts.inter()),
                        ],
                      ),
                    ),
                    const PopupMenuDivider(),
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(
                            Icons.delete_outline_rounded,
                            color: Colors.red,
                            size: 18.sp,
                          ),
                          SizedBox(width: 8.w),
                          Text(
                            'Delete',
                            style: GoogleFonts.inter(color: Colors.red),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

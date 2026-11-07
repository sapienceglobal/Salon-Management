import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_salon/features/inventory/presentation/widgets/adjust_stock_dialog.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

class ProductDetailSheet extends ConsumerWidget {
  final Map<String, dynamic> product;
  final VoidCallback onUpdateSuccess;

  const ProductDetailSheet({
    super.key,
    required this.product,
    required this.onUpdateSuccess,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qty = product['stock_quantity'] ?? 0;
    final minAlert = product['min_stock_alert'] ?? 0;
    final isActive = product['is_active'] == true;

    final sellingPrice =
        double.tryParse(product['selling_price']?.toString() ?? '0') ?? 0.0;
    final costPrice =
        double.tryParse(product['cost_price']?.toString() ?? '0') ?? 0.0;
    final estMargin = sellingPrice - costPrice;
    final totalValue = qty * costPrice;
    final addedOn = product['created_at'] != null
        ? DateFormat(
            'dd MMM yyyy',
          ).format(DateTime.parse(product['created_at']))
        : '-';

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

    return Container(
      height: MediaQuery.of(context).size.height * 0.95,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1.w),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: Color(0xFF0F172A),
                    size: 20.sp,
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
                Text(
                  'Product Details',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: IconButton(
                    icon: Icon(
                      Icons.more_vert_rounded,
                      color: Color(0xFF0F172A),
                      size: 20.sp,
                    ),
                    onPressed: () {
                      // More options
                    },
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(20.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero Image
                  Container(
                    width: double.infinity,
                    height: 240.h,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F4FA),
                      borderRadius: BorderRadius.circular(16.r),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Builder(
                      builder: (context) {
                        final fullUrl = resolveMediaUrl(product['image_url']);
                        if (fullUrl.isNotEmpty) {
                          return Image.network(
                            fullUrl,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) => Center(
                              child: Icon(
                                Icons.inventory_2_outlined,
                                size: 80.sp,
                                color: const Color(0xFFCBD5E1),
                              ),
                            ),
                          );
                        }
                        return Center(
                          child: Icon(
                            Icons.inventory_2_outlined,
                            size: 80.sp,
                            color: const Color(0xFFCBD5E1),
                          ),
                        );
                      },
                    ),
                  ),
                  SizedBox(height: 24.h),

                  // Title & Price Area
                  Text(
                    product['name'] ?? 'Unknown Product',
                    style: GoogleFonts.poppins(
                      fontSize: 24.sp,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    '${product['brand'] ?? 'No Brand'} | ${product['category'] ?? 'Uncategorized'}',
                    style: GoogleFonts.inter(
                      fontSize: 14.sp,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  SizedBox(height: 16.h),
                  Text(
                    '₹ ${NumberFormat('#,##,###.##').format(sellingPrice)}',
                    style: GoogleFonts.poppins(
                      fontSize: 28.sp,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  SizedBox(height: 16.h),

                  // Tags
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 12.w,
                          vertical: 6.h,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                        child: Text(
                          statusLabel,
                          style: GoogleFonts.inter(
                            color: statusColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 13.sp,
                          ),
                        ),
                      ),
                      SizedBox(width: 12.w),
                      if (product['description'] != null)
                        Expanded(
                          child: Text(
                            product['description'],
                            style: GoogleFonts.inter(
                              color: const Color(0xFF64748B),
                              fontSize: 13.sp,
                            ),
                          ),
                        ),
                    ],
                  ),
                  SizedBox(height: 24.h),

                  // Low Stock Alert Banner (If Applicable)
                  if (qty <= minAlert)
                    Container(
                      margin: EdgeInsets.only(bottom: 24.h),
                      padding: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 12.h,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(8.r),
                        border: Border.all(color: const Color(0xFFFCD34D)),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.warning_rounded,
                            color: Color(0xFFF59E0B),
                            size: 20.sp,
                          ),
                          SizedBox(width: 12.w),
                          Expanded(
                            child: Text(
                              'Only $qty left (Min alert: $minAlert)',
                              style: GoogleFonts.inter(
                                color: const Color(0xFFD97706),
                                fontWeight: FontWeight.w500,
                                fontSize: 13.sp,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Metrics Cards (Current Stock, Min Alert, Total Value, Est Margin)
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard(
                          qty.toString(),
                          'Current Stock',
                          const Color(0xFF10B981),
                          const Color(0xFFECFDF5),
                        ),
                      ),
                      SizedBox(width: 12.w),
                      Expanded(
                        child: _buildMetricCard(
                          minAlert.toString(),
                          'Min Alert',
                          const Color(0xFF8B5CF6),
                          const Color(0xFFF5F3FF),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 12.h),
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard(
                          '₹${NumberFormat('#,##,###').format(totalValue)}',
                          'Total Value',
                          const Color(0xFF3B82F6),
                          const Color(0xFFEFF6FF),
                        ),
                      ),
                      SizedBox(width: 12.w),
                      Expanded(
                        child: _buildMetricCard(
                          '₹${NumberFormat('#,##,###').format(estMargin)}',
                          'Est. Margin',
                          const Color(0xFFF59E0B),
                          const Color(0xFFFFFBEB),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 32.h),

                  // Information List
                  // Selling Price,Purchase Price,Est. Margin,Current Stock,Total Value,SKU,Barcode,Min Alert,Added On
                  _buildInfoRow(
                    Icons.local_offer_outlined,
                    'SKU',
                    product['sku'] ?? '-',
                  ),
                  _buildInfoRow(
                    Icons.qr_code_2_rounded,
                    'Barcode',
                    product['barcode'] ?? '-',
                  ),
                  _buildInfoRow(
                    Icons.sell_outlined,
                    'Selling Price',
                    '₹ ${NumberFormat('#,##,###.##').format(sellingPrice)}',
                  ),
                  _buildInfoRow(
                    Icons.shopping_cart_outlined,
                    'Purchase Price',
                    '₹ ${NumberFormat('#,##,###.##').format(costPrice)}',
                  ),
                  _buildInfoRow(
                    Icons.account_balance_wallet_outlined,
                    'Est. Margin',
                    '₹ ${NumberFormat('#,##,###.##').format(estMargin)}',
                  ),
                  _buildInfoRow(
                    Icons.inventory_2_outlined,
                    'Current Stock',
                    qty.toString(),
                  ),
                  _buildInfoRow(
                    Icons.monetization_on_outlined,
                    'Total Value',
                    '₹ ${NumberFormat('#,##,###.##').format(totalValue)}',
                  ),
                  _buildInfoRow(
                    Icons.warning_amber_rounded,
                    'Min Alert',
                    minAlert.toString(),
                  ),
                  _buildInfoRow(
                    Icons.calendar_today_outlined,
                    'Added On',
                    addedOn,
                  ),

                  SizedBox(height: 40.h),
                ],
              ),
            ),
          ),

          // Bottom Actions
          Container(
            padding: EdgeInsets.only(
              left: 20.w,
              right: 20.w,
              top: 16.h,
              bottom: 16.h + MediaQuery.of(context).padding.bottom,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => AdjustStockDialog(
                          productId: product['id'],
                          currentStock: qty,
                          productName: product['name'] ?? 'Unknown',
                        ),
                      ).then((_) {
                        onUpdateSuccess();
                        if (context.mounted) {
                          Navigator.pop(context);
                        }
                      });
                    },
                    icon: Icon(
                      Icons.inventory_rounded,
                      color: Color(0xFFE91E63),
                    ),
                    label: Text(
                      'Adjust Stock',
                      style: GoogleFonts.inter(
                        color: const Color(0xFFE91E63),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFDF2F8),
                      elevation: 0,
                      padding: EdgeInsets.symmetric(vertical: 16.h),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 16.w),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      context.push(
                        '/inventory/edit/${product['id']}',
                        extra: product,
                      );
                    },
                    icon: Icon(Icons.edit_rounded, color: Colors.white),
                    label: Text(
                      'Edit Product',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE91E63),
                      elevation: 0,
                      padding: EdgeInsets.symmetric(vertical: 16.h),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(
    String value,
    String title,
    Color color,
    Color bgColor,
  ) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 20.h),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 24.sp,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          SizedBox(height: 4.h),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 13.sp,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String title, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 12.h),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF64748B), size: 20.sp),
          SizedBox(width: 16.w),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14.sp,
              color: const Color(0xFF334155),
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 14.sp,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }
}

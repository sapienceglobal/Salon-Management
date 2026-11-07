import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import 'package:flutter_salon/features/pos/presentation/providers/cart_provider.dart';
import 'package:flutter_salon/features/pos/presentation/providers/invoice_provider.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';
import 'package:flutter_salon/features/settings/presentation/providers/settings_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/custom_dropdown_field.dart';
import '../../../../core/widgets/skeletons/skeleton_item.dart';
import '../widgets/quick_assign_staff_dialog.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  bool _isLoading = false;
  String? _selectedPaymentMethod = 'cash';
  String? _secondaryPaymentMethod = 'cash';

  void _editTotalAmount() {
    final cartState = ref.read(cartProvider);
    final tc = TextEditingController(text: cartState.total.toStringAsFixed(2));

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
        ),
        title: Text(
          'Edit Total Amount',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        content: TextField(
          controller: tc,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          autofocus: true,
          decoration: InputDecoration(
            prefixText: '₹ ',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: BorderSide(color: AppColors.primary, width: 2.w),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
            onPressed: () {
              final newTotal = double.tryParse(tc.text);
              if (newTotal != null && newTotal >= 0) {
                // To get newTotal, we adjust discount or tip
                // equation: newTotal = subtotal - discount + tip
                // let's clear existing tip and discount first to calculate raw diff
                final rawSubtotal = cartState.subtotal;

                if (newTotal <= rawSubtotal) {
                  // We need to give a discount
                  final flatDiscount = rawSubtotal - newTotal;
                  ref.read(cartProvider.notifier).setTip(0);
                  ref
                      .read(cartProvider.notifier)
                      .setDiscount(flatDiscount, 'flat');
                } else {
                  // We need to add an extra charge (tip)
                  final extraCharge = newTotal - rawSubtotal;
                  ref.read(cartProvider.notifier).setDiscount(0, 'flat');
                  ref.read(cartProvider.notifier).setTip(extraCharge);
                }
              }
              Navigator.pop(ctx);
            },
            child: Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _processCheckout(String status) async {
    final cartState = ref.read(cartProvider);
    if (cartState.items.isEmpty) return;
    final customerId = cartState.customer?['id'];

    final walletBalance = cartState.customer?['wallet_balance'] != null
        ? double.tryParse(cartState.customer!['wallet_balance'].toString()) ??
              0.0
        : 0.0;
    final isWalletInsufficient =
        _selectedPaymentMethod == 'wallet' &&
        walletBalance < (cartState.total + _calculateTaxAmount(cartState));

    if (status == 'paid') {
      if (_selectedPaymentMethod == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select a payment method')),
        );
        return;
      }

      // If wallet is selected but insufficient, we need a secondary method for the remainder
      if (isWalletInsufficient && _secondaryPaymentMethod == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Please select a secondary payment method for the remaining amount',
            ),
          ),
        );
        return;
      }
    }

    setState(() => _isLoading = true);

    try {
      final repository = ref.read(invoiceRepositoryProvider);

      final payload = {
        'customer_id': customerId,
        'items': cartState.items
            .map(
              (i) => {
                'item_type': i.itemType,
                'item_id': i.itemId,
                'quantity': i.quantity,
                'unit_price': i.unitPrice,
                if (i.discount > 0) 'discount': i.discount,
                if (i.staffMemberId != null) 'staff_member_id': i.staffMemberId,
              },
            )
            .toList(),
        if (cartState.discountAmount > 0)
          'discount_amount': cartState.discountAmount,
        'discount_type': cartState.discountType,
        if (cartState.tipAmount > 0) 'tip_amount': cartState.tipAmount,
        'tax_amount':
            ref.read(settingsDataProvider).value?['settings']?['tax_enabled'] ==
                true
            ? _calculateTaxAmount(cartState)
            : 0,
        'status': status == 'draft' ? 'draft' : 'unpaid',
      };

      // 1. Create Invoice
      final response = await repository.createInvoice(payload);
      final invoiceId = response['data']['id'];
      final finalTotalAmount =
          double.tryParse(response['data']['total_amount'].toString()) ??
          cartState.total;

      // 2. Add Payment if status is paid
      if (status == 'paid') {
        try {
          if (isWalletInsufficient) {
            // First pay whatever is in wallet
            await repository.addPayment(
              invoiceId: invoiceId,
              amount: walletBalance,
              paymentMethod: 'wallet',
            );
            // Then pay the remaining
            await repository.addPayment(
              invoiceId: invoiceId,
              amount: finalTotalAmount - walletBalance,
              paymentMethod: _secondaryPaymentMethod!,
            );
          } else {
            // Pay full amount with selected method
            await repository.addPayment(
              invoiceId: invoiceId,
              amount: finalTotalAmount,
              paymentMethod: _selectedPaymentMethod!,
            );
          }
        } catch (e) {
          // If payment fails, we still created the invoice.
          // Ideally we could delete it, or keep it as unpaid.
          // Let's keep it as unpaid and throw the error to UI.
          throw Exception(
            'Invoice created but payment failed: ${e.toString().replaceAll('Exception: ', '')}',
          );
        }
      }

      ref.read(cartProvider.notifier).clearCart();
      ref.invalidate(invoicesListProvider);

      if (mounted) {
        if (status == 'draft') {
          context.pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Draft saved successfully!')),
          );
        } else {
          context.pushReplacement('/payment/$invoiceId');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Invoice created & paid successfully!'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        String msg = e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  double _calculateTaxAmount(CartState cart) {
    final settingsAsync = ref.read(settingsDataProvider);
    final settings = settingsAsync.value?['settings'] ?? {};
    final bool taxEnabled =
        settings['tax_enabled'] == 1 || settings['tax_enabled'] == true;
    if (!taxEnabled) return 0.0;

    final cgst =
        double.tryParse(settings['default_cgst']?.toString() ?? '0') ?? 0;
    final sgst =
        double.tryParse(settings['default_sgst']?.toString() ?? '0') ?? 0;
    final totalTaxPercentage = cgst + sgst;

    final taxableAmount = cart.subtotal - cart.totalDiscount;
    return taxableAmount * (totalTaxPercentage / 100);
  }

  @override
  Widget build(BuildContext context) {
    final cartState = ref.watch(cartProvider);
    final settingsAsync = ref.watch(settingsDataProvider);

    final settings = settingsAsync.value?['settings'] ?? {};
    final bool taxEnabled =
        settings['tax_enabled'] == 1 || settings['tax_enabled'] == true;
    final cgst =
        double.tryParse(settings['default_cgst']?.toString() ?? '0') ?? 0;
    final sgst =
        double.tryParse(settings['default_sgst']?.toString() ?? '0') ?? 0;
    final taxAmount = _calculateTaxAmount(cartState);
    final finalTotal = cartState.total + taxAmount;

    return Scaffold(
      appBar: AppBar(title: Text('Checkout')),
      body: cartState.items.isEmpty
          ? Center(child: Text('Cart is empty'))
          : ListView(
              padding: EdgeInsets.all(20.w),
              children: [
                if (cartState.customer != null) ...[
                  Container(
                    padding: EdgeInsets.all(16.w),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.person, color: AppColors.primary),
                        SizedBox(width: 12.w),
                        Text(
                          '${cartState.customer!['first_name']} ${cartState.customer!['last_name'] ?? ''}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16.sp,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 24.h),
                ],
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Order Summary',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton.icon(
                      icon: Icon(Icons.group_add, size: 20.sp),
                      label: Text('Quick Assign All'),
                      onPressed: () => showQuickAssignStaffDialog(context),
                    ),
                  ],
                ),
                SizedBox(height: 12.h),
                ref
                    .watch(activeStaffListProvider)
                    .when(
                      loading: () => Column(
                        children: [
                          SkeletonItem(
                            width: double.infinity,
                            height: 100.h,
                            margin: EdgeInsets.only(bottom: 16.h),
                          ),
                          SkeletonItem(
                            width: double.infinity,
                            height: 100.h,
                            margin: EdgeInsets.only(bottom: 16.h),
                          ),
                        ],
                      ),
                      error: (err, stack) => Text('Error loading staff: $err'),
                      data: (staffList) {
                        return Column(
                          children: cartState.items.asMap().entries.map((
                            entry,
                          ) {
                            final index = entry.key;
                            final item = entry.value;
                            return Container(
                              margin: EdgeInsets.only(bottom: 16.h),
                              padding: EdgeInsets.all(12.w),
                              decoration: BoxDecoration(
                                border: Border.all(color: AppColors.border),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          item.name,
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16.sp,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      IconButton(
                                        icon: Icon(
                                          Icons.delete,
                                          color: AppColors.error,
                                        ),
                                        onPressed: () {
                                          ref
                                              .read(cartProvider.notifier)
                                              .removeItem(index);
                                        },
                                      ),
                                    ],
                                  ),
                                  Text(
                                    '₹${item.unitPrice} x ${item.quantity} = ₹${(item.unitPrice * item.quantity)}',
                                  ),
                                  SizedBox(height: 8.h),
                                  KeyedSubtree(
                                    key: ValueKey('item_staff_${index}_${item.staffMemberId}'),
                                    child: CustomDropdownField<int?>(
                                      value: item.staffMemberId,
                                      hintText: 'Assign Staff',
                                      prefixIcon: Icons.badge_outlined,
                                      items: [
                                        DropdownMenuItem<int?>(
                                          value: null,
                                          child: Row(
                                            children: [
                                              Icon(
                                                Icons.person_off_outlined,
                                                size: 18.sp,
                                                color: const Color(0xFF94A3B8),
                                              ),
                                              SizedBox(width: 8.w),
                                              Text(
                                                'No Staff (Unassigned)',
                                                style: GoogleFonts.inter(
                                                  fontSize: 14.sp,
                                                  color: const Color(0xFF64748B),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        ...staffList.map((s) {
                                          final name = '${s['first_name'] ?? ''} ${s['last_name'] ?? ''}'.trim();
                                          final initial = name.isNotEmpty ? name[0].toUpperCase() : 'S';
                                          return DropdownMenuItem<int?>(
                                            value: s['id'] as int?,
                                            child: Row(
                                              children: [
                                                CircleAvatar(
                                                  radius: 12.r,
                                                  backgroundColor: const Color(0xFFFDF2F8),
                                                  child: Text(
                                                    initial,
                                                    style: GoogleFonts.inter(
                                                      fontSize: 11.sp,
                                                      color: const Color(0xFFE91E63),
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                                SizedBox(width: 10.w),
                                                Expanded(
                                                  child: Text(
                                                    name.isEmpty ? 'Staff #${s['id']}' : name,
                                                    style: GoogleFonts.inter(
                                                      fontSize: 14.sp,
                                                      color: const Color(0xFF0F172A),
                                                      fontWeight: FontWeight.w500,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          );
                                        }),
                                      ],
                                      onChanged: (val) {
                                        ref
                                            .read(cartProvider.notifier)
                                            .updateItemStaff(index, val);
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        );
                      },
                    ),

                Divider(),
                SizedBox(height: 12.h),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text('Subtotal')),
                    Text('₹ ${cartState.subtotal.toStringAsFixed(2)}'),
                  ],
                ),
                SizedBox(height: 8.h),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text('Discount')),
                    Text('- ₹ ${cartState.totalDiscount.toStringAsFixed(2)}'),
                  ],
                ),
                if (cartState.tipAmount > 0) ...[
                  SizedBox(height: 8.h),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text('Extra Charge / Tip')),
                      Text('+ ₹ ${cartState.tipAmount.toStringAsFixed(2)}'),
                    ],
                  ),
                ],
                if (taxEnabled && taxAmount > 0) ...[
                  SizedBox(height: 8.h),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text('Taxes (CGST $cgst% + SGST $sgst%)'),
                      ),
                      Text('+ ₹ ${taxAmount.toStringAsFixed(2)}'),
                    ],
                  ),
                ],
                SizedBox(height: 16.h),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'Total',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '₹ ${finalTotal.toStringAsFixed(2)}',
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                        ),
                        SizedBox(width: 8.w),
                        InkWell(
                          onTap: _editTotalAmount,
                          borderRadius: BorderRadius.circular(20.r),
                          child: Container(
                            padding: EdgeInsets.all(6.w),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight.withOpacity(0.5),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.edit_rounded,
                              size: 16.sp,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Consumer(
                  builder: (context, ref, _) {
                    final settings = ref.watch(settingsDataProvider).value?['settings'] as Map<String, dynamic>? ?? {};
                    final pointsPer100 = int.tryParse(settings['reward_points_per_100']?.toString() ?? '10') ?? 10;
                    if (pointsPer100 <= 0 || finalTotal <= 0) return const SizedBox.shrink();
                    final earnedPoints = (finalTotal / 100).floor() * pointsPer100;
                    if (earnedPoints <= 0) return const SizedBox.shrink();
                    return Container(
                      margin: EdgeInsets.only(top: 8.h),
                      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 6.h),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(8.r),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.stars_rounded, color: const Color(0xFFD97706), size: 16.sp),
                          SizedBox(width: 6.w),
                          Text(
                            'Customer will earn $earnedPoints loyalty points',
                            style: GoogleFonts.inter(fontSize: 11.sp, fontWeight: FontWeight.w600, color: const Color(0xFF92400E)),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                SizedBox(height: 24.h),
                Text(
                  'Payment Method',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 12.h),
                KeyedSubtree(
                  key: ValueKey('payment_method_$_selectedPaymentMethod'),
                  child: CustomDropdownField<String>(
                    value: _selectedPaymentMethod,
                    hintText: 'Payment Method',
                    prefixIcon: Icons.payments_outlined,
                    items: [
                      DropdownMenuItem(
                        value: 'cash',
                        child: Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(6.w),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0FDF4),
                                borderRadius: BorderRadius.circular(8.r),
                              ),
                              child: Icon(Icons.money_rounded, color: const Color(0xFF16A34A), size: 18.sp),
                            ),
                            SizedBox(width: 10.w),
                            Text(
                              'Cash',
                              style: GoogleFonts.inter(fontSize: 14.sp, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'card',
                        child: Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(6.w),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(8.r),
                              ),
                              child: Icon(Icons.credit_card_rounded, color: const Color(0xFF2563EB), size: 18.sp),
                            ),
                            SizedBox(width: 10.w),
                            Text(
                              'Card / POS',
                              style: GoogleFonts.inter(fontSize: 14.sp, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'upi',
                        child: Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(6.w),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFAF5FF),
                                borderRadius: BorderRadius.circular(8.r),
                              ),
                              child: Icon(Icons.qr_code_scanner_rounded, color: const Color(0xFF9333EA), size: 18.sp),
                            ),
                            SizedBox(width: 10.w),
                            Text(
                              'UPI / QR',
                              style: GoogleFonts.inter(fontSize: 14.sp, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                      if (cartState.customer != null)
                        DropdownMenuItem(
                          value: 'wallet',
                          child: Row(
                            children: [
                              Container(
                                padding: EdgeInsets.all(6.w),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFF7ED),
                                  borderRadius: BorderRadius.circular(8.r),
                                ),
                                child: Icon(Icons.account_balance_wallet_rounded, color: const Color(0xFFEA580C), size: 18.sp),
                              ),
                              SizedBox(width: 10.w),
                              Expanded(
                                child: Text(
                                  'Wallet (Balance: ₹${cartState.customer?['wallet_balance'] ?? 0})',
                                  style: GoogleFonts.inter(fontSize: 14.sp, fontWeight: FontWeight.w500),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                    onChanged: (val) {
                      setState(() {
                        _selectedPaymentMethod = val;
                        _secondaryPaymentMethod = null;
                      });
                    },
                  ),
                ),
                if (_selectedPaymentMethod == 'wallet' &&
                    cartState.customer != null &&
                    (double.tryParse(
                              cartState.customer!['wallet_balance'].toString(),
                            ) ??
                            0.0) <
                        finalTotal) ...[
                  SizedBox(height: 16.h),
                  Text(
                    'Insufficient wallet balance. Select a secondary payment method for the remaining amount (₹${(finalTotal - (double.tryParse(cartState.customer!['wallet_balance'].toString()) ?? 0.0)).toStringAsFixed(2)}):',
                    style: TextStyle(color: AppColors.error, fontSize: 13.sp),
                  ),
                  SizedBox(height: 8.h),
                  KeyedSubtree(
                    key: ValueKey('secondary_payment_method_$_secondaryPaymentMethod'),
                    child: CustomDropdownField<String>(
                      value: _secondaryPaymentMethod,
                      hintText: 'Secondary Payment Method',
                      prefixIcon: Icons.account_balance_wallet_outlined,
                      items: [
                        DropdownMenuItem(
                          value: 'cash',
                          child: Row(
                            children: [
                              Container(
                                padding: EdgeInsets.all(6.w),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF0FDF4),
                                  borderRadius: BorderRadius.circular(8.r),
                                ),
                                child: Icon(Icons.money_rounded, color: const Color(0xFF16A34A), size: 18.sp),
                              ),
                              SizedBox(width: 10.w),
                              Text(
                                'Cash',
                                style: GoogleFonts.inter(fontSize: 14.sp, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'card',
                          child: Row(
                            children: [
                              Container(
                                padding: EdgeInsets.all(6.w),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(8.r),
                                ),
                                child: Icon(Icons.credit_card_rounded, color: const Color(0xFF2563EB), size: 18.sp),
                              ),
                              SizedBox(width: 10.w),
                              Text(
                                'Card / POS',
                                style: GoogleFonts.inter(fontSize: 14.sp, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'upi',
                          child: Row(
                            children: [
                              Container(
                                padding: EdgeInsets.all(6.w),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFAF5FF),
                                  borderRadius: BorderRadius.circular(8.r),
                                ),
                                child: Icon(Icons.qr_code_scanner_rounded, color: const Color(0xFF9333EA), size: 18.sp),
                              ),
                              SizedBox(width: 10.w),
                              Text(
                                'UPI / QR',
                                style: GoogleFonts.inter(fontSize: 14.sp, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ),
                      ],
                      onChanged: (val) {
                        setState(() {
                          _secondaryPaymentMethod = val;
                        });
                      },
                    ),
                  ),
                ],
              ],
            ),
      bottomNavigationBar: cartState.items.isEmpty
          ? null
          : SafeArea(
              child: Container(
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 10,
                      offset: Offset(0, -5),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isLoading
                            ? null
                            : () => _processCheckout('draft'),
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                          side: BorderSide(color: AppColors.primary),
                        ),
                        child: Text('Save Draft'),
                      ),
                    ),
                    SizedBox(width: 16.w),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading
                            ? null
                            : () => _processCheckout('paid'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                        ),
                        child: _isLoading
                            ? SizedBox(
                                height: 20.h,
                                width: 20.w,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text('Confirm Pay'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

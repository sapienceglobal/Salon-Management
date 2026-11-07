import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import 'package:flutter_salon/features/pos/presentation/providers/invoice_provider.dart';
import '../../../../core/widgets/skeletons/skeleton_card.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import '../../utils/invoice_pdf_helper.dart';
import '../../../settings/presentation/providers/settings_provider.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  final int invoiceId;

  const PaymentScreen({super.key, required this.invoiceId});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  bool _isLoading = false;
  final _amountController = TextEditingController();
  String _paymentMethod = 'cash';

  final List<String> _methods = ['cash', 'card', 'upi', 'wallet'];

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _processPayment(double dueAmount) async {
    final amountText = _amountController.text.trim();
    if (amountText.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please enter an amount')));
      return;
    }

    final amount = double.tryParse(amountText);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount')),
      );
      return;
    }

    if (amount > dueAmount) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Amount cannot exceed due amount')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final repository = ref.read(invoiceRepositoryProvider);
      await repository.addPayment(
        invoiceId: widget.invoiceId,
        amount: amount,
        paymentMethod: _paymentMethod,
      );

      ref.invalidate(invoiceDetailProvider(widget.invoiceId));
      ref.invalidate(invoicesListProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment added successfully!')),
        );
        _amountController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildActionButton(
    IconData icon,
    String label,
    bool isPrimary,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 78.w,
        padding: EdgeInsets.symmetric(vertical: 12.h.h),
        decoration: BoxDecoration(
          color: isPrimary ? const Color(0xFFE91E63) : Colors.white,
          borderRadius: BorderRadius.circular(12.r),
          border: isPrimary ? null : Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isPrimary ? Colors.white : const Color(0xFF1A1A2E),
              size: 24.sp,
            ),
            SizedBox(height: 8.h),
            Text(
              label,
              style: GoogleFonts.inter(
                color: isPrimary ? Colors.white : const Color(0xFF1A1A2E),
                fontSize: 11.sp,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final invoiceAsync = ref.watch(invoiceDetailProvider(widget.invoiceId));

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new,
            size: 20.sp,
            color: Color(0xFF1A1A2E),
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Invoice / Receipt',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            fontSize: 16.sp,
            color: const Color(0xFF1A1A2E),
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          invoiceAsync.maybeWhen(
            data: (invoice) {
              final dueAmount =
                  double.tryParse(invoice['due_amount'].toString()) ?? 0.0;
              if (dueAmount <= 0) {
                return TextButton(
                  onPressed: () => context.go('/dashboard'),
                  child: Text(
                    'Done',
                    style: GoogleFonts.inter(
                      color: const Color(0xFFE91E63),
                      fontWeight: FontWeight.bold,
                      fontSize: 16.sp,
                    ),
                  ),
                );
              }
              return SizedBox.shrink();
            },
            orElse: () => SizedBox.shrink(),
          ),
        ],
      ),
      body: invoiceAsync.when(
        loading: () => Padding(
          padding: EdgeInsets.all(16.w),
          child: SkeletonCard(height: 300.h),
        ),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (invoice) {
          final dueAmount =
              double.tryParse(invoice['due_amount']?.toString() ?? '0') ?? 0.0;
          final isPaid = dueAmount <= 0;
          final items = (invoice['items'] as List<dynamic>?) ?? [];
          final invoiceNumber = invoice['invoice_number'] ?? 'INV-#${invoice['id']}';
          final customerName = invoice['customer'] != null && invoice['customer']['first_name'] != null
              ? '${invoice['customer']['first_name']} ${invoice['customer']['last_name'] ?? ''}'.trim()
              : (invoice['customer_first_name'] != null
                  ? '${invoice['customer_first_name']} ${invoice['customer_last_name'] ?? ''}'.trim()
                  : 'Walk-in Customer');
          final phone = invoice['customer']?['phone'] ?? invoice['customer_phone'] ?? '+91 98765 43210';

          DateTime invoiceDate = DateTime.now();
          try {
            if (invoice['created_at'] != null) {
              invoiceDate = DateTime.parse(invoice['created_at'].toString());
            }
          } catch (_) {}
          final dateStr = DateFormat('dd MMM yyyy, hh:mm a').format(invoiceDate);

          String paymentMethod = 'Cash';
          String transactionId = 'TXN-${invoice['id'] ?? '001'}';
          if (invoice['payments'] != null && (invoice['payments'] as List).isNotEmpty) {
            final p = invoice['payments'][0];
            paymentMethod = (p['payment_method'] ?? 'Cash').toString().toUpperCase();
            if (p['transaction_id'] != null && p['transaction_id'].toString().isNotEmpty) {
              transactionId = p['transaction_id'].toString();
            }
          } else if (invoice['payment_method'] != null) {
            paymentMethod = invoice['payment_method'].toString().toUpperCase();
          }

          return ListView(
            padding: EdgeInsets.all(16.w),
            children: [
              // Receipt Card
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24.r),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                padding: EdgeInsets.all(20.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Logo & Badge
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Image.asset(
                              'assets/images/icon-dark.png',
                              height: 40.h,
                              errorBuilder: (c, e, s) => Icon(
                                Icons.spa,
                                color: const Color(0xFFE91E63),
                                size: 40.sp,
                              ),
                            ),
                            SizedBox(width: 8.w),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                RichText(
                                  text: TextSpan(
                                    style: GoogleFonts.poppins(
                                      fontSize: 20.sp,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -0.5,
                                      height: 1.0.h,
                                    ),
                                    children: const [
                                      TextSpan(
                                        text: 'Salon',
                                        style: TextStyle(
                                          color: Color(0xFF1A1A2E),
                                        ),
                                      ),
                                      TextSpan(
                                        text: 'Time',
                                        style: TextStyle(
                                          color: Color(0xFFE91E63),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                RichText(
                                  text: TextSpan(
                                    style: GoogleFonts.inter(
                                      fontSize: 5.5.sp,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.5,
                                      color: Colors.black87,
                                    ),
                                    children: const [
                                      TextSpan(text: 'APPOINTMENTS'),
                                      TextSpan(
                                        text: '  |  ',
                                        style: TextStyle(
                                          color: Color(0xFFE91E63),
                                        ),
                                      ),
                                      TextSpan(text: 'CRM'),
                                      TextSpan(
                                        text: '  |  ',
                                        style: TextStyle(
                                          color: Color(0xFFE91E63),
                                        ),
                                      ),
                                      TextSpan(text: 'SALON'),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 10.w.w,
                            vertical: 8.h.h,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF0F5),
                            borderRadius: BorderRadius.circular(8.r),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.description,
                                color: const Color(0xFFE91E63),
                                size: 16.sp,
                              ),
                              SizedBox(width: 6.w),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Invoice',
                                    style: GoogleFonts.inter(
                                      fontSize: 10.sp,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFFE91E63),
                                      height: 1.0.h,
                                    ),
                                  ),
                                  Text(
                                    '#$invoiceNumber',
                                    style: GoogleFonts.inter(
                                      fontSize: 11.sp,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF1A1A2E),
                                      height: 1.2.h,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 20.h),

                    // Address & Date
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Downtown Branch',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13.sp,
                                  color: const Color(0xFF1A1A2E),
                                ),
                              ),
                              SizedBox(height: 4.h),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    Icons.location_on_outlined,
                                    size: 12.sp,
                                    color: const Color(0xFF64748B),
                                  ),
                                  SizedBox(width: 4.w),
                                  Expanded(
                                    child: Text(
                                      '123 Main Street, Downtown, New Delhi - 110001',
                                      style: GoogleFonts.inter(
                                        fontSize: 10.sp,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 2.h),
                              Row(
                                children: [
                                  Icon(
                                    Icons.phone_outlined,
                                    size: 12.sp,
                                    color: const Color(0xFF64748B),
                                  ),
                                  SizedBox(width: 4.w),
                                  Text(
                                    '+91 98765 43210',
                                    style: GoogleFonts.inter(
                                      fontSize: 10.sp,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Text(
                          dateStr,
                          style: GoogleFonts.inter(
                            fontSize: 11.sp,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),

                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 16.h.h),
                      child: const Divider(
                        color: Color(0xFFF1F5F9),
                        thickness: 1,
                      ),
                    ),

                    // Customer Info
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 26.r,
                          backgroundColor: const Color(0xFFF8FAFC),
                          child: Icon(
                            Icons.person,
                            color: const Color(0xFF94A3B8),
                            size: 24.sp,
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              customerName,
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.bold,
                                fontSize: 14.sp,
                                color: const Color(0xFF1A1A2E),
                              ),
                            ),
                            SizedBox(height: 2.h),
                            Text(
                              phone,
                              style: GoogleFonts.inter(
                                color: const Color(0xFF1A1A2E),
                                fontSize: 12.sp,
                              ),
                            ),
                            SizedBox(height: 4.h),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 8.w.w,
                                vertical: 2.h.h,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF0F5),
                                borderRadius: BorderRadius.circular(4.r),
                              ),
                              child: Text(
                                'Gold Member',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFFE91E63),
                                  fontSize: 9.sp,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    SizedBox(height: 24.h),

                    // Items Header
                    Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: Text(
                            'Item',
                            style: GoogleFonts.inter(
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 1,
                          child: Text(
                            'Qty',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            'Price',
                            textAlign: TextAlign.right,
                            style: GoogleFonts.inter(
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            'Amount',
                            textAlign: TextAlign.right,
                            style: GoogleFonts.inter(
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ],
                    ),

                    SizedBox(height: 8.h),

                    // Items List
                    if (items.isEmpty)
                      Padding(
                        padding: EdgeInsets.symmetric(vertical: 16.h.h),
                        child: Text(
                          'No items',
                          style: GoogleFonts.inter(color: Colors.grey),
                        ),
                      )
                    else
                      ...items.map((item) {
                        final qty = item['quantity'] ?? 1;
                        final name = item['item_name'] ?? 'Service';
                        final price =
                            item['unit_price'] ?? item['total_price'] ?? 0.0;
                        final amount =
                            item['total_price'] ??
                            ((double.tryParse(price.toString()) ?? 0.0) * qty);

                        return Padding(
                          padding: EdgeInsets.symmetric(vertical: 8.h.h),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Container(
                                width: 40.w,
                                height: 40.w,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(8.r),
                                ),
                                child: Icon(
                                  Icons.spa_rounded,
                                  color: const Color(0xFF94A3B8),
                                  size: 20.sp,
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                flex: 3,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      name,
                                      style: GoogleFonts.inter(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12.sp,
                                        color: const Color(0xFF1A1A2E),
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      'Service | 45 mins',
                                      style: GoogleFonts.inter(
                                        fontSize: 10.sp,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Expanded(
                                flex: 1,
                                child: Text(
                                  '$qty',
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.inter(
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF1A1A2E),
                                  ),
                                ),
                              ),
                              Expanded(
                                flex: 2,
                                child: Text(
                                  '₹${double.tryParse(price.toString())?.toInt() ?? 0}',
                                  textAlign: TextAlign.right,
                                  style: GoogleFonts.inter(
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF1A1A2E),
                                  ),
                                ),
                              ),
                              Expanded(
                                flex: 2,
                                child: Text(
                                  '₹${double.tryParse(amount.toString())?.toInt() ?? 0}',
                                  textAlign: TextAlign.right,
                                  style: GoogleFonts.inter(
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF1A1A2E),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),

                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 16.h.h),
                      child: const Divider(
                        color: Color(0xFFF1F5F9),
                        thickness: 1,
                      ),
                    ),

                    // Totals
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Subtotal (${items.length} items)',
                          style: GoogleFonts.inter(
                            fontSize: 13.sp,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        Text(
                          '₹${invoice['subtotal'] ?? 0}',
                          style: GoogleFonts.inter(
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1A1A2E),
                          ),
                        ),
                      ],
                    ),
                    if (invoice['discount_amount'] != null &&
                        (double.tryParse(
                                  invoice['discount_amount'].toString(),
                                ) ??
                                0) >
                            0) ...[
                      SizedBox(height: 8.h),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Discount (WELCOME20)',
                            style: GoogleFonts.inter(
                              fontSize: 13.sp,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          Text(
                            '- ₹${invoice['discount_amount']}',
                            style: GoogleFonts.inter(
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF10B981),
                            ),
                          ),
                        ],
                      ),
                    ],
                    SizedBox(height: 8.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'GST (18%)',
                          style: GoogleFonts.inter(
                            fontSize: 13.sp,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        Text(
                          '₹${invoice['tax_amount'] ?? 0}',
                          style: GoogleFonts.inter(
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1A1A2E),
                          ),
                        ),
                      ],
                    ),

                    SizedBox(height: 16.h),

                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16.w.w,
                        vertical: 12.h.h,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF0F5),
                        borderRadius: BorderRadius.circular(8.r),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Total Amount',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.bold,
                              fontSize: 16.sp,
                              color: const Color(0xFFE91E63),
                            ),
                          ),
                          Text(
                            '₹${invoice['total_amount'] ?? 0}',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.bold,
                              fontSize: 22.sp,
                              color: const Color(0xFFE91E63),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Payment Method & Status
                    if (isPaid) ...[
                      SizedBox(height: 16.h),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 16.w.w,
                          vertical: 12.h.h,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.credit_card,
                              color: const Color(0xFFE91E63),
                              size: 24.sp,
                            ),
                            SizedBox(width: 12.w),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Payment Method',
                                  style: GoogleFonts.inter(
                                    fontSize: 10.sp,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF1A1A2E),
                                  ),
                                ),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.payment,
                                      size: 12.sp,
                                      color: const Color(0xFF64748B),
                                    ),
                                    SizedBox(width: 4.w),
                                    Text(
                                      paymentMethod,
                                      style: GoogleFonts.inter(
                                        fontSize: 11.sp,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const Spacer(),
                            Text(
                              '₹${invoice['total_amount'] ?? 0}',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.w600,
                                fontSize: 13.sp,
                                color: const Color(0xFF1A1A2E),
                              ),
                            ),
                            SizedBox(width: 8.w),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 8.w.w,
                                vertical: 4.h.h,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(16.r),
                              ),
                              child: Row(
                                children: [
                                  Text(
                                    'Paid',
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFF10B981),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11.sp,
                                    ),
                                  ),
                                  SizedBox(width: 4.w),
                                  Icon(
                                    Icons.check_circle,
                                    color: const Color(0xFF10B981),
                                    size: 12.sp,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      SizedBox(height: 16.h),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Transaction ID',
                                style: GoogleFonts.inter(
                                  fontSize: 10.sp,
                                  color: const Color(0xFF94A3B8),
                                ),
                              ),
                              Text(
                                transactionId,
                                style: GoogleFonts.inter(
                                  fontSize: 11.sp,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                'Payment Time',
                                style: GoogleFonts.inter(
                                  fontSize: 10.sp,
                                  color: const Color(0xFF94A3B8),
                                ),
                              ),
                              Text(
                                dateStr,
                                style: GoogleFonts.inter(
                                  fontSize: 11.sp,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      SizedBox(height: 24.h),
                      Container(
                        width: double.infinity,
                        padding: EdgeInsets.symmetric(vertical: 20.h.h),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF0F5),
                          borderRadius: BorderRadius.circular(16.r),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.favorite,
                                  color: const Color(0xFFE91E63),
                                  size: 18.sp,
                                ),
                                SizedBox(width: 8.w),
                                Text(
                                  'Thank You!',
                                  style: GoogleFonts.poppins(
                                    fontStyle: FontStyle.italic,
                                    fontSize: 24.sp,
                                    color: const Color(0xFFE91E63),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 4.h),
                            Text(
                              'We look forward to seeing you again!',
                              style: GoogleFonts.inter(
                                fontSize: 11.sp,
                                color: const Color(0xFF64748B),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              SizedBox(height: 24.h),

              // Bottom Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildActionButton(
                    Icons.download_rounded,
                    'Download',
                    false,
                    () {
                      final business = ref.read(settingsDataProvider).value?['business'] as Map<String, dynamic>?;
                      InvoicePdfHelper.downloadInvoice(context, invoice, business);
                    },
                  ),
                  _buildActionButton(
                    Icons.share_rounded,
                    'Share',
                    false,
                    () {
                      final business = ref.read(settingsDataProvider).value?['business'] as Map<String, dynamic>?;
                      InvoicePdfHelper.shareInvoice(context, invoice, business);
                    },
                  ),
                  _buildActionButton(
                    Icons.print_rounded,
                    'Print',
                    false,
                    () {
                      final business = ref.read(settingsDataProvider).value?['business'] as Map<String, dynamic>?;
                      InvoicePdfHelper.printInvoice(context, invoice, business);
                    },
                  ),
                  _buildActionButton(
                    Icons.receipt_long_rounded,
                    context.canPop() ? 'Back' : 'New Bill',
                    true,
                    () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/dashboard');
                      }
                    },
                  ),
                ],
              ),
              SizedBox(height: 24.h),

              if (!isPaid) ...[
                // If unpaid, allow adding payment
                Text(
                  'Add Remaining Payment',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 16.h),
                TextField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Amount (Max: ₹$dueAmount)',
                    prefixIcon: Icon(Icons.currency_rupee),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                  ),
                ),
                SizedBox(height: 16.h),
                DropdownButtonFormField<String>(
                  initialValue: _paymentMethod,
                  decoration: InputDecoration(
                    labelText: 'Payment Method',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                  ),
                  items: _methods
                      .map(
                        (m) => DropdownMenuItem(
                          value: m,
                          child: Text(m.toUpperCase()),
                        ),
                      )
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _paymentMethod = val);
                  },
                ),
                SizedBox(height: 24.h),
                SizedBox(
                  width: double.infinity,
                  height: 54.h,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                    ),
                    onPressed: _isLoading
                        ? null
                        : () => _processPayment(dueAmount),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                            'Pay Now',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16.sp,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
                SizedBox(height: 16.h),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => context.go('/dashboard'),
                    child: Text('Pay Later & Return Home'),
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../../core/utils/form_validators.dart';
import '../../../../core/utils/form_scroll_helper.dart';
import '../../../../core/widgets/custom_dropdown_field.dart';
import '../providers/expense_provider.dart';

class AddExpenseScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? expense;

  const AddExpenseScreen({super.key, this.expense});

  @override
  ConsumerState<AddExpenseScreen> createState() => _AddExpenseScreenState();
}

class _AddExpenseScreenState extends ConsumerState<AddExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _categoryKey = GlobalKey();

  DateTime _expenseDate = DateTime.now();
  int? _categoryId;

  final _amountController = TextEditingController();
  final _taxPercentController = TextEditingController(text: '0');
  final _referenceController = TextEditingController();
  final _descriptionController = TextEditingController();

  final FocusNode _amountFocus = FocusNode();
  final FocusNode _taxFocus = FocusNode();
  final FocusNode _referenceFocus = FocusNode();
  final FocusNode _descriptionFocus = FocusNode();

  String _paymentMethod = 'cash';
  bool _isLoading = false;

  final List<Map<String, dynamic>> _paymentMethods = [
    {'value': 'cash', 'label': 'Cash'},
    {'value': 'card', 'label': 'Card'},
    {'value': 'upi', 'label': 'UPI / QR'},
    {'value': 'bank_transfer', 'label': 'Bank Transfer'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.expense != null) {
      final e = widget.expense!;
      if (e['expense_date'] != null) {
        try {
          _expenseDate = DateTime.parse(e['expense_date']);
        } catch (_) {}
      }
      _categoryId = e['category_id'] is int
          ? e['category_id']
          : int.tryParse(e['category_id']?.toString() ?? '');
      _amountController.text = e['amount']?.toString() ?? '';

      final amount = double.tryParse(e['amount']?.toString() ?? '') ?? 0;
      final taxAmount = double.tryParse(e['tax_amount']?.toString() ?? '') ?? 0;
      if (amount > 0 && taxAmount > 0) {
        final net = amount - taxAmount;
        if (net > 0) {
          final taxRate = (taxAmount / net) * 100;
          _taxPercentController.text = taxRate.toStringAsFixed(1);
        }
      }

      _paymentMethod = e['payment_method']?.toString().toLowerCase() ?? 'cash';
      if (!_paymentMethods.any((pm) => pm['value'] == _paymentMethod)) {
        _paymentMethod = 'cash';
      }

      String desc = e['description']?.toString() ?? '';
      if (desc.contains('[Ref:')) {
        final parts = desc.split('[Ref:');
        _descriptionController.text = parts[0].trim();
        _referenceController.text =
            parts[1].replaceAll(']', '').trim();
      } else {
        _descriptionController.text = desc;
      }
    }

    _amountController.addListener(() => setState(() {}));
    _taxPercentController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _amountController.dispose();
    _taxPercentController.dispose();
    _referenceController.dispose();
    _descriptionController.dispose();
    _amountFocus.dispose();
    _taxFocus.dispose();
    _referenceFocus.dispose();
    _descriptionFocus.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    FocusManager.instance.primaryFocus?.unfocus();
    final picked = await showDatePicker(
      context: context,
      initialDate: _expenseDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFE91E63),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _expenseDate = picked;
      });
    }
  }

  Future<void> _saveExpense() async {
    final isValid = FormScrollHelper.validateAndScroll(
      context: context,
      formKey: _formKey,
      fields: [
        FormFieldTarget(
          target: _categoryKey,
          isInvalid: () => _categoryId == null,
          errorMessage: 'Please select an Entry Type category',
        ),
        FormFieldTarget(
          target: _amountFocus,
          isInvalid: () {
            final a = double.tryParse(_amountController.text.trim());
            return a == null || a <= 0;
          },
          errorMessage: 'Please enter a valid paid amount',
        ),
      ],
    );

    if (!isValid) return;

    setState(() => _isLoading = true);

    try {
      final grossAmount = double.tryParse(_amountController.text.trim()) ?? 0;
      final taxPercent = double.tryParse(_taxPercentController.text.trim()) ?? 0;
      final tax = grossAmount - (grossAmount / (1 + taxPercent / 100));

      final description = _descriptionController.text.trim();
      final reference = _referenceController.text.trim();
      final finalDescription =
          description + (reference.isNotEmpty ? ' [Ref: $reference]' : '');

      final payload = {
        'category_id': _categoryId,
        'amount': double.parse(grossAmount.toStringAsFixed(2)),
        'tax_amount': double.parse(tax.toStringAsFixed(2)),
        'payment_method': _paymentMethod,
        'expense_date': _expenseDate.toIso8601String().split('T')[0],
        'description': finalDescription,
      };

      final repository = ref.read(expenseRepositoryProvider);
      if (widget.expense == null) {
        await repository.createExpense(payload);
      } else {
        await repository.updateExpense(widget.expense!['id'], payload);
      }

      ref.invalidate(expensesListProvider);

      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10.w),
                Expanded(
                  child: Text(
                    widget.expense == null
                        ? 'Expense recorded successfully!'
                        : 'Expense updated successfully!',
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.r),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final errMsg = e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                SizedBox(width: 10.w),
                Expanded(child: Text(errMsg)),
              ],
            ),
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.r),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildLabel(String text, {bool required = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8.h, left: 2.w),
      child: RichText(
        text: TextSpan(
          text: text,
          style: GoogleFonts.inter(
            color: const Color(0xFF1E1B4B),
            fontWeight: FontWeight.w600,
            fontSize: 13.5.sp,
            letterSpacing: -0.2,
          ),
          children: [
            if (required)
              const TextSpan(
                text: ' *',
                style: TextStyle(
                  color: Color(0xFFE91E63),
                  fontWeight: FontWeight.bold,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(
          color: const Color(0xFFF1E4E8),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE91E63).withOpacity(0.03),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.015),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: EdgeInsets.all(18.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(8.w),
                decoration: BoxDecoration(
                  color: const Color(0xFFFDF2F8),
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: Icon(
                  icon,
                  color: const Color(0xFFE91E63),
                  size: 18.sp,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.bold,
                        fontSize: 15.sp,
                        letterSpacing: -0.2,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF64748B),
                        fontSize: 12.sp,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 18.h),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    FocusNode? focusNode,
    String? prefixText,
    IconData? prefixIcon,
    Widget? suffixIcon,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    bool readOnly = false,
    void Function()? onTap,
  }) {
    return TextFormField(
      controller: controller,
      focusNode: focusNode,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      readOnly: readOnly,
      onTap: onTap,
      cursorColor: const Color(0xFFE91E63),
      style: GoogleFonts.inter(
        fontSize: 14.sp,
        fontWeight: FontWeight.w500,
        color: const Color(0xFF0F172A),
      ),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: GoogleFonts.inter(
          color: const Color(0xFF94A3B8),
          fontSize: 13.5.sp,
          fontWeight: FontWeight.normal,
        ),
        prefixText: prefixText,
        prefixStyle: GoogleFonts.inter(
          color: const Color(0xFFE91E63),
          fontWeight: FontWeight.bold,
          fontSize: 14.sp,
        ),
        prefixIcon: prefixIcon != null
            ? Container(
                margin: EdgeInsets.all(8.w),
                padding: EdgeInsets.all(8.w),
                decoration: BoxDecoration(
                  color: const Color(0xFFFDF2F8),
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: Icon(
                  prefixIcon,
                  color: const Color(0xFFE91E63),
                  size: 18.sp,
                ),
              )
            : null,
        suffixIcon: suffixIcon,
        contentPadding: EdgeInsets.symmetric(
          horizontal: 16.w,
          vertical: maxLines > 1 ? 14.h : 14.h,
        ),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14.r),
          borderSide: const BorderSide(
            color: Color(0xFFF1E4E8),
            width: 1.2,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14.r),
          borderSide: const BorderSide(
            color: Color(0xFFF1E4E8),
            width: 1.2,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14.r),
          borderSide: const BorderSide(
            color: Color(0xFFE91E63),
            width: 1.8,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14.r),
          borderSide: const BorderSide(
            color: Color(0xFFEF4444),
            width: 1.2,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14.r),
          borderSide: const BorderSide(
            color: Color(0xFFEF4444),
            width: 1.8,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(expenseCategoriesProvider);
    final isEditing = widget.expense != null;

    // Calculate Net Amount live
    final grossAmount = double.tryParse(_amountController.text.trim()) ?? 0;
    final taxPercent = double.tryParse(_taxPercentController.text.trim()) ?? 0;
    final tax = grossAmount - (grossAmount / (1 + taxPercent / 100));
    final netAmount = grossAmount - tax;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: Center(
          child: InkWell(
            onTap: () => context.pop(),
            borderRadius: BorderRadius.circular(12.r),
            child: Container(
              padding: EdgeInsets.all(8.w),
              decoration: BoxDecoration(
                color: const Color(0xFFFDF2F8),
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Icon(
                Icons.arrow_back_ios_new_rounded,
                color: const Color(0xFFE91E63),
                size: 16.sp,
              ),
            ),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isEditing ? "Edit Expense" : "Add Expense",
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18.sp,
              ),
            ),
            Text(
              "Financial & Outflow Management",
              style: GoogleFonts.inter(
                color: const Color(0xFFE91E63),
                fontWeight: FontWeight.w500,
                fontSize: 11.sp,
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(1.h),
          child: Container(
            color: const Color(0xFFF1E4E8),
            height: 1.h,
          ),
        ),
      ),
      body: GestureDetector(
        onTap: () => FormScrollHelper.unfocus(),
        behavior: HitTestBehavior.opaque,
        child: Stack(
          children: [
            SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(
                16.w,
                16.h,
                16.w,
                140.h + MediaQuery.of(context).padding.bottom,
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section 1: Expense Details
                    _buildSectionCard(
                      title: 'Expense & Category',
                      subtitle: 'Expense date and entry classification',
                      icon: Icons.receipt_long_outlined,
                      children: [
                        _buildLabel('Date', required: true),
                        InkWell(
                          onTap: _selectDate,
                          borderRadius: BorderRadius.circular(14.r),
                          child: Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 14.w,
                              vertical: 10.h,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14.r),
                              border: Border.all(
                                color: const Color(0xFFF1E4E8),
                                width: 1.2,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: EdgeInsets.all(8.w),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFDF2F8),
                                    borderRadius: BorderRadius.circular(10.r),
                                  ),
                                  child: const Icon(
                                    Icons.calendar_today_outlined,
                                    color: Color(0xFFE91E63),
                                  ),
                                ),
                                SizedBox(width: 12.w),
                                Expanded(
                                  child: Text(
                                    DateFormat('dd MMM yyyy').format(_expenseDate),
                                    style: GoogleFonts.inter(
                                      fontSize: 14.sp,
                                      color: const Color(0xFF0F172A),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                const Icon(
                                  Icons.calendar_month_outlined,
                                  color: Color(0xFF94A3B8),
                                ),
                              ],
                            ),
                          ),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Entry Type', required: true),
                        categoriesAsync.when(
                          data: (categories) => KeyedSubtree(
                            key: _categoryKey,
                            child: CustomDropdownField<int>(
                              value: _categoryId,
                              hintText: 'Select Entry Type',
                              prefixIcon: Icons.category_outlined,
                              items: [
                                ...categories.map<DropdownMenuItem<int>>((cat) {
                                  return DropdownMenuItem<int>(
                                    value: cat['id'],
                                    child: Text(
                                      cat['name'] ?? '',
                                      style: GoogleFonts.inter(
                                        fontSize: 14.sp,
                                        color: const Color(0xFF0F172A),
                                      ),
                                    ),
                                  );
                                }),
                                DropdownMenuItem<int>(
                                  value: -1,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.add_circle_outline, size: 16.sp, color: const Color(0xFFE91E63)),
                                      SizedBox(width: 8.w),
                                      Flexible(
                                        child: Text(
                                          '+ Add New Category',
                                          style: GoogleFonts.inter(
                                            fontSize: 14.sp,
                                            color: const Color(0xFFE91E63),
                                            fontWeight: FontWeight.w600,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              onChanged: (val) async {
                                if (val == -1) {
                                  final nameCtrl = TextEditingController();
                                  final result = await showDialog<String>(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
                                      title: Text('New Category', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                                      content: TextField(
                                        controller: nameCtrl,
                                        autofocus: true,
                                        decoration: InputDecoration(
                                          hintText: 'Category name',
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r)),
                                        ),
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(ctx),
                                          child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF64748B))),
                                        ),
                                        TextButton(
                                          onPressed: () => Navigator.pop(ctx, nameCtrl.text.trim()),
                                          child: Text('Create', style: GoogleFonts.inter(color: const Color(0xFFE91E63), fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ),
                                  );
                                  if (result != null && result.isNotEmpty && mounted) {
                                    try {
                                      final repo = ref.read(expenseRepositoryProvider);
                                      final created = await repo.createExpenseCategory({'name': result});
                                      ref.invalidate(expenseCategoriesProvider);
                                      setState(() => _categoryId = created['id'] is int ? created['id'] : int.tryParse(created['id']?.toString() ?? ''));
                                    } catch (e) {
                                      if (mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text('Error: ${e.toString().replaceAll("Exception: ", "")}'), backgroundColor: Colors.red),
                                        );
                                      }
                                    }
                                  }
                                } else {
                                  setState(() => _categoryId = val);
                                }
                              },
                            ),
                          ),
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(8.0),
                              child: CircularProgressIndicator(
                                color: Color(0xFFE91E63),
                              ),
                            ),
                          ),
                          error: (err, stack) => Text(
                            'Error loading categories',
                            style: GoogleFonts.inter(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 16.h),

                    // Section 2: Amount & Tax
                    _buildSectionCard(
                      title: 'Amount & Tax Breakdown',
                      subtitle: 'Paid amount, applicable tax and net calculation',
                      icon: Icons.payments_outlined,
                      children: [
                        _buildLabel('Paid Amount (₹)', required: true),
                        _buildTextField(
                          controller: _amountController,
                          focusNode: _amountFocus,
                          hintText: '0.00',
                          prefixText: '₹  ',
                          prefixIcon: Icons.currency_rupee_rounded,
                          keyboardType: TextInputType.number,
                          validator: FormValidators.price('Paid Amount'),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Tax (%)'),
                        _buildTextField(
                          controller: _taxPercentController,
                          focusNode: _taxFocus,
                          hintText: '0',
                          prefixIcon: Icons.percent_rounded,
                          keyboardType: TextInputType.number,
                        ),
                        SizedBox(height: 16.h),

                      // Net Amount Live Highlight Card
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 16.w,
                          vertical: 14.h,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFFFFF1F5),
                              Color(0xFFFDF2F8),
                              Colors.white,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16.r),
                          border: Border.all(
                            color: const Color(0xFFFCE7F3),
                            width: 1.2,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Row(
                                children: [
                                  Container(
                                    padding: EdgeInsets.all(8.w),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFDF2F8),
                                      borderRadius: BorderRadius.circular(10.r),
                                      border: Border.all(
                                        color: const Color(0xFFFBCFE8),
                                      ),
                                    ),
                                    child: Icon(
                                      Icons.calculate_outlined,
                                      color: const Color(0xFFE91E63),
                                      size: 20.sp,
                                    ),
                                  ),
                                  SizedBox(width: 10.w),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Net Amount',
                                          style: GoogleFonts.inter(
                                            color: const Color(0xFF0F172A),
                                            fontWeight: FontWeight.w600,
                                            fontSize: 13.5.sp,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          'Amount without tax deduction',
                                          style: GoogleFonts.inter(
                                            color: const Color(0xFF64748B),
                                            fontSize: 11.sp,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(width: 8.w),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                '₹${netAmount.toStringAsFixed(2)}',
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFFE91E63),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 17.sp,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Section 3: Payment Details
                  _buildSectionCard(
                    title: 'Payment & Reference',
                    subtitle: 'Transaction method, payment ref & remarks',
                    icon: Icons.account_balance_wallet_outlined,
                    children: [
                      _buildLabel('Payment Mode', required: true),
                      CustomDropdownField<String>(
                        value: _paymentMethod,
                        hintText: 'Select Payment Mode',
                        prefixIcon: Icons.credit_card_outlined,
                        items: _paymentMethods.map((pm) {
                          return DropdownMenuItem<String>(
                            value: pm['value'],
                            child: Text(
                              pm['label'],
                              style: GoogleFonts.inter(
                                fontSize: 14.sp,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _paymentMethod = val);
                        },
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Reference Number / Transaction ID'),
                      _buildTextField(
                        controller: _referenceController,
                        focusNode: _referenceFocus,
                        hintText: 'e.g. TXN123456 / Cheque No.',
                        prefixIcon: Icons.tag_rounded,
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Notes & Description'),
                      _buildTextField(
                        controller: _descriptionController,
                        focusNode: _descriptionFocus,
                        hintText:
                            'Write details of expense, vendor invoice notes...',
                        prefixIcon: Icons.edit_note_rounded,
                        maxLines: 3,
                      ),
                    ],
                  ),
                  SizedBox(height: 20.h),
                ],
              ),
            ),
          ),

          // Sticky Bottom Actions
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: EdgeInsets.only(
                left: 16.w,
                right: 16.w,
                top: 14.h,
                bottom: 14.h + MediaQuery.of(context).padding.bottom,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(
                    color: const Color(0xFFF1E4E8),
                    width: 1.h,
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: OutlinedButton(
                      onPressed: () => context.pop(),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: const Color(0xFFF8FAFC),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                        padding: EdgeInsets.symmetric(vertical: 14.h, horizontal: 8.w),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14.r),
                        ),
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Cancel',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF475569),
                            fontWeight: FontWeight.w600,
                            fontSize: 15.sp,
                          ),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    flex: 3,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFFE91E63),
                            Color(0xFFD81B60),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(14.r),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFE91E63).withOpacity(0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _saveExpense,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: EdgeInsets.symmetric(vertical: 14.h, horizontal: 8.w),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14.r),
                          ),
                        ),
                        child: _isLoading
                            ? SizedBox(
                                height: 20.h,
                                width: 20.w,
                                child: const CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2.2,
                                ),
                              )
                            : FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.check_circle_outline_rounded,
                                      color: Colors.white,
                                    ),
                                    SizedBox(width: 6.w),
                                    Text(
                                      isEditing ? 'Save Changes' : 'Save Expense',
                                      style: GoogleFonts.inter(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15.sp,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
}

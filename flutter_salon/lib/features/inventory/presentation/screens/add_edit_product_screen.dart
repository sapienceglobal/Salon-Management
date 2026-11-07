import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import 'package:flutter_salon/features/inventory/data/inventory_repository.dart';
import 'package:flutter_salon/features/inventory/presentation/providers/inventory_provider.dart';
import '../../../../core/utils/form_validators.dart';
import '../../../../core/utils/form_scroll_helper.dart';
import '../../../../core/widgets/custom_dropdown_field.dart';
import 'package:flutter_salon/core/network/dio_client.dart';

class AddEditProductScreen extends ConsumerStatefulWidget {
  final int? productId;
  final Map<String, dynamic>? productData;

  const AddEditProductScreen({super.key, this.productId, this.productData});

  @override
  ConsumerState<AddEditProductScreen> createState() =>
      _AddEditProductScreenState();
}

class _AddEditProductScreenState extends ConsumerState<AddEditProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final _categoryKey = GlobalKey();
  final _brandKey = GlobalKey();

  final FocusNode _nameFocus = FocusNode();
  final FocusNode _skuFocus = FocusNode();
  final FocusNode _sellingPriceFocus = FocusNode();
  final FocusNode _costPriceFocus = FocusNode();
  final FocusNode _stockQuantityFocus = FocusNode();

  bool _isLoading = false;

  File? _imageFile;
  final _picker = ImagePicker();

  final _nameController = TextEditingController();
  final _skuController = TextEditingController();
  final _barcodeController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _costPriceController = TextEditingController();
  final _sellingPriceController = TextEditingController();
  final _stockQuantityController = TextEditingController();
  final _minAlertController = TextEditingController();

  DateTime? _expiryDate;

  String? _selectedCategory;
  String? _selectedBrand;
  String? _selectedSupplier;

  final List<String> _categories = [
    'Hair Care',
    'Skin Care',
    'Nail Care',
    'Makeup',
    'Body Care',
  ];
  final List<String> _brands = [
    'L\'Oréal',
    'Matrix',
    'Wella',
    'Schwarzkopf',
    'Olaplex',
  ];
  final List<String> _suppliers = [
    'Beauty World Pvt. Ltd.',
    'Salon Supplies Co.',
    'Global Cosmetics',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.productData != null) {
      final p = widget.productData!;
      _nameController.text = p['name'] ?? '';
      _skuController.text = p['sku'] ?? '';
      _barcodeController.text = p['barcode'] ?? '';
      _descriptionController.text = p['description'] ?? '';
      _costPriceController.text = p['cost_price']?.toString() ?? '';
      _sellingPriceController.text = p['selling_price']?.toString() ?? '';
      _stockQuantityController.text = p['stock_quantity']?.toString() ?? '0';
      _minAlertController.text = p['min_stock_alert']?.toString() ?? '0';

      if (p['expiry_date'] != null && p['expiry_date'].toString().isNotEmpty) {
        try {
          _expiryDate = DateTime.parse(p['expiry_date']);
        } catch (_) {}
      }

      if (_categories.contains(p['category'])) {
        _selectedCategory = p['category'];
      }
      if (_brands.contains(p['brand'])) _selectedBrand = p['brand'];
      if (_suppliers.contains(p['supplier'])) {
        _selectedSupplier = p['supplier'];
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _skuController.dispose();
    _barcodeController.dispose();
    _descriptionController.dispose();
    _costPriceController.dispose();
    _sellingPriceController.dispose();
    _stockQuantityController.dispose();
    _minAlertController.dispose();
    _nameFocus.dispose();
    _skuFocus.dispose();
    _sellingPriceFocus.dispose();
    _costPriceFocus.dispose();
    _stockQuantityFocus.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
      });
    }
  }

  Future<void> _selectExpiryDate() async {
    FocusManager.instance.primaryFocus?.unfocus();
    final picked = await showDatePicker(
      context: context,
      initialDate: _expiryDate ?? DateTime.now().add(const Duration(days: 180)),
      firstDate: DateTime.now(),
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
        _expiryDate = picked;
      });
    }
  }

  Future<void> _submit() async {
    final isValid = FormScrollHelper.validateAndScroll(
      context: context,
      formKey: _formKey,
      fields: [
        FormFieldTarget(
          target: _nameFocus,
          isInvalid: () => _nameController.text.trim().length < 2,
          errorMessage: 'Please enter a valid product name',
        ),
        FormFieldTarget(
          target: _categoryKey,
          isInvalid: () => _selectedCategory == null || _selectedCategory!.isEmpty,
          errorMessage: 'Please select a category',
        ),
        FormFieldTarget(
          target: _brandKey,
          isInvalid: () => _selectedBrand == null || _selectedBrand!.isEmpty,
          errorMessage: 'Please select a brand',
        ),
        FormFieldTarget(
          target: _sellingPriceFocus,
          isInvalid: () {
            final p = double.tryParse(_sellingPriceController.text.trim());
            return p == null || p < 0;
          },
          errorMessage: 'Please enter a valid selling price',
        ),
        FormFieldTarget(
          target: _stockQuantityFocus,
          isInvalid: () {
            final q = int.tryParse(_stockQuantityController.text.trim());
            return q == null || q < 0;
          },
          errorMessage: 'Please enter a valid stock quantity',
        ),
      ],
    );

    if (!isValid) return;
    setState(() => _isLoading = true);

    try {
      final payload = {
        'name': _nameController.text.trim(),
        'sku': _skuController.text.trim().isEmpty
            ? null
            : _skuController.text.trim(),
        'barcode': _barcodeController.text.trim().isEmpty
            ? null
            : _barcodeController.text.trim(),
        'description': _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        'brand': _selectedBrand,
        'category': _selectedCategory,
        'supplier': _selectedSupplier,
        'expiry_date': _expiryDate != null
            ? DateFormat('yyyy-MM-dd').format(_expiryDate!)
            : null,
        'cost_price': double.tryParse(_costPriceController.text.trim()) ?? 0,
        'selling_price':
            double.tryParse(_sellingPriceController.text.trim()) ?? 0,
        'stock_quantity':
            int.tryParse(_stockQuantityController.text.trim()) ?? 0,
        'min_stock_alert': int.tryParse(_minAlertController.text.trim()) ?? 0,
      };

      final repository = ref.read(inventoryRepositoryProvider);

      if (widget.productId != null) {
        await repository.updateProduct(
          widget.productId!,
          payload,
          imagePath: _imageFile?.path,
        );
      } else {
        await repository.createProduct(payload, imagePath: _imageFile?.path);
      }

      if (mounted) {
        ref.invalidate(inventoryListProvider);
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10.w),
                Text(
                  widget.productId != null
                      ? 'Product updated successfully!'
                      : 'Product created successfully!',
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
                Expanded(child: Text('Error: $errMsg')),
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

  Widget _buildPhotoUploader() {
    final existingUrl = widget.productData?['image_url'];
    final hasExistingUrl = existingUrl != null && existingUrl.toString().isNotEmpty;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(18.w),
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
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(
          color: const Color(0xFFFCE7F3),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE91E63).withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: _pickImage,
            child: Stack(
              children: [
                Container(
                  width: 74.w,
                  height: 74.h,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16.r),
                    border: Border.all(
                      color: const Color(0xFFE91E63),
                      width: 2.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFE91E63).withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14.r),
                    child: _imageFile != null
                        ? Image.file(
                            _imageFile!,
                            fit: BoxFit.cover,
                            width: 74.w,
                            height: 74.h,
                          )
                        : (hasExistingUrl
                            ? Image.network(
                                resolveMediaUrl(existingUrl),
                                fit: BoxFit.cover,
                                width: 74.w,
                                height: 74.h,
                                errorBuilder: (ctx, err, stack) => Container(
                                  color: const Color(0xFFFDF2F8),
                                  child: Icon(
                                    Icons.inventory_2_outlined,
                                    size: 38.sp,
                                    color: const Color(0xFFF472B6),
                                  ),
                                ),
                              )
                            : Container(
                                color: const Color(0xFFFDF2F8),
                                child: Icon(
                                  Icons.inventory_2_outlined,
                                  size: 38.sp,
                                  color: const Color(0xFFF472B6),
                                ),
                              )),
                  ),
                ),
                Positioned(
                  bottom: -2,
                  right: -2,
                  child: Container(
                    padding: EdgeInsets.all(5.w),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE91E63),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: Icon(
                      Icons.camera_alt_rounded,
                      color: Colors.white,
                      size: 13.sp,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: 18.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Product Image',
                  style: GoogleFonts.poppins(
                    fontSize: 15.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 2.h),
                Text(
                  'Upload product packaging or retail shot',
                  style: GoogleFonts.inter(
                    fontSize: 12.sp,
                    color: const Color(0xFF64748B),
                  ),
                ),
                SizedBox(height: 10.h),
                Row(
                  children: [
                    InkWell(
                      onTap: _pickImage,
                      borderRadius: BorderRadius.circular(8.r),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 12.w,
                          vertical: 6.h,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE91E63),
                          borderRadius: BorderRadius.circular(8.r),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.upload_file_rounded,
                              color: Colors.white,
                              size: 14.sp,
                            ),
                            SizedBox(width: 4.w),
                            Text(
                              _imageFile != null ? 'Change' : 'Upload',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (_imageFile != null) ...[
                      SizedBox(width: 8.w),
                      InkWell(
                        onTap: () => setState(() => _imageFile = null),
                        borderRadius: BorderRadius.circular(8.r),
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 10.w,
                            vertical: 6.h,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8.r),
                          ),
                          child: Text(
                            'Remove',
                            style: GoogleFonts.inter(
                              color: const Color(0xFF64748B),
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.productId != null;

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
              isEditing ? "Edit Product" : "Add Product",
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18.sp,
              ),
            ),
            Text(
              "Inventory & Retail Catalog",
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
                    _buildPhotoUploader(),
                    SizedBox(height: 16.h),

                    // Section 1: Basic Product Information
                    _buildSectionCard(
                      title: 'Product Information',
                      subtitle: 'Name, brand, category, SKU and barcode',
                      icon: Icons.inventory_2_outlined,
                      children: [
                        _buildLabel('Product Name', required: true),
                        _buildTextField(
                          controller: _nameController,
                          focusNode: _nameFocus,
                          hintText: 'e.g. Keratin Smooth Shampoo 250ml',
                          prefixIcon: Icons.shopping_bag_outlined,
                          validator: FormValidators.minLength('Product Name', 2),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Category', required: true),
                        KeyedSubtree(
                          key: _categoryKey,
                          child: CustomDropdownField<String>(
                            value: _selectedCategory,
                            hintText: 'Select category',
                            prefixIcon: Icons.category_outlined,
                            items: _categories
                                .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                                .toList(),
                            onChanged: (v) => setState(() => _selectedCategory = v),
                          ),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Brand', required: true),
                        KeyedSubtree(
                          key: _brandKey,
                          child: CustomDropdownField<String>(
                            value: _selectedBrand,
                            hintText: 'Select brand',
                            prefixIcon: Icons.branding_watermark_outlined,
                            items: _brands
                                .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                                .toList(),
                            onChanged: (v) => setState(() => _selectedBrand = v),
                          ),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('SKU / Product Code', required: true),
                        _buildTextField(
                          controller: _skuController,
                          focusNode: _skuFocus,
                          hintText: 'e.g. SKU-HAIR-001',
                          prefixIcon: Icons.tag_rounded,
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Barcode (Optional)'),
                        _buildTextField(
                          controller: _barcodeController,
                          hintText: 'e.g. 8901030700012',
                          prefixIcon: Icons.qr_code_rounded,
                          suffixIcon: IconButton(
                            icon: const Icon(
                              Icons.qr_code_scanner_rounded,
                              color: Color(0xFFE91E63),
                            ),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Ready to scan barcode'),
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            },
                          ),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Description'),
                        _buildTextField(
                          controller: _descriptionController,
                          hintText:
                              'Enter product ingredients, usage instructions or details...',
                          prefixIcon: Icons.description_outlined,
                          maxLines: 3,
                        ),
                      ],
                    ),
                    SizedBox(height: 16.h),

                    // Section 2: Pricing & Margins
                    _buildSectionCard(
                      title: 'Pricing & Margins',
                      subtitle: 'Retail selling price and wholesale purchase cost',
                      icon: Icons.payments_outlined,
                      children: [
                        _buildLabel('Unit Selling Price (₹)', required: true),
                        _buildTextField(
                          controller: _sellingPriceController,
                          focusNode: _sellingPriceFocus,
                          hintText: '0.00',
                          prefixText: '₹  ',
                          prefixIcon: Icons.sell_outlined,
                          keyboardType: TextInputType.number,
                          validator: FormValidators.price('Selling Price'),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Purchase Cost Price (₹)', required: true),
                        _buildTextField(
                          controller: _costPriceController,
                          focusNode: _costPriceFocus,
                          hintText: '0.00',
                          prefixText: '₹  ',
                          prefixIcon: Icons.receipt_outlined,
                          keyboardType: TextInputType.number,
                          validator: FormValidators.price(
                            'Purchase Price',
                            isRequired: false,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 16.h),

                    // Section 3: Stock Control & Supplier
                    _buildSectionCard(
                      title: 'Stock Control & Supplier',
                      subtitle: 'Quantity on hand, low-stock threshold & supplier info',
                      icon: Icons.warehouse_outlined,
                      children: [
                        _buildLabel('Initial Stock Quantity', required: true),
                        _buildTextField(
                          controller: _stockQuantityController,
                          focusNode: _stockQuantityFocus,
                          hintText: '0',
                          prefixIcon: Icons.inventory_outlined,
                          keyboardType: TextInputType.number,
                          validator: FormValidators.quantity('Stock Quantity'),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Min. Stock Alert Threshold'),
                        _buildTextField(
                          controller: _minAlertController,
                          hintText: '5',
                          prefixIcon: Icons.warning_amber_rounded,
                          keyboardType: TextInputType.number,
                        ),
                        SizedBox(height: 16.h),

                      _buildLabel('Expiry Date (Optional)'),
                      InkWell(
                        onTap: _selectExpiryDate,
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
                              color: _expiryDate != null
                                  ? const Color(0xFFE91E63)
                                  : const Color(0xFFF1E4E8),
                              width: _expiryDate != null ? 1.5 : 1.2,
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
                                  Icons.event_outlined,
                                  color: Color(0xFFE91E63),
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                child: Text(
                                  _expiryDate != null
                                      ? DateFormat('dd MMM yyyy')
                                          .format(_expiryDate!)
                                      : 'Select expiry date',
                                  style: GoogleFonts.inter(
                                    fontSize: 14.sp,
                                    color: _expiryDate != null
                                        ? const Color(0xFF0F172A)
                                        : const Color(0xFF94A3B8),
                                    fontWeight: _expiryDate != null
                                        ? FontWeight.w500
                                        : FontWeight.normal,
                                  ),
                                ),
                              ),
                              if (_expiryDate != null)
                                InkWell(
                                  onTap: () => setState(() => _expiryDate = null),
                                  borderRadius: BorderRadius.circular(20.r),
                                  child: const Padding(
                                    padding: EdgeInsets.all(4.0),
                                    child: Icon(
                                      Icons.close_rounded,
                                      color: Color(0xFF94A3B8),
                                    ),
                                  ),
                                )
                              else
                                const Icon(
                                  Icons.calendar_month_outlined,
                                  color: Color(0xFF94A3B8),
                                ),
                            ],
                          ),
                        ),
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Supplier'),
                      CustomDropdownField<String>(
                        value: _selectedSupplier,
                        hintText: 'Select supplier',
                        prefixIcon: Icons.local_shipping_outlined,
                        items: _suppliers
                            .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                            .toList(),
                        onChanged: (v) => setState(() => _selectedSupplier = v),
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
                        padding: EdgeInsets.symmetric(vertical: 14.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14.r),
                        ),
                      ),
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
                        onPressed: _isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: EdgeInsets.symmetric(vertical: 14.h),
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
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(
                                    Icons.check_circle_outline_rounded,
                                    color: Colors.white,
                                  ),
                                  SizedBox(width: 8.w),
                                  Text(
                                    isEditing ? 'Save Changes' : 'Add Product',
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

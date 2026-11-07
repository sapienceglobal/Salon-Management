import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import 'package:flutter_salon/features/services/data/service_provider.dart';
import 'package:flutter_salon/core/network/dio_client.dart';
import '../../../../core/utils/form_validators.dart';
import '../../../../core/utils/form_scroll_helper.dart';
import '../../../../core/widgets/custom_dropdown_field.dart';

class AddEditServiceScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? service;

  const AddEditServiceScreen({super.key, this.service});

  @override
  ConsumerState<AddEditServiceScreen> createState() =>
      _AddEditServiceScreenState();
}

class _AddEditServiceScreenState extends ConsumerState<AddEditServiceScreen> {
  final _formKey = GlobalKey<FormState>();
  final _categoryKey = GlobalKey();

  late TextEditingController _nameController;
  late TextEditingController _descriptionController;
  late TextEditingController _priceController;
  late TextEditingController _durationController;

  final FocusNode _nameFocus = FocusNode();
  final FocusNode _priceFocus = FocusNode();
  final FocusNode _durationFocus = FocusNode();
  final FocusNode _descriptionFocus = FocusNode();

  int? _categoryId;
  String _targetGender = 'unisex';
  bool _isActive = true;

  final List<File> _serviceImages = [];
  List<String> _existingImages = [];

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(
      text: widget.service?['name'] ?? '',
    );
    _descriptionController = TextEditingController(
      text: widget.service?['description'] ?? '',
    );
    _priceController = TextEditingController(
      text: widget.service?['price']?.toString() ?? '',
    );
    _durationController = TextEditingController(
      text:
          widget.service?['duration_minutes']?.toString() ??
          widget.service?['duration']?.toString() ??
          '',
    );

    if (widget.service != null) {
      _categoryId = widget.service!['category_id'] is int
          ? widget.service!['category_id']
          : int.tryParse(widget.service!['category_id']?.toString() ?? '');

      _targetGender = widget.service!['target_gender'] ?? 'unisex';
      _isActive = (widget.service!['status'] ?? 'active') == 'active';

      final imageUrl = widget.service!['image_url']?.toString() ?? '';
      if (imageUrl.isNotEmpty) {
        _existingImages = imageUrl
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList();
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _durationController.dispose();
    _nameFocus.dispose();
    _priceFocus.dispose();
    _durationFocus.dispose();
    _descriptionFocus.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final pickedFiles = await picker.pickMultiImage(imageQuality: 80);
    if (pickedFiles.isNotEmpty) {
      setState(() {
        _serviceImages.addAll(pickedFiles.map((f) => File(f.path)));
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _serviceImages.removeAt(index);
    });
  }

  Future<void> _saveService() async {
    final isValid = FormScrollHelper.validateAndScroll(
      context: context,
      formKey: _formKey,
      fields: [
        FormFieldTarget(
          target: _nameFocus,
          isInvalid: () => _nameController.text.trim().length < 2,
          errorMessage: 'Please enter a valid service name',
        ),
        FormFieldTarget(
          target: _categoryKey,
          isInvalid: () => _categoryId == null,
          errorMessage: 'Please select a category',
        ),
        FormFieldTarget(
          target: _priceFocus,
          isInvalid: () {
            final p = double.tryParse(_priceController.text.trim());
            return p == null || p < 0;
          },
          errorMessage: 'Please enter a valid price',
        ),
        FormFieldTarget(
          target: _durationFocus,
          isInvalid: () {
            final d = int.tryParse(_durationController.text.trim());
            return d == null || d <= 0;
          },
          errorMessage: 'Please enter a valid duration',
        ),
        FormFieldTarget(
          target: _descriptionFocus,
          isInvalid: () => _descriptionController.text.trim().isEmpty,
          errorMessage: 'Please enter a description',
        ),
      ],
    );

    if (!isValid) return;

    setState(() => _isLoading = true);
    try {
      final repository = ref.read(serviceRepositoryProvider);
      final data = <String, dynamic>{
        'name': _nameController.text.trim(),
        'description': _descriptionController.text.trim(),
        'price': double.tryParse(_priceController.text.trim()) ?? 0.0,
        'duration_minutes': int.tryParse(_durationController.text.trim()) ?? 0,
        'category_id': _categoryId,
        'gender_target': _targetGender,
        'is_active': _isActive,
      };

      if (widget.service != null || _existingImages.isNotEmpty) {
        data['existing_images'] = _existingImages.join(',');
      }

      if (_serviceImages.isNotEmpty) {
        data['images'] = await Future.wait(
          _serviceImages.map((f) => MultipartFile.fromFile(f.path)).toList(),
        );
      }

      if (widget.service == null) {
        await repository.createService(data);
      } else {
        await repository.updateService(widget.service!['id'], data);
      }

      ref.invalidate(servicesListProvider);

      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10.w),
                const Text('Service saved successfully!'),
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

  Widget _buildGenderSelector() {
    final options = [
      {'key': 'female', 'label': 'Female', 'icon': Icons.female_rounded},
      {'key': 'male', 'label': 'Male', 'icon': Icons.male_rounded},
      {'key': 'unisex', 'label': 'Unisex', 'icon': Icons.transgender_rounded},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel('Target Gender', required: true),
        Row(
          children: options.map((opt) {
            final isSelected = _targetGender == opt['key'];
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _targetGender = opt['key'] as String),
                child: Container(
                  margin: EdgeInsets.only(
                    right: opt['key'] != 'unisex' ? 8.w : 0,
                  ),
                  padding: EdgeInsets.symmetric(vertical: 12.h),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFFDF2F8) : Colors.white,
                    borderRadius: BorderRadius.circular(14.r),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFFE91E63)
                          : const Color(0xFFF1E4E8),
                      width: isSelected ? 1.6 : 1.2,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        opt['icon'] as IconData,
                        size: 18.sp,
                        color: isSelected
                            ? const Color(0xFFE91E63)
                            : const Color(0xFF64748B),
                      ),
                      SizedBox(width: 6.w),
                      Text(
                        opt['label'] as String,
                        style: GoogleFonts.inter(
                          fontSize: 13.sp,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.w500,
                          color: isSelected
                              ? const Color(0xFFE91E63)
                              : const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildMediaSection() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(18.w),
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
        ],
      ),
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
                child: const Icon(
                  Icons.photo_library_outlined,
                  color: Color(0xFFE91E63),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Service Images & Portfolio',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.bold,
                        fontSize: 15.sp,
                        letterSpacing: -0.2,
                      ),
                    ),
                    Text(
                      'Showcase styling results for client bookings',
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
          SizedBox(height: 16.h),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                GestureDetector(
                  onTap: _pickImages,
                  child: Container(
                    width: 90.w,
                    height: 90.h,
                    margin: EdgeInsets.only(right: 12.w),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFDF2F8),
                      borderRadius: BorderRadius.circular(16.r),
                      border: Border.all(
                        color: const Color(0xFFFCE7F3),
                        width: 1.5,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.add_photo_alternate_rounded,
                          color: Color(0xFFE91E63),
                          size: 28,
                        ),
                        SizedBox(height: 4.h),
                        Text(
                          'Add Photos',
                          style: GoogleFonts.inter(
                            color: const Color(0xFFE91E63),
                            fontWeight: FontWeight.w600,
                            fontSize: 11.sp,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                ..._existingImages.asMap().entries.map((entry) {
                  final index = entry.key;
                  final rawUrl = entry.value;
                  final fullUrl = resolveMediaUrl(rawUrl);

                  return Container(
                    width: 90.w,
                    height: 90.h,
                    margin: EdgeInsets.only(right: 12.w),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16.r),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.network(
                          fullUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (ctx, err, stack) => Container(
                            color: const Color(0xFFF1F5F9),
                            child: Icon(Icons.broken_image_rounded, size: 28.sp, color: const Color(0xFF94A3B8)),
                          ),
                        ),
                        Align(
                          alignment: Alignment.topRight,
                          child: GestureDetector(
                            onTap: () {
                          setState(() {
                            _existingImages.removeAt(index);
                          });
                        },
                        child: Container(
                          margin: EdgeInsets.all(4.w),
                          padding: EdgeInsets.all(3.w),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            size: 14,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
                ..._serviceImages.asMap().entries.map((entry) {
                  final index = entry.key;
                  final file = entry.value;
                  return Container(
                    width: 90.w,
                    height: 90.h,
                    margin: EdgeInsets.only(right: 12.w),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16.r),
                      image: DecorationImage(
                        image: FileImage(file),
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Align(
                      alignment: Alignment.topRight,
                      child: GestureDetector(
                        onTap: () => _removeImage(index),
                        child: Container(
                          margin: EdgeInsets.all(4.w),
                          padding: EdgeInsets.all(3.w),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            size: 14,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesListProvider);
    final isEditing = widget.service != null;

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
              isEditing ? "Edit Service" : "Add Service",
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18.sp,
              ),
            ),
            Text(
              "Salon Menu & Treatments",
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
                    _buildMediaSection(),
                    SizedBox(height: 16.h),

                    // Section 1: Basic Information
                    _buildSectionCard(
                      title: 'Service Information',
                      subtitle: 'Name, category and client target audience',
                      icon: Icons.spa_outlined,
                      children: [
                        _buildLabel('Service Name', required: true),
                        _buildTextField(
                          controller: _nameController,
                          focusNode: _nameFocus,
                          hintText: 'e.g. Luxury Hair Spa & Treatment',
                          prefixIcon: Icons.cut_outlined,
                          validator: FormValidators.minLength('Service Name', 2),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Category', required: true),
                        categoriesAsync.when(
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
                          data: (categories) {
                            return KeyedSubtree(
                              key: _categoryKey,
                              child: CustomDropdownField<int>(
                                value: _categoryId,
                                hintText: 'Select Category',
                                prefixIcon: Icons.category_outlined,
                                items: categories.map<DropdownMenuItem<int>>((cat) {
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
                                }).toList(),
                                onChanged: (val) =>
                                    setState(() => _categoryId = val),
                              ),
                            );
                          },
                        ),
                        SizedBox(height: 16.h),

                        _buildGenderSelector(),
                      ],
                    ),
                    SizedBox(height: 16.h),

                    // Section 2: Pricing & Timing
                    _buildSectionCard(
                      title: 'Pricing & Timing',
                      subtitle: 'Customer billing charge and estimated duration',
                      icon: Icons.schedule_outlined,
                      children: [
                        _buildLabel('Price (₹)', required: true),
                        _buildTextField(
                          controller: _priceController,
                          focusNode: _priceFocus,
                          hintText: 'e.g. 1200',
                          prefixText: '₹  ',
                          prefixIcon: Icons.currency_rupee_rounded,
                          keyboardType: TextInputType.number,
                          validator: FormValidators.price('Price'),
                        ),
                        SizedBox(height: 16.h),

                        _buildLabel('Duration (Minutes)', required: true),
                        _buildTextField(
                          controller: _durationController,
                          focusNode: _durationFocus,
                          hintText: 'e.g. 45',
                          prefixIcon: Icons.access_time_rounded,
                          keyboardType: TextInputType.number,
                          validator: FormValidators.duration(),
                        ),
                      ],
                    ),
                    SizedBox(height: 16.h),

                    // Section 3: Description & Visibility
                    _buildSectionCard(
                      title: 'Description & Visibility',
                      subtitle: 'Client details and booking status',
                      icon: Icons.description_outlined,
                      children: [
                        _buildLabel('Short Description', required: true),
                        _buildTextField(
                          controller: _descriptionController,
                          focusNode: _descriptionFocus,
                          hintText:
                              'e.g. Deep conditioning ritual with organic argan oil and head massage.',
                          prefixIcon: Icons.description_outlined,
                          maxLines: 3,
                          validator: FormValidators.required('Description'),
                        ),
                        SizedBox(height: 16.h),

                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 14.w,
                          vertical: 12.h,
                        ),
                        decoration: BoxDecoration(
                          color: _isActive
                              ? const Color(0xFFFDF2F8)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(14.r),
                          border: Border.all(
                            color: _isActive
                                ? const Color(0xFFFBCFE8)
                                : const Color(0xFFF1E4E8),
                            width: 1.2,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(8.w),
                              decoration: BoxDecoration(
                                color: _isActive
                                    ? const Color(0xFFD1FAE5)
                                    : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(10.r),
                              ),
                              child: Icon(
                                _isActive
                                    ? Icons.visibility_rounded
                                    : Icons.visibility_off_rounded,
                                color: _isActive
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFF94A3B8),
                                size: 18.sp,
                              ),
                            ),
                            SizedBox(width: 12.w),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Visible for Bookings',
                                    style: GoogleFonts.inter(
                                      fontSize: 13.5.sp,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  SizedBox(height: 2.h),
                                  Text(
                                    _isActive
                                        ? 'Active - available on appointment calendars'
                                        : 'Inactive - hidden from booking schedules',
                                    style: GoogleFonts.inter(
                                      fontSize: 11.5.sp,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Switch.adaptive(
                              value: _isActive,
                              activeColor: const Color(0xFFE91E63),
                              activeTrackColor: const Color(0xFFFBCFE8),
                              onChanged: (val) =>
                                  setState(() => _isActive = val),
                            ),
                          ],
                        ),
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
                        onPressed: _isLoading ? null : _saveService,
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
                                    isEditing ? 'Save Changes' : 'Add Service',
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

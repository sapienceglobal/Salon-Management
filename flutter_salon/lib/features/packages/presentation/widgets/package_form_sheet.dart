import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/form_validators.dart';
import '../../data/catalog_repository.dart';
import '../providers/catalog_provider.dart';
import '../../../services/data/service_provider.dart';

class PackageFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? initialData;

  const PackageFormSheet({super.key, this.initialData});

  @override
  ConsumerState<PackageFormSheet> createState() => _PackageFormSheetState();
}

class _PackageFormSheetState extends ConsumerState<PackageFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _validityController = TextEditingController();
  final _usesController = TextEditingController();
  final _taxController = TextEditingController(text: '18');

  File? _selectedImage;
  List<Map<String, dynamic>> _items = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      _nameController.text = widget.initialData!['name'] ?? '';
      _descController.text = widget.initialData!['description'] ?? '';
      _priceController.text =
          widget.initialData!['total_price']?.toString() ?? '';
      _validityController.text =
          widget.initialData!['validity_days']?.toString() ?? '';
      _usesController.text = widget.initialData!['max_uses']?.toString() ?? '';
      _taxController.text =
          widget.initialData!['tax_percentage']?.toString() ?? '18';

      if (widget.initialData!['items'] != null) {
        final List<dynamic> currentItems = widget.initialData!['items'];
        _items = currentItems
            .map(
              (i) => {
                'service_id': i['service_id']?.toString() ?? '',
                'quantity': i['quantity']?.toString() ?? '1',
              },
            )
            .toList();
      }
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  void _addItem() {
    setState(() {
      _items.add({'service_id': '', 'quantity': '1'});
    });
  }

  void _removeItem(int index) {
    setState(() {
      _items.removeAt(index);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Add at least one service'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    for (var item in _items) {
      if (item['service_id'] == '') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please select a service for all items'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        return;
      }
    }

    setState(() => _isLoading = true);

    try {
      final data = {
        'name': _nameController.text.trim(),
        'description': _descController.text.trim(),
        'total_price': double.parse(_priceController.text.trim()),
        'tax_percentage': _taxController.text.isNotEmpty
            ? double.parse(_taxController.text.trim())
            : null,
        'validity_days': _validityController.text.isNotEmpty
            ? int.parse(_validityController.text.trim())
            : null,
        'max_uses': _usesController.text.isNotEmpty
            ? int.parse(_usesController.text.trim())
            : null,
      };

      for (int i = 0; i < _items.length; i++) {
        data['items[$i][service_id]'] = _items[i]['service_id'];
        data['items[$i][quantity]'] = _items[i]['quantity'];
      }

      final repo = ref.read(catalogRepositoryProvider);

      if (widget.initialData != null) {
        await repo.updatePackage(
          widget.initialData!['id'],
          data,
          imageFile: _selectedImage,
        );
      } else {
        await repo.createPackage(data, imageFile: _selectedImage);
      }

      ref.invalidate(packagesListProvider);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.initialData != null
                  ? 'Package updated successfully!'
                  : 'Package created successfully!',
            ),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final errMsg = e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errMsg),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final servicesAsync = ref.watch(servicesListProvider);

    return SafeArea(
      child: Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32.r)),
        ),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          children: [
            // Header
            Padding(
              padding: EdgeInsets.all(24.w),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.redeem_rounded,
                        color: AppColors.primary,
                        size: 28.sp,
                      ),
                      SizedBox(width: 12.w),
                      Text(
                        widget.initialData != null
                            ? 'Edit Package'
                            : 'New Package',
                        style: GoogleFonts.poppins(
                          fontSize: 22.sp,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: IconButton(
                      icon: Icon(
                        Icons.close_rounded,
                        color: AppColors.textSecondary,
                        size: 24.sp,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ],
              ),
            ),

            // Form Content
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: GestureDetector(
                          onTap: _pickImage,
                          child: Container(
                            width: 180.w,
                            height: 140.h,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24.r),
                              border: Border.all(
                                color: AppColors.primary.withOpacity(0.3),
                                width: 1.5.w,
                                style: BorderStyle.solid,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withOpacity(0.1),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                              image: _selectedImage != null
                                  ? DecorationImage(
                                      image: FileImage(_selectedImage!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: _selectedImage == null
                                ? Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.add_photo_alternate_rounded,
                                        color: AppColors.primary,
                                        size: 48.sp,
                                      ),
                                      SizedBox(height: 12.h),
                                      Text(
                                        'Upload Cover',
                                        style: GoogleFonts.inter(
                                          color: AppColors.primary,
                                          fontSize: 14.sp,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  )
                                : null,
                          ),
                        ),
                      ),
                      SizedBox(height: 32.h),

                      _buildSectionCard('Package Details', [
                        _buildPremiumTextField(
                          controller: _nameController,
                          label: 'Package Name *',
                          icon: Icons.card_giftcard_rounded,
                          validator: FormValidators.minLength(
                            'Package Name',
                            2,
                          ),
                        ),
                        _buildPremiumTextField(
                          controller: _descController,
                          label: 'Description',
                          icon: Icons.notes_rounded,
                          maxLines: 2,
                        ),
                        Row(
                          children: [
                            Expanded(
                              child: _buildPremiumTextField(
                                controller: _priceController,
                                label: 'Total Price (₹) *',
                                icon: Icons.currency_rupee_rounded,
                                keyboardType: TextInputType.number,
                                validator: FormValidators.price('Total Price'),
                              ),
                            ),
                            SizedBox(width: 16.w),
                            Expanded(
                              child: _buildPremiumTextField(
                                controller: _taxController,
                                label: 'Tax (%)',
                                icon: Icons.percent_rounded,
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            Expanded(
                              child: _buildPremiumTextField(
                                controller: _validityController,
                                label: 'Validity (Days)',
                                hintText: 'Unlimited',
                                icon: Icons.calendar_today_outlined,
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            SizedBox(width: 16.w),
                            Expanded(
                              child: _buildPremiumTextField(
                                controller: _usesController,
                                label: 'Max Uses',
                                hintText: 'Unlimited',
                                icon: Icons.repeat_rounded,
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                      ]),

                      SizedBox(height: 8.h),
                      Text(
                        'Included Services',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          fontSize: 18.sp,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      SizedBox(height: 16.h),

                      ..._items.asMap().entries.map((entry) {
                        int idx = entry.key;
                        var item = entry.value;
                        return Container(
                          margin: EdgeInsets.only(bottom: 12.h),
                          padding: EdgeInsets.all(16.w),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16.r),
                            border: Border.all(
                              color: AppColors.border.withOpacity(0.5),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 3,
                                child: servicesAsync.when(
                                  data: (services) =>
                                      _buildPremiumDropdown<String>(
                                        value: item['service_id'] == ''
                                            ? null
                                            : item['service_id'],
                                        label: 'Select Service',
                                        icon: Icons.content_cut_rounded,
                                        items: services
                                            .map(
                                              (s) => DropdownMenuItem<String>(
                                                value: s['id'].toString(),
                                                child: Text(
                                                  '${s['name']} (₹${s['price']})',
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: GoogleFonts.inter(),
                                                ),
                                              ),
                                            )
                                            .toList(),
                                        onChanged: (val) {
                                          setState(() {
                                            _items[idx]['service_id'] = val!;
                                          });
                                        },
                                      ),
                                  loading: () => Center(
                                    child: CircularProgressIndicator(
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  error: (_, _) => Text(
                                    'Error',
                                    style: GoogleFonts.inter(color: Colors.red),
                                  ),
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                flex: 1,
                                child: _buildPremiumTextField(
                                  initialValue: item['quantity'],
                                  label: 'Qty',
                                  icon: Icons.numbers_rounded,
                                  keyboardType: TextInputType.number,
                                  onChanged: (val) {
                                    _items[idx]['quantity'] = val;
                                  },
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Container(
                                decoration: BoxDecoration(
                                  color: AppColors.error.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                                child: IconButton(
                                  icon: Icon(
                                    Icons.delete_outline_rounded,
                                    color: AppColors.error,
                                  ),
                                  onPressed: () => _removeItem(idx),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),

                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton.icon(
                          onPressed: _addItem,
                          icon: Icon(
                            Icons.add_circle_outline_rounded,
                            color: AppColors.primary,
                            size: 20.sp,
                          ),
                          label: Text(
                            'Add Another Service',
                            style: GoogleFonts.inter(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 14.sp,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.symmetric(
                              vertical: 12.h,
                              horizontal: 16.w,
                            ),
                            backgroundColor: AppColors.primaryLight.withOpacity(
                              0.2,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 100.h),
                    ],
                  ),
                ),
              ),
            ),

            // Sticky Footer Buttons
            Container(
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 20.h),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    offset: const Offset(0, -4),
                    blurRadius: 20,
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.border),
                        padding: EdgeInsets.symmetric(vertical: 18.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16.r),
                        ),
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: Text(
                        'Cancel',
                        style: GoogleFonts.inter(
                          color: AppColors.textSecondary,
                          fontSize: 15.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(width: 16.w),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: EdgeInsets.symmetric(vertical: 18.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16.r),
                        ),
                        elevation: 4,
                        shadowColor: AppColors.primary.withOpacity(0.5),
                      ),
                      onPressed: _isLoading ? null : _submit,
                      child: _isLoading
                          ? SizedBox(
                              height: 24.h,
                              width: 24.w,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              widget.initialData != null
                                  ? 'Save Changes'
                                  : 'Create Package',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
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

  Widget _buildSectionCard(String title, List<Widget> children) {
    return Container(
      margin: EdgeInsets.only(bottom: 24.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: EdgeInsets.all(24.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 18.sp,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 24.h),
          ...children,
        ],
      ),
    );
  }

  Widget _buildPremiumTextField({
    TextEditingController? controller,
    String? initialValue,
    required String label,
    required IconData icon,
    String? hintText,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16.h),
      child: TextFormField(
        controller: controller,
        initialValue: initialValue,
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: validator,
        onChanged: onChanged,
        style: GoogleFonts.inter(fontSize: 15.sp),
        decoration: InputDecoration(
          labelText: label,
          hintText: hintText,
          labelStyle: GoogleFonts.inter(color: AppColors.textSecondary),
          prefixIcon: Icon(icon, color: AppColors.primary),
          filled: true,
          fillColor: AppColors.background,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16.r),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16.r),
            borderSide: BorderSide(color: AppColors.primary, width: 1.5.w),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16.r),
            borderSide: BorderSide(color: AppColors.error, width: 1.5.w),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16.r),
            borderSide: BorderSide(color: AppColors.error, width: 1.5.w),
          ),
          contentPadding: EdgeInsets.symmetric(
            vertical: 20.h,
            horizontal: 20.w,
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumDropdown<T>({
    required String label,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required IconData icon,
    required void Function(T?) onChanged,
  }) {
    return DropdownButtonFormField<T>(
      initialValue: value,
      items: items,
      onChanged: onChanged,
      dropdownColor: Colors.white,
      borderRadius: BorderRadius.circular(12.r),
      elevation: 4,
      menuMaxHeight: 300.h,
      isExpanded: true,
      icon: Icon(
        Icons.keyboard_arrow_down_rounded,
        color: AppColors.textSecondary,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.inter(color: AppColors.textSecondary),
        prefixIcon: Icon(icon, color: AppColors.primary),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.r),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.r),
          borderSide: BorderSide(color: AppColors.primary, width: 1.5.w),
        ),
        contentPadding: EdgeInsets.symmetric(vertical: 20.h, horizontal: 20.w),
      ),
    );
  }
}

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

class MembershipFormSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic>? initialData;

  const MembershipFormSheet({super.key, this.initialData});

  @override
  ConsumerState<MembershipFormSheet> createState() =>
      _MembershipFormSheetState();
}

class _MembershipFormSheetState extends ConsumerState<MembershipFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _durationController = TextEditingController(text: '1');
  final _discountController = TextEditingController();
  final _maxMembersController = TextEditingController();

  File? _selectedImage;
  List<String> _benefits = [''];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      _nameController.text = widget.initialData!['name'] ?? '';
      _descController.text = widget.initialData!['description'] ?? '';
      _priceController.text = widget.initialData!['price']?.toString() ?? '';
      _durationController.text =
          widget.initialData!['duration_months']?.toString() ?? '1';
      _discountController.text =
          widget.initialData!['discount_percentage']?.toString() ?? '';
      _maxMembersController.text =
          widget.initialData!['max_members']?.toString() ?? '';

      if (widget.initialData!['benefits'] != null &&
          (widget.initialData!['benefits'] as List).isNotEmpty) {
        _benefits = (widget.initialData!['benefits'] as List)
            .map((e) => e.toString())
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

  void _addBenefit() {
    setState(() {
      _benefits.add('');
    });
  }

  void _removeBenefit(int index) {
    setState(() {
      _benefits.removeAt(index);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final validBenefits = _benefits
        .map((b) => b.trim())
        .where((b) => b.isNotEmpty)
        .toList();

    setState(() => _isLoading = true);

    try {
      final data = {
        'name': _nameController.text.trim(),
        'description': _descController.text.trim(),
        'price': double.parse(_priceController.text.trim()),
        'duration_months': int.parse(_durationController.text.trim()),
        'discount_percentage': _discountController.text.isNotEmpty
            ? double.parse(_discountController.text.trim())
            : null,
        'max_members': _maxMembersController.text.isNotEmpty
            ? int.parse(_maxMembersController.text.trim())
            : null,
      };

      for (int i = 0; i < validBenefits.length; i++) {
        data['benefits[$i]'] = validBenefits[i];
      }

      final repo = ref.read(catalogRepositoryProvider);

      if (widget.initialData != null) {
        await repo.updateMembership(
          widget.initialData!['id'],
          data,
          imageFile: _selectedImage,
        );
      } else {
        await repo.createMembership(data, imageFile: _selectedImage);
      }

      ref.invalidate(membershipsListProvider);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.initialData != null
                  ? 'Membership updated successfully!'
                  : 'Membership created successfully!',
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
                        Icons.workspace_premium_rounded,
                        color: Color(0xFFE4C062),
                        size: 28.sp,
                      ),
                      SizedBox(width: 12.w),
                      Text(
                        widget.initialData != null
                            ? 'Edit VIP Tier'
                            : 'New VIP Tier',
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
                                color: const Color(0xFFE4C062).withOpacity(0.5),
                                width: 1.5.w,
                                style: BorderStyle.solid,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(
                                    0xFFE4C062,
                                  ).withOpacity(0.1),
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
                                        color: Color(0xFFE4C062),
                                        size: 48.sp,
                                      ),
                                      SizedBox(height: 12.h),
                                      Text(
                                        'Upload Cover',
                                        style: GoogleFonts.inter(
                                          color: const Color(0xFFE4C062),
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

                      _buildSectionCard('Membership Details', [
                        _buildPremiumTextField(
                          controller: _nameController,
                          label: 'Membership Name *',
                          icon: Icons.badge_rounded,
                          validator: FormValidators.minLength(
                            'Membership Name',
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
                                label: 'Price (₹) *',
                                icon: Icons.currency_rupee_rounded,
                                keyboardType: TextInputType.number,
                                validator: FormValidators.price('Price'),
                              ),
                            ),
                            SizedBox(width: 16.w),
                            Expanded(
                              child: _buildPremiumTextField(
                                controller: _durationController,
                                label: 'Duration (mo) *',
                                icon: Icons.access_time_filled_rounded,
                                keyboardType: TextInputType.number,
                                validator: FormValidators.quantity(
                                  'Duration (months)',
                                  allowZero: false,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            Expanded(
                              child: _buildPremiumTextField(
                                controller: _discountController,
                                label: 'Global Discount (%)',
                                icon: Icons.percent_rounded,
                                keyboardType: TextInputType.number,
                              ),
                            ),
                            SizedBox(width: 16.w),
                            Expanded(
                              child: _buildPremiumTextField(
                                controller: _maxMembersController,
                                label: 'Max Members',
                                hintText: 'Unlimited',
                                icon: Icons.group_rounded,
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                      ]),

                      SizedBox(height: 8.h),
                      Text(
                        'Membership Benefits',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          fontSize: 18.sp,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      SizedBox(height: 16.h),

                      ..._benefits.asMap().entries.map((entry) {
                        int idx = entry.key;
                        var item = entry.value;
                        return Padding(
                          padding: EdgeInsets.only(bottom: 12.h),
                          child: Row(
                            children: [
                              Expanded(
                                child: _buildPremiumTextField(
                                  initialValue: item,
                                  label: 'Benefit ${idx + 1}',
                                  hintText: 'e.g. Free haircut once a month',
                                  icon: Icons.star_rounded,
                                  onChanged: (val) => _benefits[idx] = val,
                                  isBenefit: true,
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Container(
                                margin: EdgeInsets.only(
                                  bottom: 16.h,
                                ), // To align with textfield
                                decoration: BoxDecoration(
                                  color: AppColors.error.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(16.r),
                                ),
                                child: IconButton(
                                  icon: Icon(
                                    Icons.delete_outline_rounded,
                                    color: AppColors.error,
                                  ),
                                  onPressed: () => _removeBenefit(idx),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),

                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton.icon(
                          onPressed: _addBenefit,
                          icon: Icon(
                            Icons.add_circle_outline_rounded,
                            color: Color(0xFFE4C062),
                            size: 20.sp,
                          ),
                          label: Text(
                            'Add Perk',
                            style: GoogleFonts.inter(
                              color: const Color(0xFFE4C062),
                              fontWeight: FontWeight.bold,
                              fontSize: 14.sp,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.symmetric(
                              vertical: 12.h,
                              horizontal: 16.w,
                            ),
                            backgroundColor: const Color(0xFFFFF9E6),
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
                        backgroundColor: const Color(0xFFE4C062),
                        padding: EdgeInsets.symmetric(vertical: 18.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16.r),
                        ),
                        elevation: 4,
                        shadowColor: const Color(0xFFE4C062).withOpacity(0.5),
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
                                  : 'Create Tier',
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
        border: Border.all(color: const Color(0xFFE4C062).withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE4C062).withOpacity(0.05),
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
    bool isBenefit = false,
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
          prefixIcon: Icon(
            icon,
            color: isBenefit ? const Color(0xFFE4C062) : AppColors.primary,
          ),
          filled: true,
          fillColor: isBenefit ? const Color(0xFFFFF9E6) : AppColors.background,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16.r),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16.r),
            borderSide: BorderSide(
              color: isBenefit ? const Color(0xFFE4C062) : AppColors.primary,
              width: 1.5.w,
            ),
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
}

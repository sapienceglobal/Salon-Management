import 'dart:io';
import 'dart:math';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/utils/form_validators.dart';
import '../../../../core/utils/form_scroll_helper.dart';
import '../../../../core/widgets/custom_dropdown_field.dart';
import '../../data/staff_provider.dart';
import 'package:flutter_salon/core/network/dio_client.dart';
import '../../../settings/presentation/providers/settings_provider.dart';

class AddEditStaffScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? staff;

  const AddEditStaffScreen({super.key, this.staff});

  @override
  ConsumerState<AddEditStaffScreen> createState() => _AddEditStaffScreenState();
}

class _AddEditStaffScreenState extends ConsumerState<AddEditStaffScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _fullNameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _designationController;
  late TextEditingController _salaryController;
  late TextEditingController _bioController;
  late TextEditingController _specializationsController;

  final _fullNameFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _phoneFocus = FocusNode();
  final _designationFocus = FocusNode();
  final _salaryFocus = FocusNode();
  final _bioFocus = FocusNode();
  final _specializationsFocus = FocusNode();
  final _roleKey = GlobalKey();

  String? _role;
  DateTime _joiningDate = DateTime.now();
  String _generatedPassword = '';
  File? _profileImage;
  int? _commissionProfileId;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    String existingFirstName = widget.staff?['first_name'] ?? '';
    String existingLastName = widget.staff?['last_name'] ?? '';
    String existingFullName = '$existingFirstName $existingLastName'.trim();

    _fullNameController = TextEditingController(text: existingFullName);
    _emailController = TextEditingController(
      text: widget.staff?['email'] ?? '',
    );
    _phoneController = TextEditingController(
      text: widget.staff?['phone'] ?? '',
    );
    _designationController = TextEditingController(
      text: widget.staff?['designation'] ?? '',
    );
    _salaryController = TextEditingController(
      text: widget.staff?['salary']?.toString() ?? '',
    );
    _bioController = TextEditingController(text: widget.staff?['bio'] ?? '');

    String specs = '';
    if (widget.staff?['specializations'] != null) {
      if (widget.staff!['specializations'] is List) {
        specs = (widget.staff!['specializations'] as List).join(', ');
      } else if (widget.staff!['specializations'] is String) {
        specs = widget.staff!['specializations'];
      }
    }
    _specializationsController = TextEditingController(text: specs);

    if (widget.staff != null) {
      _role = widget.staff!['role'];
      _commissionProfileId = widget.staff!['commission_profile_id'];
      if (widget.staff!['joining_date'] != null) {
        _joiningDate =
            DateTime.tryParse(widget.staff!['joining_date']) ?? DateTime.now();
      }
    } else {
      _generatedPassword = _generateRandomPassword();
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _designationController.dispose();
    _salaryController.dispose();
    _bioController.dispose();
    _specializationsController.dispose();

    _fullNameFocus.dispose();
    _emailFocus.dispose();
    _phoneFocus.dispose();
    _designationFocus.dispose();
    _salaryFocus.dispose();
    _bioFocus.dispose();
    _specializationsFocus.dispose();
    super.dispose();
  }

  String _generateRandomPassword() {
    const chars =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^&*';
    final rnd = Random();
    return String.fromCharCodes(
      Iterable.generate(10, (_) => chars.codeUnitAt(rnd.nextInt(chars.length))),
    );
  }

  Future<void> _selectJoiningDate() async {
    FormScrollHelper.unfocus();
    final picked = await showDatePicker(
      context: context,
      initialDate: _joiningDate,
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
        _joiningDate = picked;
      });
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (pickedFile != null) {
      setState(() {
        _profileImage = File(pickedFile.path);
      });
    }
  }

  void _showPasswordDialog(String password) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24.r),
        ),
        title: Row(
          children: [
            Container(
              padding: EdgeInsets.all(8.w),
              decoration: BoxDecoration(
                color: const Color(0xFFD1FAE5),
                borderRadius: BorderRadius.circular(10.r),
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF10B981),
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Text(
                'Staff Account Created',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  fontSize: 18.sp,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'A new user account has been created for this staff member. Please share these credentials securely.',
              style: GoogleFonts.inter(
                color: const Color(0xFF64748B),
                fontSize: 13.5.sp,
              ),
            ),
            SizedBox(height: 18.h),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              decoration: BoxDecoration(
                color: const Color(0xFFFDF2F8),
                borderRadius: BorderRadius.circular(16.r),
                border: Border.all(
                  color: const Color(0xFFFBCFE8),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: SelectableText(
                      password,
                      style: GoogleFonts.robotoMono(
                        fontWeight: FontWeight.bold,
                        fontSize: 16.sp,
                        letterSpacing: 2,
                        color: const Color(0xFFE91E63),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.copy_rounded, color: Color(0xFFE91E63)),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: password));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Copied to clipboard'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE91E63),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 12.h),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              context.pop(true);
            },
            child: Text(
              'Done',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _saveStaff() async {
    final isEditing = widget.staff != null;
    final isValid = FormScrollHelper.validateAndScroll(
      context: context,
      formKey: _formKey,
      fields: [
        FormFieldTarget(
          target: _fullNameFocus,
          isInvalid: () => _fullNameController.text.trim().isEmpty,
          errorMessage: 'Staff full name is required',
        ),
        FormFieldTarget(
          target: _phoneFocus,
          isInvalid: () => _phoneController.text.trim().length != 10,
          errorMessage: 'Valid 10-digit mobile number is required',
        ),
        FormFieldTarget(
          target: _emailFocus,
          isInvalid: () {
            if (isEditing) return false;
            final e = _emailController.text.trim();
            if (e.isEmpty) return false;
            return !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(e);
          },
          errorMessage: 'Please enter a valid email address',
        ),
        FormFieldTarget(
          target: _roleKey,
          isInvalid: () => _role == null || _role!.isEmpty,
          errorMessage: 'Please select a staff access role',
        ),
        FormFieldTarget(
          target: _designationFocus,
          isInvalid: () => _designationController.text.trim().isEmpty,
          errorMessage: 'Staff designation is required',
        ),
      ],
    );
    if (!isValid) return;

    setState(() => _isLoading = true);
    try {
      final repository = ref.read(staffRepositoryProvider);

      int userId = widget.staff?['user_id'] ?? 0;

      final nameParts = _fullNameController.text.trim().split(' ');
      final firstName = nameParts.first;
      final lastName = nameParts.length > 1
          ? nameParts.sublist(1).join(' ')
          : '';

      if (widget.staff == null) {
        final emailStr = _emailController.text.trim();
        final finalEmail = emailStr.isNotEmpty
            ? emailStr
            : 'staff_${_phoneController.text.trim().replaceAll(' ', '')}@salon.com';

        final userPayload = {
          'email': finalEmail,
          'password': _generatedPassword,
          'first_name': firstName,
          'last_name': lastName,
          'phone': _phoneController.text.trim(),
          'role': _role,
        };
        final userRes = await repository.createUser(userPayload);
        userId = userRes['id'];
      }

      final specsList = _specializationsController.text
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();

      final staffPayload = {
        'user_id': userId,
        'designation': _designationController.text.trim(),
        'joining_date': DateFormat('yyyy-MM-dd').format(_joiningDate),
        'salary': double.tryParse(_salaryController.text.trim()) ?? 0.0,
        'commission_profile_id': _commissionProfileId,
        'specializations': specsList,
        'bio': _bioController.text.trim(),
      };

      if (_profileImage != null) {
        staffPayload['image'] = await MultipartFile.fromFile(
          _profileImage!.path,
        );
      }

      if (widget.staff == null) {
        await repository.createStaffMember(staffPayload);
      } else {
        await repository.updateStaffMember(widget.staff!['id'], staffPayload);

        final userUpdatePayload = {
          'first_name': firstName,
          'last_name': lastName,
          'phone': _phoneController.text.trim(),
          'role': _role,
        };
        await repository.updateUser(userId, userUpdatePayload);
        ref.invalidate(staffMemberProvider(widget.staff!['id']));
      }

      ref.invalidate(staffListProvider);

      if (mounted) {
        if (widget.staff == null) {
          _showPasswordDialog(_generatedPassword);
        } else {
          context.pop(true);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 10.w),
                  const Text('Staff member updated successfully!'),
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

  Widget _buildPhotoUploader() {
    final existingUrl = widget.staff?['image_url'];
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
                    shape: BoxShape.circle,
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
                  child: ClipOval(
                    child: _profileImage != null
                        ? Image.file(
                            _profileImage!,
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
                                    Icons.person_rounded,
                                    size: 42.sp,
                                    color: const Color(0xFFF472B6),
                                  ),
                                ),
                              )
                            : Container(
                                color: const Color(0xFFFDF2F8),
                                child: Icon(
                                  Icons.person_rounded,
                                  size: 42.sp,
                                  color: const Color(0xFFF472B6),
                                ),
                              )),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: EdgeInsets.all(6.w),
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
                  'Staff Profile Photo',
                  style: GoogleFonts.poppins(
                    fontSize: 15.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 2.h),
                Text(
                  'Upload portrait for salon rosters & booking',
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
                              _profileImage != null ? 'Change' : 'Upload',
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
                    if (_profileImage != null) ...[
                      SizedBox(width: 8.w),
                      InkWell(
                        onTap: () => setState(() => _profileImage = null),
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
    final isEditing = widget.staff != null;

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
              isEditing ? "Edit Staff Member" : "Add Staff Member",
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18.sp,
              ),
            ),
            Text(
              "Team & Access Management",
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

                  // Section 1: Account & Identity
                  _buildSectionCard(
                    title: 'Account & Identity',
                    subtitle: 'Full name, contact details and system role',
                    icon: Icons.badge_outlined,
                    children: [
                      _buildLabel('Full Name', required: true),
                      _buildTextField(
                        controller: _fullNameController,
                        focusNode: _fullNameFocus,
                        hintText: 'e.g. Priya Sharma',
                        prefixIcon: Icons.person_outline_rounded,
                        validator: FormValidators.name('Full Name'),
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Mobile Number', required: true),
                      _buildTextField(
                        controller: _phoneController,
                        focusNode: _phoneFocus,
                        hintText: '98765 43210',
                        prefixIcon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                        validator: FormValidators.phone(),
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Email Address', required: !isEditing),
                      _buildTextField(
                        controller: _emailController,
                        focusNode: _emailFocus,
                        hintText: 'priya@salon.com',
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        readOnly: isEditing,
                        validator: isEditing ? null : FormValidators.email(),
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('System Role', required: true),
                      CustomDropdownField<String>(
                        key: _roleKey,
                        value: _role,
                        hintText: 'Select Access Role',
                        prefixIcon: Icons.admin_panel_settings_outlined,
                        items: const [
                          DropdownMenuItem(
                            value: 'staff',
                            child: Text('Staff Member (Stylist/Therapist)'),
                          ),
                          DropdownMenuItem(
                            value: 'manager',
                            child: Text('Manager (Operations)'),
                          ),
                          DropdownMenuItem(
                            value: 'admin',
                            child: Text('Administrator (Full Access)'),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _role = val);
                        },
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Section 2: Professional Details
                  _buildSectionCard(
                    title: 'Professional Details',
                    subtitle: 'Designation, joining date, skills & compensation',
                    icon: Icons.work_outline_rounded,
                    children: [
                      _buildLabel('Designation', required: true),
                      _buildTextField(
                        controller: _designationController,
                        focusNode: _designationFocus,
                        hintText: 'e.g. Senior Hairstylist & Colorist',
                        prefixIcon: Icons.business_center_outlined,
                        validator: (v) => v == null || v.isEmpty
                            ? 'Designation is required'
                            : null,
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Specializations (Comma Separated)'),
                      _buildTextField(
                        controller: _specializationsController,
                        hintText: 'e.g. Haircut, Balayage, Keratin, Facial',
                        prefixIcon: Icons.star_outline_rounded,
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Joining Date', required: true),
                      InkWell(
                        onTap: _selectJoiningDate,
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
                                child: Icon(
                                  Icons.calendar_today_outlined,
                                  color: const Color(0xFFE91E63),
                                  size: 18.sp,
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                child: Text(
                                  DateFormat('dd MMM yyyy').format(_joiningDate),
                                  style: GoogleFonts.inter(
                                    fontSize: 14.sp,
                                    color: const Color(0xFF0F172A),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              Icon(
                                Icons.calendar_month_outlined,
                                color: const Color(0xFF94A3B8),
                                size: 18.sp,
                              ),
                            ],
                          ),
                        ),
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Monthly Salary (Optional)'),
                      _buildTextField(
                        controller: _salaryController,
                        hintText: '0.00',
                        prefixText: '₹  ',
                        keyboardType: TextInputType.number,
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Commission Plan (Optional)'),
                      Consumer(
                        builder: (context, ref, _) {
                          final profilesAsync = ref.watch(commissionProfilesProvider);
                          final profiles = profilesAsync.value ?? [];
                          return DropdownButtonFormField<int?>(
                            initialValue: _commissionProfileId,
                            decoration: InputDecoration(
                              hintText: 'Select Commission Plan',
                              prefixIcon: const Icon(Icons.percent_rounded, color: Color(0xFFE91E63)),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14.r),
                                borderSide: const BorderSide(color: Color(0xFFF1E4E8), width: 1.2),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14.r),
                                borderSide: const BorderSide(color: Color(0xFFF1E4E8), width: 1.2),
                              ),
                              filled: true,
                              fillColor: Colors.white,
                            ),
                            items: [
                              const DropdownMenuItem<int?>(
                                value: null,
                                child: Text('No Commission (Salary Only)'),
                              ),
                              ...profiles.map((p) => DropdownMenuItem<int?>(
                                    value: p['id'] as int?,
                                    child: Text('${p['name']} (${p['type'] == 'percentage' ? "${p['value']}%" : "₹${p['value']}"})'),
                                  )),
                            ],
                            onChanged: (val) => setState(() => _commissionProfileId = val),
                          );
                        },
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Section 3: Bio & Notes
                  _buildSectionCard(
                    title: 'Bio & Notes',
                    subtitle: 'Brief background, certifications or client instructions',
                    icon: Icons.description_outlined,
                    children: [
                      _buildLabel('Bio / Summary'),
                      _buildTextField(
                        controller: _bioController,
                        hintText:
                            'Write brief experience, certifications or work schedule notes...',
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

          // Sticky Bottom Actions Bar
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
                        onPressed: _isLoading ? null : _saveStaff,
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
                                  Icon(
                                    Icons.check_circle_outline_rounded,
                                    color: Colors.white,
                                    size: 18.sp,
                                  ),
                                  SizedBox(width: 8.w),
                                  Text(
                                    isEditing ? 'Save Changes' : 'Add Staff',
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

import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/utils/form_validators.dart';
import '../../../../core/utils/form_scroll_helper.dart';
import '../../../../core/widgets/custom_dropdown_field.dart';
import '../../data/customer_provider.dart';

class AddEditCustomerScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? customer;
  final String? initialName;
  final String? initialPhone;

  const AddEditCustomerScreen({
    super.key,
    this.customer,
    this.initialName,
    this.initialPhone,
  });

  @override
  ConsumerState<AddEditCustomerScreen> createState() =>
      _AddEditCustomerScreenState();
}

class _AddEditCustomerScreenState extends ConsumerState<AddEditCustomerScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _gstNumberController;
  late TextEditingController _locationController;
  late TextEditingController _addressController;
  late TextEditingController _notesController;

  final _firstNameFocus = FocusNode();
  final _lastNameFocus = FocusNode();
  final _phoneFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _locationFocus = FocusNode();
  final _addressFocus = FocusNode();
  final _gstFocus = FocusNode();
  final _notesFocus = FocusNode();

  DateTime? _dob;
  DateTime? _anniversary;

  String _gender = 'female';
  String _source = 'Walk-in';

  bool _smsOptIn = false;
  bool _emailOptIn = false;
  bool _whatsappOptIn = true;

  bool _isLoading = false;

  File? _imageFile;
  final _picker = ImagePicker();

  final List<String> _sources = [
    'Walk-in',
    'Google',
    'Facebook',
    'Instagram',
    'Referrals',
    'Justdial',
    'Others',
  ];

  @override
  void initState() {
    super.initState();
    String initFirstName = '';
    String initLastName = '';
    if (widget.initialName != null && widget.initialName!.trim().isNotEmpty) {
      final parts = widget.initialName!.trim().split(RegExp(r'\s+'));
      initFirstName = parts.first;
      if (parts.length > 1) {
        initLastName = parts.sublist(1).join(' ');
      }
    }

    _firstNameController = TextEditingController(
      text: widget.customer?['first_name'] ?? initFirstName,
    );
    _lastNameController = TextEditingController(
      text: widget.customer?['last_name'] ?? initLastName,
    );
    _phoneController = TextEditingController(
      text: widget.customer?['phone'] ?? widget.initialPhone ?? '',
    );
    _emailController = TextEditingController(
      text: widget.customer?['email'] ?? '',
    );
    _gstNumberController = TextEditingController(
      text: widget.customer?['gst_number'] ?? '',
    );
    _locationController = TextEditingController(
      text: widget.customer?['location'] ?? '',
    );
    _addressController = TextEditingController(
      text: widget.customer?['address'] ?? '',
    );
    _notesController = TextEditingController(
      text: widget.customer?['notes'] ?? '',
    );

    if (widget.customer?['gender'] != null) {
      _gender = widget.customer!['gender'].toString().toLowerCase();
    }
    if (widget.customer?['source'] != null &&
        _sources.contains(widget.customer!['source'])) {
      _source = widget.customer!['source'];
    }
    if (widget.customer?['date_of_birth'] != null &&
        widget.customer!['date_of_birth'].toString().isNotEmpty) {
      try {
        _dob = DateTime.parse(widget.customer!['date_of_birth']);
      } catch (_) {}
    }
    if (widget.customer?['anniversary'] != null &&
        widget.customer!['anniversary'].toString().isNotEmpty) {
      try {
        _anniversary = DateTime.parse(widget.customer!['anniversary']);
      } catch (_) {}
    }
    _smsOptIn =
        widget.customer?['sms_opt_in'] == true ||
        widget.customer?['sms_opt_in'] == 1;
    _emailOptIn =
        widget.customer?['email_opt_in'] == true ||
        widget.customer?['email_opt_in'] == 1;
    _whatsappOptIn = widget.customer != null
        ? (widget.customer?['whatsapp_opt_in'] == true ||
            widget.customer?['whatsapp_opt_in'] == 1)
        : true;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _gstNumberController.dispose();
    _locationController.dispose();
    _addressController.dispose();
    _notesController.dispose();

    _firstNameFocus.dispose();
    _lastNameFocus.dispose();
    _phoneFocus.dispose();
    _emailFocus.dispose();
    _locationFocus.dispose();
    _addressFocus.dispose();
    _gstFocus.dispose();
    _notesFocus.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 800,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        setState(() {
          _imageFile = File(pickedFile.path);
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to access camera or gallery: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (BuildContext ctx) {
        return Container(
          padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 20.h),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24.r),
              topRight: Radius.circular(24.r),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40.w,
                  height: 4.h,
                  margin: EdgeInsets.only(bottom: 16.h),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2.r),
                  ),
                ),
                Text(
                  'Choose Customer Photo',
                  style: GoogleFonts.poppins(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 4.h),
                Text(
                  'Take a live photo with camera or choose from gallery',
                  style: GoogleFonts.inter(
                    fontSize: 12.sp,
                    color: const Color(0xFF64748B),
                  ),
                ),
                SizedBox(height: 20.h),
                Row(
                  children: [
                    // Live Camera
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          Navigator.pop(ctx);
                          _pickImage(ImageSource.camera);
                        },
                        borderRadius: BorderRadius.circular(16.r),
                        child: Container(
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF0F5),
                            borderRadius: BorderRadius.circular(16.r),
                            border: Border.all(
                              color: const Color(0xFFE91E63).withValues(alpha: 0.35),
                              width: 1.5,
                            ),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 48.w,
                                height: 48.h,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFE91E63),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.camera_alt_rounded,
                                  color: Colors.white,
                                  size: 24.sp,
                                ),
                              ),
                              SizedBox(height: 8.h),
                              Text(
                                'Take Live Photo',
                                style: GoogleFonts.poppins(
                                  fontSize: 13.sp,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              SizedBox(height: 2.h),
                              Text(
                                'Open Camera',
                                style: GoogleFonts.inter(
                                  fontSize: 11.sp,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 14.w),
                    // Device Gallery
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          Navigator.pop(ctx);
                          _pickImage(ImageSource.gallery);
                        },
                        borderRadius: BorderRadius.circular(16.r),
                        child: Container(
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16.r),
                            border: Border.all(
                              color: const Color(0xFFE2E8F0),
                              width: 1.5,
                            ),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 48.w,
                                height: 48.h,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF0F172A),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.photo_library_rounded,
                                  color: Colors.white,
                                  size: 24.sp,
                                ),
                              ),
                              SizedBox(height: 8.h),
                              Text(
                                'Choose Gallery',
                                style: GoogleFonts.poppins(
                                  fontSize: 13.sp,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              SizedBox(height: 2.h),
                              Text(
                                'From Files',
                                style: GoogleFonts.inter(
                                  fontSize: 11.sp,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 12.h),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _selectDate(BuildContext context, bool isDob) async {
    FormScrollHelper.unfocus();
    final initialDate = isDob
        ? (_dob ?? DateTime(1995, 1, 1))
        : (_anniversary ?? DateTime.now());
    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFE91E63),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
            dialogBackgroundColor: Colors.white,
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        if (isDob) {
          _dob = picked;
        } else {
          _anniversary = picked;
        }
      });
    }
  }

  Future<void> _save() async {
    final isValid = FormScrollHelper.validateAndScroll(
      context: context,
      formKey: _formKey,
      fields: [
        FormFieldTarget(
          target: _firstNameFocus,
          isInvalid: () => _firstNameController.text.trim().isEmpty,
          errorMessage: 'First name is required',
        ),
        FormFieldTarget(
          target: _phoneFocus,
          isInvalid: () => _phoneController.text.trim().length != 10,
          errorMessage: 'Valid 10-digit mobile number is required',
        ),
        FormFieldTarget(
          target: _emailFocus,
          isInvalid: () {
            final e = _emailController.text.trim();
            if (e.isEmpty) return false;
            return !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(e);
          },
          errorMessage: 'Please enter a valid email address',
        ),
      ],
    );
    if (!isValid) return;
    setState(() => _isLoading = true);

    try {
      final payload = <String, dynamic>{
        'first_name': _firstNameController.text.trim(),
        'gender': _gender,
        'source': _source,
        'sms_opt_in': _smsOptIn,
        'email_opt_in': _emailOptIn,
        'whatsapp_opt_in': _whatsappOptIn,
      };

      if (_lastNameController.text.trim().isNotEmpty) {
        payload['last_name'] = _lastNameController.text.trim();
      }
      if (_phoneController.text.trim().isNotEmpty) {
        payload['phone'] = _phoneController.text.trim();
      }
      if (_emailController.text.trim().isNotEmpty) {
        payload['email'] = _emailController.text.trim();
      }
      if (_dob != null) {
        payload['date_of_birth'] = DateFormat('yyyy-MM-dd').format(_dob!);
      }
      if (_anniversary != null) {
        payload['anniversary'] = DateFormat('yyyy-MM-dd').format(_anniversary!);
      }
      if (_gstNumberController.text.trim().isNotEmpty) {
        payload['gst_number'] = _gstNumberController.text.trim();
      }
      if (_locationController.text.trim().isNotEmpty) {
        payload['location'] = _locationController.text.trim();
      }
      if (_addressController.text.trim().isNotEmpty) {
        payload['address'] = _addressController.text.trim();
      }
      if (_notesController.text.trim().isNotEmpty) {
        payload['notes'] = _notesController.text.trim();
      }

      if (_imageFile != null) {
        payload['image'] = await MultipartFile.fromFile(
          _imageFile!.path,
          filename: _imageFile!.path.split(Platform.pathSeparator).last,
        );
      }

      final repo = ref.read(customerRepositoryProvider);
      Map<String, dynamic>? createdCustomer;
      if (widget.customer == null) {
        final res = await repo.createCustomer(payload);
        if (res['data'] is Map<String, dynamic>) {
          createdCustomer = res['data'];
        } else if (res['data'] is Map) {
          createdCustomer = Map<String, dynamic>.from(res['data']);
        } else if (res is Map<String, dynamic>) {
          createdCustomer = res;
        } else if (res is Map) {
          createdCustomer = Map<String, dynamic>.from(res);
        }

        if (createdCustomer != null) {
          createdCustomer['first_name'] ??= _firstNameController.text.trim();
          createdCustomer['last_name'] ??= _lastNameController.text.trim();
          createdCustomer['phone'] ??= _phoneController.text.trim();
          createdCustomer['email'] ??= _emailController.text.trim();
        }
      } else {
        await repo.updateCustomer(widget.customer!['id'], payload);
      }
      ref.invalidate(customersListProvider);

      if (mounted) {
        if (context.canPop()) {
          context.pop(createdCustomer);
        } else {
          context.go('/customers');
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10.w),
                Expanded(
                  child: Text(
                    widget.customer == null
                        ? 'Customer profile created successfully!'
                        : 'Customer profile updated successfully!',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w500),
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
                Expanded(
                  child: Text(
                    errMsg,
                    style: GoogleFonts.inter(fontWeight: FontWeight.w500),
                  ),
                ),
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
            onTap: _showImageSourceDialog,
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
                    child: Builder(
                      builder: (context) {
                        if (_imageFile != null) {
                          return Image.file(
                            _imageFile!,
                            fit: BoxFit.cover,
                            width: 74.w,
                            height: 74.h,
                          );
                        }

                        final existingUrl = widget.customer?['profile_image_url'] ??
                            widget.customer?['profile_picture'] ??
                            widget.customer?['avatar_url'] ??
                            widget.customer?['profile_image'] ??
                            widget.customer?['image_url'];

                        if (existingUrl != null &&
                            existingUrl.toString().trim().isNotEmpty) {
                          final rawUrl =
                              existingUrl.toString().split(',').first.trim();
                          final fullUrl = (rawUrl.startsWith('/'))
                              ? '$kBaseMediaUrl$rawUrl'
                              : rawUrl;
                          return Image.network(
                            fullUrl,
                            fit: BoxFit.cover,
                            width: 74.w,
                            height: 74.h,
                            errorBuilder: (c, e, s) => Image.asset(
                              'assets/images/customer_profile_avatar.jpg',
                              fit: BoxFit.cover,
                              width: 74.w,
                              height: 74.h,
                            ),
                          );
                        }

                        return Image.asset(
                          'assets/images/customer_profile_avatar.jpg',
                          fit: BoxFit.cover,
                          width: 74.w,
                          height: 74.h,
                        );
                      },
                    ),
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
                  'Customer Photo',
                  style: GoogleFonts.poppins(
                    fontSize: 15.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 2.h),
                Text(
                  'Take live photo or upload from device',
                  style: GoogleFonts.inter(
                    fontSize: 12.sp,
                    color: const Color(0xFF64748B),
                  ),
                ),
                SizedBox(height: 10.h),
                Wrap(
                  spacing: 8.w,
                  runSpacing: 6.h,
                  children: [
                    // Camera (Live Photo)
                    InkWell(
                      onTap: () => _pickImage(ImageSource.camera),
                      borderRadius: BorderRadius.circular(8.r),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 10.w,
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
                              Icons.camera_alt_rounded,
                              color: Colors.white,
                              size: 13.sp,
                            ),
                            SizedBox(width: 4.w),
                            Text(
                              'Camera',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 11.5.sp,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Gallery (Files)
                    InkWell(
                      onTap: () => _pickImage(ImageSource.gallery),
                      borderRadius: BorderRadius.circular(8.r),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 10.w,
                          vertical: 6.h,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8.r),
                          border: Border.all(
                            color: const Color(0xFFCBD5E1),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.photo_library_rounded,
                              color: const Color(0xFF334155),
                              size: 13.sp,
                            ),
                            SizedBox(width: 4.w),
                            Text(
                              'Gallery',
                              style: GoogleFonts.inter(
                                color: const Color(0xFF334155),
                                fontSize: 11.5.sp,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (_imageFile != null) ...[
                      InkWell(
                        onTap: () => setState(() => _imageFile = null),
                        borderRadius: BorderRadius.circular(8.r),
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 8.w,
                            vertical: 6.h,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(8.r),
                            border: Border.all(
                              color: const Color(0xFFFECACA),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.delete_outline_rounded,
                                color: const Color(0xFFEF4444),
                                size: 13.sp,
                              ),
                              SizedBox(width: 3.w),
                              Text(
                                'Remove',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFFEF4444),
                                  fontSize: 11.5.sp,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
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

  Widget _buildGenderSelector() {
    final options = [
      {'key': 'female', 'label': 'Female', 'icon': Icons.female_rounded},
      {'key': 'male', 'label': 'Male', 'icon': Icons.male_rounded},
      {'key': 'unisex', 'label': 'Unisex', 'icon': Icons.transgender_rounded},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel('Gender', required: true),
        Row(
          children: options.map((opt) {
            final isSelected = _gender == opt['key'];
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _gender = opt['key'] as String),
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

  Widget _buildDateSelector({
    required String label,
    required DateTime? date,
    required String hintText,
    required IconData icon,
    required VoidCallback onTap,
    required VoidCallback onClear,
  }) {
    final hasDate = date != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14.r),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14.r),
              border: Border.all(
                color: hasDate
                    ? const Color(0xFFE91E63)
                    : const Color(0xFFF1E4E8),
                width: hasDate ? 1.5 : 1.2,
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
                    icon,
                    color: const Color(0xFFE91E63),
                    size: 18.sp,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Text(
                    hasDate ? DateFormat('dd MMM yyyy').format(date) : hintText,
                    style: GoogleFonts.inter(
                      fontSize: 14.sp,
                      color: hasDate
                          ? const Color(0xFF0F172A)
                          : const Color(0xFF94A3B8),
                      fontWeight:
                          hasDate ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                ),
                if (hasDate)
                  InkWell(
                    onTap: onClear,
                    borderRadius: BorderRadius.circular(20.r),
                    child: Padding(
                      padding: EdgeInsets.all(4.w),
                      child: Icon(
                        Icons.close_rounded,
                        color: const Color(0xFF94A3B8),
                        size: 18.sp,
                      ),
                    ),
                  )
                else
                  Icon(
                    Icons.calendar_month_outlined,
                    color: const Color(0xFF94A3B8),
                    size: 18.sp,
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCommunicationTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: value ? const Color(0xFFFDF2F8) : Colors.white,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(
          color: value ? const Color(0xFFFBCFE8) : const Color(0xFFF1E4E8),
          width: 1.2,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(8.w),
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(10.r),
            ),
            child: Icon(icon, color: iconColor, size: 18.sp),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13.5.sp,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 2.h),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11.5.sp,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            activeColor: const Color(0xFFE91E63),
            activeTrackColor: const Color(0xFFFBCFE8),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.customer != null;

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
              isEditing ? "Edit Customer" : "Add Customer",
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18.sp,
              ),
            ),
            Text(
              "Salon Client Profile Management",
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
                  // Photo Uploader Card
                  _buildPhotoUploader(),
                  SizedBox(height: 16.h),

                  // Section 1: Contact & Identity
                  _buildSectionCard(
                    title: 'Contact & Identity',
                    subtitle: 'Primary details to identify and reach the client',
                    icon: Icons.badge_outlined,
                    children: [
                      _buildLabel('First Name', required: true),
                      _buildTextField(
                        controller: _firstNameController,
                        focusNode: _firstNameFocus,
                        hintText: 'e.g. Neha',
                        prefixIcon: Icons.person_outline_rounded,
                        validator: FormValidators.name('First Name'),
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Last Name'),
                      _buildTextField(
                        controller: _lastNameController,
                        focusNode: _lastNameFocus,
                        hintText: 'e.g. Sharma',
                        prefixIcon: Icons.person_outline_rounded,
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

                      _buildLabel('Email Address'),
                      _buildTextField(
                        controller: _emailController,
                        focusNode: _emailFocus,
                        hintText: 'neha@example.com',
                        prefixIcon: Icons.mail_outline_rounded,
                        keyboardType: TextInputType.emailAddress,
                        validator: FormValidators.email(),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Section 2: Demographics & Source
                  _buildSectionCard(
                    title: 'Demographics & Source',
                    subtitle: 'Gender, acquisition channel and special dates',
                    icon: Icons.auto_awesome_outlined,
                    children: [
                      _buildGenderSelector(),
                      SizedBox(height: 16.h),

                      _buildLabel('Customer Source', required: true),
                      CustomDropdownField<String>(
                        value: _source,
                        hintText: 'Select Acquisition Source',
                        prefixIcon: Icons.campaign_outlined,
                        items: _sources
                            .map((s) => DropdownMenuItem(
                                  value: s,
                                  child: Text(s),
                                ))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _source = val);
                        },
                      ),
                      SizedBox(height: 16.h),

                      _buildDateSelector(
                        label: 'Date of Birth',
                        date: _dob,
                        hintText: 'Select Birthday',
                        icon: Icons.cake_outlined,
                        onTap: () => _selectDate(context, true),
                        onClear: () => setState(() => _dob = null),
                      ),
                      SizedBox(height: 16.h),

                      _buildDateSelector(
                        label: 'Anniversary',
                        date: _anniversary,
                        hintText: 'Select Anniversary',
                        icon: Icons.favorite_outline_rounded,
                        onTap: () => _selectDate(context, false),
                        onClear: () => setState(() => _anniversary = null),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Section 3: Address & Business Tax
                  _buildSectionCard(
                    title: 'Address & Business Tax',
                    subtitle: 'Billing address and GST information',
                    icon: Icons.location_on_outlined,
                    children: [
                      _buildLabel('Location / City'),
                      _buildTextField(
                        controller: _locationController,
                        focusNode: _locationFocus,
                        hintText: 'e.g. Downtown / Indiranagar',
                        prefixIcon: Icons.location_city_outlined,
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Full Address'),
                      _buildTextField(
                        controller: _addressController,
                        focusNode: _addressFocus,
                        hintText: 'Flat/House no., building, street and area',
                        prefixIcon: Icons.home_outlined,
                        maxLines: 2,
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('GST Number (Optional)'),
                      _buildTextField(
                        controller: _gstNumberController,
                        focusNode: _gstFocus,
                        hintText: '22AAAAA0000A1Z5',
                        prefixIcon: Icons.receipt_long_outlined,
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Section 4: Notes & Preferences
                  _buildSectionCard(
                    title: 'Client Notes & Allergies',
                    subtitle: 'Internal remarks, service preferences & skin notes',
                    icon: Icons.edit_note_rounded,
                    children: [
                      _buildLabel('Internal Notes'),
                      _buildTextField(
                        controller: _notesController,
                        focusNode: _notesFocus,
                        hintText:
                            'e.g. Sensitive scalp, allergic to ammonia, prefers herbal tea...',
                        prefixIcon: Icons.sticky_note_2_outlined,
                        maxLines: 3,
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Section 5: Communication Preferences
                  _buildSectionCard(
                    title: 'Notification Preferences',
                    subtitle: 'Client opt-in channels for reminders & salon updates',
                    icon: Icons.notifications_active_outlined,
                    children: [
                      _buildCommunicationTile(
                        title: 'WhatsApp Notifications',
                        subtitle:
                            'Instant appointment confirmations, receipts & alerts',
                        icon: Icons.chat_bubble_outline_rounded,
                        iconColor: const Color(0xFF10B981),
                        iconBg: const Color(0xFFD1FAE5),
                        value: _whatsappOptIn,
                        onChanged: (val) => setState(() => _whatsappOptIn = val),
                      ),
                      _buildCommunicationTile(
                        title: 'SMS Alerts',
                        subtitle:
                            'Transactional reminders, booking status & verification',
                        icon: Icons.sms_outlined,
                        iconColor: const Color(0xFF3B82F6),
                        iconBg: const Color(0xFFDBEAFE),
                        value: _smsOptIn,
                        onChanged: (val) => setState(() => _smsOptIn = val),
                      ),
                      _buildCommunicationTile(
                        title: 'Email Marketing',
                        subtitle:
                            'Salon monthly newsletters, VIP packages & special deals',
                        icon: Icons.mail_outline_rounded,
                        iconColor: const Color(0xFF8B5CF6),
                        iconBg: const Color(0xFFEDE9FE),
                        value: _emailOptIn,
                        onChanged: (val) => setState(() => _emailOptIn = val),
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
                        onPressed: _isLoading ? null : _save,
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
                                    isEditing ? 'Save Changes' : 'Create Customer',
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

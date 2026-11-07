import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_salon/features/crm/data/crm_provider.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/form_validators.dart';
import '../../../../core/utils/form_scroll_helper.dart';
import '../../../../core/widgets/custom_dropdown_field.dart';

class AddEditLeadScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? lead;

  const AddEditLeadScreen({super.key, this.lead});

  @override
  ConsumerState<AddEditLeadScreen> createState() => _AddEditLeadScreenState();
}

class _AddEditLeadScreenState extends ConsumerState<AddEditLeadScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _locationCtrl;
  late TextEditingController _notesCtrl;

  final _nameFocus = FocusNode();
  final _phoneFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _locationFocus = FocusNode();
  final _notesFocus = FocusNode();

  DateTime? _followUpDate;

  String _gender = 'Male';
  String _source = 'walk_in';
  String _status = 'new';
  String? _assignedTo;

  File? _imageFile;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final e = widget.lead;
    _nameCtrl = TextEditingController(text: e?['name'] ?? '');
    _phoneCtrl = TextEditingController(text: e?['phone'] ?? '');
    _emailCtrl = TextEditingController(text: e?['email'] ?? '');
    _locationCtrl = TextEditingController(text: e?['location'] ?? '');
    _notesCtrl = TextEditingController(text: e?['notes'] ?? '');

    if (e?['follow_up_date'] != null) {
      try {
        _followUpDate = DateTime.parse(e!['follow_up_date']);
      } catch (_) {}
    }

    _gender = ['Male', 'Female', 'Unisex'].contains(e?['gender'])
        ? e!['gender']
        : 'Male';

    _source = e?['source']?.toString().toLowerCase() ?? 'walk_in';
    if (![
      'walk_in',
      'facebook',
      'instagram',
      'justdial',
      'website',
      'referral',
    ].contains(_source)) {
      _source = 'walk_in';
    }

    _status = e?['status']?.toString().toLowerCase() ?? 'new';
    if (![
      'new',
      'contacted',
      'follow_up',
      'converted',
      'lost',
    ].contains(_status)) {
      _status = 'new';
    }

    if (e?['assigned_to'] != null) {
      _assignedTo = e!['assigned_to'].toString();
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _locationCtrl.dispose();
    _notesCtrl.dispose();

    _nameFocus.dispose();
    _phoneFocus.dispose();
    _emailFocus.dispose();
    _locationFocus.dispose();
    _notesFocus.dispose();
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

  Future<void> _selectDate() async {
    FormScrollHelper.unfocus();
    final picked = await showDatePicker(
      context: context,
      initialDate: _followUpDate ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
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
        _followUpDate = picked;
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
          isInvalid: () => _nameCtrl.text.trim().isEmpty,
          errorMessage: 'Lead full name is required',
        ),
        FormFieldTarget(
          target: _phoneFocus,
          isInvalid: () => _phoneCtrl.text.trim().length != 10,
          errorMessage: 'Valid 10-digit mobile number is required',
        ),
        FormFieldTarget(
          target: _emailFocus,
          isInvalid: () {
            final e = _emailCtrl.text.trim();
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
        'name': _nameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'gender': _gender,
        'location': _locationCtrl.text.trim(),
        'source': _source,
        'status': _status,
        'notes': _notesCtrl.text.trim(),
      };

      if (_assignedTo != null && _assignedTo!.isNotEmpty) {
        payload['assigned_to'] = int.parse(_assignedTo!);
      }
      if (_followUpDate != null) {
        payload['follow_up_date'] = DateFormat(
          'yyyy-MM-dd',
        ).format(_followUpDate!);
      }

      final repo = ref.read(crmRepositoryProvider);
      if (widget.lead == null) {
        await repo.createLead(payload);
      } else {
        await repo.updateLead(widget.lead!['id'], payload);
      }

      ref.invalidate(leadsListProvider);
      if (mounted) {
        context.pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10.w),
                Text(
                  widget.lead == null
                      ? 'Lead added successfully!'
                      : 'Lead updated successfully!',
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
                    child: _imageFile != null
                        ? Image.file(
                            _imageFile!,
                            fit: BoxFit.cover,
                            width: 74.w,
                            height: 74.h,
                          )
                        : Container(
                            color: const Color(0xFFFDF2F8),
                            child: Icon(
                              Icons.person_rounded,
                              size: 42.sp,
                              color: const Color(0xFFF472B6),
                            ),
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
                  'Lead Contact Photo',
                  style: GoogleFonts.poppins(
                    fontSize: 15.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 2.h),
                Text(
                  'Attach profile image or client card',
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
    final isEditing = widget.lead != null;
    final staffAsync = ref.watch(staffListProvider);

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
              isEditing ? "Edit Lead" : "Add Lead",
              style: GoogleFonts.poppins(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
                fontSize: 18.sp,
              ),
            ),
            Text(
              "Client CRM & Pipeline Management",
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

                  // Section 1: Contact & Identity
                  _buildSectionCard(
                    title: 'Contact Information',
                    subtitle: 'Prospect name, phone number & email address',
                    icon: Icons.badge_outlined,
                    children: [
                      _buildLabel('Full Name', required: true),
                      _buildTextField(
                        controller: _nameCtrl,
                        focusNode: _nameFocus,
                        hintText: 'e.g. Rahul Gupta',
                        prefixIcon: Icons.person_outline_rounded,
                        validator: FormValidators.name('Full Name'),
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Mobile Number', required: true),
                      _buildTextField(
                        controller: _phoneCtrl,
                        focusNode: _phoneFocus,
                        hintText: '98765 43210',
                        prefixIcon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                        validator: FormValidators.phone(),
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Email Address'),
                      _buildTextField(
                        controller: _emailCtrl,
                        focusNode: _emailFocus,
                        hintText: 'rahul@example.com',
                        prefixIcon: Icons.mail_outline_rounded,
                        keyboardType: TextInputType.emailAddress,
                        validator: FormValidators.email(),
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Location / Area'),
                      _buildTextField(
                        controller: _locationCtrl,
                        focusNode: _locationFocus,
                        hintText: 'e.g. Koramangala / Bandra West',
                        prefixIcon: Icons.location_on_outlined,
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Section 2: Pipeline & Status
                  _buildSectionCard(
                    title: 'Pipeline & Attribution',
                    subtitle: 'Lead stage, acquisition channel & assignment',
                    icon: Icons.filter_alt_outlined,
                    children: [
                      _buildLabel('Lead Status', required: true),
                      CustomDropdownField<String>(
                        value: _status,
                        hintText: 'Select Status',
                        prefixIcon: Icons.flag_outlined,
                        items: ['new', 'contacted', 'follow_up', 'converted', 'lost']
                            .map(
                              (s) => DropdownMenuItem(
                                value: s,
                                child: Text(
                                  s.replaceAll('_', ' ').toUpperCase(),
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _status = val);
                        },
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Acquisition Source', required: true),
                      CustomDropdownField<String>(
                        value: _source,
                        hintText: 'Select Source',
                        prefixIcon: Icons.campaign_outlined,
                        items: [
                          'walk_in',
                          'instagram',
                          'facebook',
                          'website',
                          'referral',
                          'justdial',
                        ]
                            .map(
                              (s) => DropdownMenuItem(
                                value: s,
                                child: Text(
                                  s.replaceAll('_', ' ').toUpperCase(),
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _source = val);
                        },
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Assigned Stylist / Staff'),
                      staffAsync.when(
                        loading: () => const Center(
                          child: Padding(
                            padding: EdgeInsets.all(8.0),
                            child: CircularProgressIndicator(
                              color: Color(0xFFE91E63),
                            ),
                          ),
                        ),
                        error: (err, stack) => Text(
                          'Error loading staff list',
                          style: GoogleFonts.inter(color: Colors.red),
                        ),
                        data: (staffList) {
                          final items = staffList
                              .map(
                                (s) => DropdownMenuItem<String>(
                                  value: s['id'].toString(),
                                  child: Text(
                                    '${s['first_name'] ?? ''} ${s['last_name'] ?? ''}'
                                        .trim(),
                                  ),
                                ),
                              )
                              .toList();
                          return CustomDropdownField<String>(
                            value: _assignedTo,
                            hintText: 'Select Staff Member',
                            prefixIcon: Icons.support_agent_outlined,
                            items: items,
                            onChanged: (val) =>
                                setState(() => _assignedTo = val),
                          );
                        },
                      ),
                      SizedBox(height: 16.h),

                      _buildLabel('Next Follow-Up Date'),
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
                              color: _followUpDate != null
                                  ? const Color(0xFFE91E63)
                                  : const Color(0xFFF1E4E8),
                              width: _followUpDate != null ? 1.5 : 1.2,
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
                                  Icons.event_available_outlined,
                                  color: Color(0xFFE91E63),
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                child: Text(
                                  _followUpDate != null
                                      ? DateFormat('dd MMM yyyy')
                                          .format(_followUpDate!)
                                      : 'Select follow-up date',
                                  style: GoogleFonts.inter(
                                    fontSize: 14.sp,
                                    color: _followUpDate != null
                                        ? const Color(0xFF0F172A)
                                        : const Color(0xFF94A3B8),
                                    fontWeight: _followUpDate != null
                                        ? FontWeight.w500
                                        : FontWeight.normal,
                                  ),
                                ),
                              ),
                              if (_followUpDate != null)
                                InkWell(
                                  onTap: () => setState(() => _followUpDate = null),
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
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // Section 3: Notes
                  _buildSectionCard(
                    title: 'Discussion Notes & Inquiries',
                    subtitle: 'Client preferences, services inquired & reminders',
                    icon: Icons.description_outlined,
                    children: [
                      _buildLabel('Notes / Inquiries'),
                      _buildTextField(
                        controller: _notesCtrl,
                        hintText:
                            'Write details of consultation, required services, or follow-up notes...',
                        prefixIcon: Icons.notes_rounded,
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
                                    isEditing ? 'Save Changes' : 'Add Lead',
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

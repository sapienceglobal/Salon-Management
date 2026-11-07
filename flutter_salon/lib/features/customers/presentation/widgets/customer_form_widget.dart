import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/form_validators.dart';
import '../../../../core/utils/form_scroll_helper.dart';
import '../../../../core/widgets/custom_dropdown_field.dart';
import '../../data/customer_provider.dart';

class CustomerFormWidget extends ConsumerStatefulWidget {
  final Map<String, dynamic>? customer;
  final Function(int id)? onSaved;
  final VoidCallback? onCancel;

  const CustomerFormWidget({
    super.key,
    this.customer,
    this.onSaved,
    this.onCancel,
  });

  @override
  ConsumerState<CustomerFormWidget> createState() => _CustomerFormWidgetState();
}

class _CustomerFormWidgetState extends ConsumerState<CustomerFormWidget> {
  final _formKey = GlobalKey<FormState>();

  final _firstNameFocus = FocusNode();
  final _lastNameFocus = FocusNode();
  final _phoneFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _locationFocus = FocusNode();
  final _addressFocus = FocusNode();
  final _gstNumberFocus = FocusNode();
  final _notesFocus = FocusNode();

  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _gstNumberController;
  late TextEditingController _locationController;
  late TextEditingController _addressController;
  late TextEditingController _notesController;

  DateTime? _dob;
  DateTime? _anniversary;

  String _gender = 'female';
  String _source = 'Walk-in';

  bool _smsOptIn = false;
  bool _emailOptIn = false;
  bool _whatsappOptIn = false;

  bool _isLoading = false;

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
    _firstNameController = TextEditingController(
      text: widget.customer?['first_name'] ?? '',
    );
    _lastNameController = TextEditingController(
      text: widget.customer?['last_name'] ?? '',
    );
    _phoneController = TextEditingController(
      text: widget.customer?['phone'] ?? '',
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
    _whatsappOptIn =
        widget.customer?['whatsapp_opt_in'] == true ||
        widget.customer?['whatsapp_opt_in'] == 1;
  }

  Future<void> _selectDate(BuildContext context, bool isDob) async {
    FormScrollHelper.unfocus();
    final initialDate = isDob
        ? (_dob ?? DateTime.now())
        : (_anniversary ?? DateTime.now());
    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
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

  Future<void> _saveCustomer() async {
    final isValid = FormScrollHelper.validateAndScroll(
      context: context,
      formKey: _formKey,
      fields: [
        FormFieldTarget(
          target: _firstNameFocus,
          isInvalid: () =>
              FormValidators.name('First Name')(_firstNameController.text) != null,
        ),
        FormFieldTarget(
          target: _phoneFocus,
          isInvalid: () =>
              FormValidators.phone()(_phoneController.text) != null,
        ),
        FormFieldTarget(
          target: _emailFocus,
          isInvalid: () =>
              FormValidators.email()(_emailController.text) != null,
        ),
      ],
    );
    if (!isValid) return;

    setState(() => _isLoading = true);
    try {
      final repository = ref.read(customerRepositoryProvider);
      final data = <String, dynamic>{
        'first_name': _firstNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        'gender': _gender,
        'gst_number': _gstNumberController.text.trim(),
        'location': _locationController.text.trim(),
        'source': _source,
        'address': _addressController.text.trim(),
        'notes': _notesController.text.trim(),
        'date_of_birth': _dob != null
            ? DateFormat('yyyy-MM-dd').format(_dob!)
            : null,
        'anniversary': _anniversary != null
            ? DateFormat('yyyy-MM-dd').format(_anniversary!)
            : null,
        'sms_opt_in': _smsOptIn,
        'email_opt_in': _emailOptIn,
        'whatsapp_opt_in': _whatsappOptIn,
      };

      int savedId;
      if (widget.customer != null) {
        await repository.updateCustomer(widget.customer!['id'], data);
        savedId = widget.customer!['id'];
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Customer updated successfully')),
          );
        }
      } else {
        final result = await repository.createCustomer(data);
        savedId = result['data']?['id'] ?? result['id'];
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Customer added successfully')),
          );
        }
      }
      ref.invalidate(customersListProvider);
      if (widget.onSaved != null) {
        widget.onSaved!(savedId);
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

  Widget _buildSectionCard(String title, List<Widget> children) {
    return Container(
      margin: EdgeInsets.only(bottom: 24.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15.r,
            offset: Offset(0, 4.h),
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
    required TextEditingController controller,
    required String labelText,
    required IconData icon,
    FocusNode? focusNode,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
    int maxLines = 1,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16.h),
      child: TextFormField(
        controller: controller,
        focusNode: focusNode,
        keyboardType: keyboardType,
        maxLines: maxLines,
        style: GoogleFonts.inter(fontSize: 15.sp),
        decoration: InputDecoration(
          labelText: labelText,
          labelStyle: GoogleFonts.inter(
            color: AppColors.textSecondary,
            fontSize: 14.sp,
          ),
          prefixIcon: Icon(icon, color: AppColors.primary, size: 20.sp),
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
          contentPadding: EdgeInsets.symmetric(
            vertical: 20.h,
            horizontal: 20.w,
          ),
        ),
        validator: validator,
      ),
    );
  }

  Widget _buildPremiumDropdown({
    required String label,
    required String value,
    required List<String> items,
    required IconData icon,
    required void Function(String?) onChanged,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16.h),
      child: CustomDropdownField<String>(
        hintText: label,
        value: value.isEmpty ? null : value,
        prefixIcon: icon,
        items: items
            .map((e) => DropdownMenuItem<String>(value: e, child: Text(e)))
            .toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildDatePickerField(
    String label,
    DateTime? date,
    VoidCallback onTap,
    IconData icon,
  ) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16.h),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16.r),
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            labelStyle: GoogleFonts.inter(
              color: AppColors.textSecondary,
              fontSize: 14.sp,
            ),
            prefixIcon: Icon(icon, color: AppColors.primary, size: 20.sp),
            filled: true,
            fillColor: AppColors.background,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16.r),
              borderSide: BorderSide.none,
            ),
            contentPadding: EdgeInsets.symmetric(
              vertical: 20.h,
              horizontal: 20.w,
            ),
          ),
          child: Text(
            date != null
                ? DateFormat('yyyy-MM-dd').format(date)
                : 'Select Date',
            style: GoogleFonts.inter(
              fontSize: 15.sp,
              color: date != null
                  ? AppColors.textPrimary
                  : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSwitchTile(
    String title,
    bool value,
    void Function(bool) onChanged,
  ) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 15.sp,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: Colors.white,
            activeTrackColor: AppColors.primary,
            inactiveTrackColor: AppColors.background,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.customer != null;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: FormScrollHelper.unfocus,
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            if (widget.onCancel != null)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      isEditing ? 'Edit Customer' : 'Add New Customer',
                      style: GoogleFonts.poppins(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      Icons.close_rounded,
                      color: AppColors.textSecondary,
                      size: 24.sp,
                    ),
                    onPressed: widget.onCancel,
                  ),
                ],
              ),
            if (widget.onCancel != null) SizedBox(height: 24.h),
            _buildSectionCard('Basic Information', [
              _buildPremiumTextField(
                controller: _firstNameController,
                focusNode: _firstNameFocus,
                labelText: 'First Name',
                icon: Icons.person_outline,
                validator: FormValidators.name('First Name'),
              ),
              _buildPremiumTextField(
                controller: _lastNameController,
                focusNode: _lastNameFocus,
                labelText: 'Last Name',
                icon: Icons.person_outline,
              ),
              _buildPremiumDropdown(
                label: 'Gender',
                value: _gender,
                items: const ['male', 'female', 'other'],
                icon: Icons.transgender_rounded,
                onChanged: (v) => setState(() => _gender = v!),
              ),
            ]),

            _buildSectionCard('Contact Details', [
              _buildPremiumTextField(
                controller: _phoneController,
                focusNode: _phoneFocus,
                labelText: 'Phone Number',
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                validator: FormValidators.phone(),
              ),
              _buildPremiumTextField(
                controller: _emailController,
                focusNode: _emailFocus,
                labelText: 'Email Address',
                icon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
                validator: FormValidators.email(),
              ),
              _buildPremiumTextField(
                controller: _locationController,
                focusNode: _locationFocus,
                labelText: 'Location / City',
                icon: Icons.location_city_outlined,
              ),
              _buildPremiumTextField(
                controller: _addressController,
                focusNode: _addressFocus,
                labelText: 'Full Address',
                icon: Icons.location_on_outlined,
                maxLines: 2,
              ),
            ]),

            _buildSectionCard('Additional Info', [
              _buildDatePickerField(
                'Date of Birth',
                _dob,
                () => _selectDate(context, true),
                Icons.cake_outlined,
              ),
              _buildDatePickerField(
                'Anniversary',
                _anniversary,
                () => _selectDate(context, false),
                Icons.favorite_border_rounded,
              ),
              _buildPremiumDropdown(
                label: 'Source',
                value: _source,
                items: _sources,
                icon: Icons.campaign_outlined,
                onChanged: (v) => setState(() => _source = v!),
              ),
              _buildPremiumTextField(
                controller: _gstNumberController,
                focusNode: _gstNumberFocus,
                labelText: 'GST Number',
                icon: Icons.receipt_long_outlined,
              ),
              _buildPremiumTextField(
                controller: _notesController,
                focusNode: _notesFocus,
                labelText: 'Notes',
                icon: Icons.notes_rounded,
                maxLines: 3,
              ),
            ]),

            _buildSectionCard('Communication Preferences', [
              _buildSwitchTile(
                'SMS Updates',
                _smsOptIn,
                (v) => setState(() => _smsOptIn = v),
              ),
              _buildSwitchTile(
                'Email Updates',
                _emailOptIn,
                (v) => setState(() => _emailOptIn = v),
              ),
              _buildSwitchTile(
                'WhatsApp Updates',
                _whatsappOptIn,
                (v) => setState(() => _whatsappOptIn = v),
              ),
            ]),

            SizedBox(height: 16.h),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveCustomer,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(vertical: 20.h),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16.r),
                  ),
                  elevation: 4,
                  shadowColor: AppColors.primary.withOpacity(0.5),
                ),
                child: _isLoading
                    ? SizedBox(
                        height: 24.h,
                        width: 24.h,
                        child: const CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2.5,
                        ),
                      )
                    : Text(
                        isEditing ? 'Save Changes' : 'Add Customer',
                        style: GoogleFonts.inter(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
              ),
            ),
            SizedBox(height: 40.h),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _firstNameFocus.dispose();
    _lastNameFocus.dispose();
    _phoneFocus.dispose();
    _emailFocus.dispose();
    _locationFocus.dispose();
    _addressFocus.dispose();
    _gstNumberFocus.dispose();
    _notesFocus.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _gstNumberController.dispose();
    _locationController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }
}

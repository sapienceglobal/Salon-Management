import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/utils/form_validators.dart';
import '../providers/settings_provider.dart';

class GeneralSettingsTab extends ConsumerStatefulWidget {
  final Map<String, dynamic> business;
  const GeneralSettingsTab({super.key, required this.business});

  @override
  ConsumerState<GeneralSettingsTab> createState() => _GeneralSettingsTabState();
}

class _GeneralSettingsTabState extends ConsumerState<GeneralSettingsTab> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _gstController;
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  late TextEditingController _pincodeController;
  late TextEditingController _currencyController;
  late TextEditingController _timezoneController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.business['name']);
    _emailController = TextEditingController(text: widget.business['email']);
    _phoneController = TextEditingController(text: widget.business['phone']);
    _gstController = TextEditingController(text: widget.business['gst_number']);
    _addressController = TextEditingController(text: widget.business['address']);
    _cityController = TextEditingController(text: widget.business['city']);
    _stateController = TextEditingController(text: widget.business['state']);
    _pincodeController = TextEditingController(text: widget.business['pincode']);
    _currencyController = TextEditingController(
      text: widget.business['currency'] ?? 'INR',
    );
    _timezoneController = TextEditingController(
      text: widget.business['timezone'] ?? 'Asia/Kolkata',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _gstController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _currencyController.dispose();
    _timezoneController.dispose();
    super.dispose();
  }

  void _save() {
    if (_formKey.currentState!.validate()) {
      ref.read(settingsDataProvider.notifier).updateBusiness({
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'gst_number': _gstController.text.trim(),
        'address': _addressController.text.trim(),
        'city': _cityController.text.trim(),
        'state': _stateController.text.trim(),
        'pincode': _pincodeController.text.trim(),
        'currency': _currencyController.text.trim(),
        'timezone': _timezoneController.text.trim(),
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Business Profile Updated Successfully')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: EdgeInsets.all(16.w),
        children: [
          Text(
            'Business Profile',
            style: GoogleFonts.poppins(
              fontSize: 18.sp,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 6.h),
          Text(
            'Manage brand info, address, tax details and localization',
            style: GoogleFonts.inter(
              fontSize: 12.sp,
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: 16.h),
          TextFormField(
            controller: _nameController,
            decoration: _inputDecoration('Business Name', Icons.store),
            validator: FormValidators.name('Business Name'),
          ),
          SizedBox(height: 14.h),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _emailController,
                  decoration: _inputDecoration('Email', Icons.email),
                  validator: FormValidators.email(isRequired: false),
                  keyboardType: TextInputType.emailAddress,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: TextFormField(
                  controller: _phoneController,
                  decoration: _inputDecoration('Phone', Icons.phone),
                  validator: FormValidators.phone(isRequired: false),
                  keyboardType: TextInputType.phone,
                ),
              ),
            ],
          ),
          SizedBox(height: 14.h),
          TextFormField(
            controller: _gstController,
            decoration: _inputDecoration('GST / Tax ID Number', Icons.receipt_long),
          ),
          SizedBox(height: 14.h),
          TextFormField(
            controller: _addressController,
            decoration: _inputDecoration('Street Address', Icons.location_on),
            maxLines: 2,
          ),
          SizedBox(height: 14.h),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _cityController,
                  decoration: _inputDecoration('City', Icons.location_city),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: TextFormField(
                  controller: _stateController,
                  decoration: _inputDecoration('State', Icons.map),
                ),
              ),
            ],
          ),
          SizedBox(height: 14.h),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _pincodeController,
                  decoration: _inputDecoration('Pincode / Zip', Icons.pin_drop),
                  keyboardType: TextInputType.number,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: TextFormField(
                  controller: _currencyController,
                  decoration: _inputDecoration('Currency (e.g. INR)', Icons.currency_rupee),
                ),
              ),
            ],
          ),
          SizedBox(height: 14.h),
          TextFormField(
            controller: _timezoneController,
            decoration: _inputDecoration('Timezone (e.g. Asia/Kolkata)', Icons.access_time),
          ),
          SizedBox(height: 24.h),
          ElevatedButton(
            onPressed: _save,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(vertical: 16.h),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
            child: Text(
              'Save Changes',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(height: 24.h),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: AppColors.primary, size: 20.sp),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r)),
      filled: true,
      fillColor: Colors.white,
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/features/crm/data/crm_provider.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/form_validators.dart';

class AddEditEnquiryForm extends ConsumerStatefulWidget {
  final Map<String, dynamic>? enquiry;

  const AddEditEnquiryForm({super.key, this.enquiry});

  @override
  ConsumerState<AddEditEnquiryForm> createState() => _AddEditEnquiryFormState();
}

class _AddEditEnquiryFormState extends ConsumerState<AddEditEnquiryForm> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _locationCtrl;
  late TextEditingController _notesCtrl;
  late TextEditingController _followUpDateCtrl;

  String _gender = 'Male';
  String _source = 'walk_in';
  String _status = 'new';
  String? _assignedTo;

  @override
  void initState() {
    super.initState();
    final e = widget.enquiry;
    _nameCtrl = TextEditingController(text: e?['name'] ?? '');
    _phoneCtrl = TextEditingController(text: e?['phone'] ?? '');
    _emailCtrl = TextEditingController(text: e?['email'] ?? '');
    _locationCtrl = TextEditingController(text: e?['location'] ?? '');
    _notesCtrl = TextEditingController(text: e?['notes'] ?? '');

    String followUpDateStr = '';
    if (e?['follow_up_date'] != null) {
      try {
        final dt = DateTime.parse(e!['follow_up_date']);
        followUpDateStr =
            "${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}";
      } catch (_) {}
    }
    _followUpDateCtrl = TextEditingController(text: followUpDateStr);

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
    ].contains(_source))
      _source = 'walk_in';

    _status = e?['status']?.toString().toLowerCase() ?? 'new';
    if (![
      'new',
      'contacted',
      'follow_up',
      'converted',
      'lost',
    ].contains(_status))
      _status = 'new';
    if (e?['assigned_to'] != null) {
      _assignedTo = e!['assigned_to'].toString();
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
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
        _followUpDateCtrl.text =
            "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
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
      if (_followUpDateCtrl.text.isNotEmpty) {
        payload['follow_up_date'] = _followUpDateCtrl.text;
      }

      final repo = ref.read(crmRepositoryProvider);
      if (widget.enquiry == null) {
        await repo.createLead(payload);
      } else {
        await repo.updateLead(widget.enquiry!['id'], payload);
      }

      ref.invalidate(leadsListProvider);
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.enquiry == null
                  ? 'Enquiry added successfully'
                  : 'Enquiry updated successfully',
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
            content: Text('Error: $errMsg'),
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
    final staffAsync = ref.watch(staffListProvider);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32.r)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(height: 16.h),
            Center(
              child: Container(
                width: 40.w,
                height: 4.h,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2.r),
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 16.h),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.enquiry == null ? 'Add New Lead' : 'Edit Lead',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 24.sp,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Divider(color: AppColors.border, height: 1.h),
            Flexible(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(24.w),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildPremiumTextField(
                        controller: _nameCtrl,
                        label: 'Full Name *',
                        icon: Icons.person_rounded,
                        validator: FormValidators.name('Full Name'),
                      ),
                      SizedBox(height: 16.h),
                      _buildPremiumTextField(
                        controller: _phoneCtrl,
                        label: 'Mobile No *',
                        icon: Icons.phone_rounded,
                        keyboardType: TextInputType.phone,
                        validator: FormValidators.phone(),
                      ),
                      SizedBox(height: 16.h),
                      _buildPremiumTextField(
                        controller: _emailCtrl,
                        label: 'Email Address',
                        icon: Icons.email_rounded,
                        keyboardType: TextInputType.emailAddress,
                      ),
                      SizedBox(height: 16.h),
                      Row(
                        children: [
                          Expanded(
                            child: _buildDropdown(
                              label: 'Gender',
                              value: _gender,
                              items: const [
                                DropdownMenuItem(
                                  value: 'Male',
                                  child: Text('Male'),
                                ),
                                DropdownMenuItem(
                                  value: 'Female',
                                  child: Text('Female'),
                                ),
                                DropdownMenuItem(
                                  value: 'Unisex',
                                  child: Text('Unisex'),
                                ),
                              ],
                              onChanged: (v) => setState(() => _gender = v!),
                            ),
                          ),
                          SizedBox(width: 16.w),
                          Expanded(
                            child: _buildPremiumTextField(
                              controller: _locationCtrl,
                              label: 'Location',
                              icon: Icons.location_on_rounded,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 16.h),
                      _buildDropdown(
                        label: 'Source',
                        value: _source,
                        items: const [
                          DropdownMenuItem(
                            value: 'walk_in',
                            child: Text('Walk-in'),
                          ),
                          DropdownMenuItem(
                            value: 'facebook',
                            child: Text('Facebook'),
                          ),
                          DropdownMenuItem(
                            value: 'instagram',
                            child: Text('Instagram'),
                          ),
                          DropdownMenuItem(
                            value: 'justdial',
                            child: Text('JustDial'),
                          ),
                          DropdownMenuItem(
                            value: 'website',
                            child: Text('Website'),
                          ),
                          DropdownMenuItem(
                            value: 'referral',
                            child: Text('Referral'),
                          ),
                        ],
                        onChanged: (v) => setState(() => _source = v!),
                      ),
                      SizedBox(height: 16.h),
                      _buildDropdown(
                        label: 'Status',
                        value: _status,
                        items: const [
                          DropdownMenuItem(value: 'new', child: Text('New')),
                          DropdownMenuItem(
                            value: 'contacted',
                            child: Text('Contacted'),
                          ),
                          DropdownMenuItem(
                            value: 'follow_up',
                            child: Text('Follow Up'),
                          ),
                          DropdownMenuItem(
                            value: 'converted',
                            child: Text('Converted'),
                          ),
                          DropdownMenuItem(value: 'lost', child: Text('Lost')),
                        ],
                        onChanged: (v) => setState(() => _status = v!),
                      ),
                      SizedBox(height: 16.h),
                      staffAsync.when(
                        loading: () => const CircularProgressIndicator(
                          color: AppColors.primary,
                        ),
                        error: (err, stack) => Text(
                          'Error loading staff: $err',
                          style: GoogleFonts.inter(color: AppColors.error),
                        ),
                        data: (staffList) {
                          final validIds = staffList
                              .map((s) => s['id'].toString())
                              .toList();
                          final safeAssignedTo = validIds.contains(_assignedTo)
                              ? _assignedTo
                              : null;
                          return _buildDropdown(
                            label: 'Assign To',
                            value: safeAssignedTo,
                            items: [
                              const DropdownMenuItem(
                                value: null,
                                child: Text('Unassigned'),
                              ),
                              ...staffList.map(
                                (s) => DropdownMenuItem(
                                  value: s['id'].toString(),
                                  child: Text(s['first_name'] ?? 'Unknown'),
                                ),
                              ),
                            ],
                            onChanged: (v) => setState(() => _assignedTo = v),
                          );
                        },
                      ),
                      SizedBox(height: 16.h),
                      _buildPremiumTextField(
                        controller: _followUpDateCtrl,
                        label: 'Follow Up Date',
                        icon: Icons.calendar_today_rounded,
                        readOnly: true,
                        onTap: _selectDate,
                      ),
                      SizedBox(height: 16.h),
                      _buildPremiumTextField(
                        controller: _notesCtrl,
                        label: 'Notes',
                        icon: Icons.notes_rounded,
                        maxLines: 3,
                      ),
                      SizedBox(height: 32.h),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: EdgeInsets.symmetric(vertical: 18.h),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16.r),
                            ),
                            elevation: 4,
                            shadowColor: AppColors.primary.withOpacity(0.4),
                          ),
                          child: _isLoading
                              ? SizedBox(
                                  width: 24.w,
                                  height: 24.h,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  'Save Lead',
                                  style: GoogleFonts.inter(
                                    fontSize: 16.sp,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                      ),
                      SizedBox(height: 24.h),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    bool readOnly = false,
    VoidCallback? onTap,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      readOnly: readOnly,
      onTap: onTap,
      validator: validator,
      style: GoogleFonts.inter(fontSize: 15.sp, color: AppColors.textPrimary),
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
        contentPadding: EdgeInsets.symmetric(vertical: 18.h, horizontal: 20.w),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<DropdownMenuItem<String?>> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String?>(
      initialValue: value,
      icon: Icon(
        Icons.keyboard_arrow_down_rounded,
        color: AppColors.textSecondary,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.inter(color: AppColors.textSecondary),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16.r),
          borderSide: BorderSide.none,
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 18.h),
      ),
      items: items.map((item) {
        return DropdownMenuItem<String?>(
          value: item.value,
          child: Text(
            (item.child as Text).data ?? '',
            style: GoogleFonts.inter(fontSize: 15.sp),
          ),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _locationCtrl.dispose();
    _notesCtrl.dispose();
    _followUpDateCtrl.dispose();
    super.dispose();
  }
}

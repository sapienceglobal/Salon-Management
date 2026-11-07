import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../../core/theme/app_colors.dart';
import '../providers/settings_provider.dart';

class BillingTaxTab extends ConsumerStatefulWidget {
  final Map<String, dynamic> settings;
  const BillingTaxTab({super.key, required this.settings});

  @override
  ConsumerState<BillingTaxTab> createState() => _BillingTaxTabState();
}

class _BillingTaxTabState extends ConsumerState<BillingTaxTab> {
  final _formKey = GlobalKey<FormState>();
  bool _taxEnabled = true;
  late TextEditingController _cgstController;
  late TextEditingController _sgstController;
  late TextEditingController _prefixController;
  late TextEditingController _rewardPointsPer100Controller;
  late TextEditingController _rewardValueController;
  bool _feedbackEnabled = true;
  bool _autoFeedbackAfterVisit = true;

  @override
  void initState() {
    super.initState();
    _taxEnabled = widget.settings['tax_enabled'] ?? true;
    _cgstController = TextEditingController(
      text: (widget.settings['default_cgst'] ?? 9.0).toString(),
    );
    _sgstController = TextEditingController(
      text: (widget.settings['default_sgst'] ?? 9.0).toString(),
    );
    _prefixController = TextEditingController(
      text: widget.settings['invoice_prefix'] ?? 'INV',
    );
    _rewardPointsPer100Controller = TextEditingController(
      text: (widget.settings['reward_points_per_100'] ?? 10).toString(),
    );
    _rewardValueController = TextEditingController(
      text: (widget.settings['reward_points_value'] ?? 1.0).toString(),
    );
    _feedbackEnabled = widget.settings['feedback_enabled'] ?? true;
    _autoFeedbackAfterVisit = widget.settings['auto_feedback_after_visit'] ?? true;
  }

  @override
  void dispose() {
    _cgstController.dispose();
    _sgstController.dispose();
    _prefixController.dispose();
    _rewardPointsPer100Controller.dispose();
    _rewardValueController.dispose();
    super.dispose();
  }

  void _save() {
    if (_formKey.currentState!.validate()) {
      ref.read(settingsDataProvider.notifier).updateConfig({
        'tax_enabled': _taxEnabled,
        'default_cgst': double.tryParse(_cgstController.text.trim()) ?? 9.0,
        'default_sgst': double.tryParse(_sgstController.text.trim()) ?? 9.0,
        'invoice_prefix': _prefixController.text.trim(),
        'reward_points_per_100': int.tryParse(_rewardPointsPer100Controller.text.trim()) ?? 10,
        'reward_points_value': double.tryParse(_rewardValueController.text.trim()) ?? 1.0,
        'feedback_enabled': _feedbackEnabled,
        'auto_feedback_after_visit': _autoFeedbackAfterVisit,
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Billing & Tax Settings Updated Successfully')));
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
            'Billing & Tax Configuration',
            style: GoogleFonts.poppins(
              fontSize: 18.sp,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 6.h),
          Text(
            'GST rates, invoice numbering, loyalty rewards & feedback',
            style: GoogleFonts.inter(
              fontSize: 12.sp,
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: 16.h),
          SwitchListTile(
            title: Text('Enable GST / Tax Calculation', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            subtitle: Text('Apply CGST & SGST on checkout and POS invoices', style: GoogleFonts.inter(fontSize: 12.sp, color: AppColors.textSecondary)),
            value: _taxEnabled,
            activeThumbColor: AppColors.primary,
            contentPadding: EdgeInsets.zero,
            onChanged: (v) => setState(() => _taxEnabled = v),
          ),
          if (_taxEnabled) ...[
            SizedBox(height: 12.h),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _cgstController,
                    decoration: _inputDecoration('Default CGST %', Icons.percent),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: TextFormField(
                    controller: _sgstController,
                    decoration: _inputDecoration('Default SGST %', Icons.percent),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
              ],
            ),
          ],
          SizedBox(height: 14.h),
          TextFormField(
            controller: _prefixController,
            decoration: _inputDecoration('Invoice Number Prefix (e.g. INV)', Icons.receipt),
          ),
          SizedBox(height: 16.h),
          Divider(color: Colors.grey.shade200),
          SizedBox(height: 8.h),
          Text(
            'Loyalty & Reward Points',
            style: GoogleFonts.poppins(
              fontSize: 15.sp,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 12.h),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _rewardPointsPer100Controller,
                  decoration: _inputDecoration('Points per ₹100 Spent', Icons.stars),
                  keyboardType: TextInputType.number,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: TextFormField(
                  controller: _rewardValueController,
                  decoration: _inputDecoration('Value per Point (₹)', Icons.currency_rupee),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          Divider(color: Colors.grey.shade200),
          SizedBox(height: 8.h),
          Text(
            'Feedback Automation',
            style: GoogleFonts.poppins(
              fontSize: 15.sp,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 10.h),
          SwitchListTile(
            title: Text('Customer Feedback System', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
            subtitle: Text('Enable review collection', style: GoogleFonts.inter(fontSize: 12.sp, color: AppColors.textSecondary)),
            value: _feedbackEnabled,
            activeThumbColor: AppColors.primary,
            contentPadding: EdgeInsets.zero,
            onChanged: (v) => setState(() => _feedbackEnabled = v),
          ),
          SwitchListTile(
            title: Text('Auto Request Review After Visit', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
            subtitle: Text('Send automated review request link on checkout', style: GoogleFonts.inter(fontSize: 12.sp, color: AppColors.textSecondary)),
            value: _autoFeedbackAfterVisit,
            activeThumbColor: AppColors.primary,
            contentPadding: EdgeInsets.zero,
            onChanged: (v) => setState(() => _autoFeedbackAfterVisit = v),
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

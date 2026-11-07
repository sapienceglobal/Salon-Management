import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../../core/theme/app_colors.dart';
import '../providers/settings_provider.dart';

class OperationsTab extends ConsumerStatefulWidget {
  final Map<String, dynamic> settings;
  const OperationsTab({super.key, required this.settings});

  @override
  ConsumerState<OperationsTab> createState() => _OperationsTabState();
}

class _OperationsTabState extends ConsumerState<OperationsTab> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _startController;
  late TextEditingController _endController;
  late TextEditingController _advanceDaysController;
  late TextEditingController _cancellationPolicyController;
  int _selectedSlotDuration = 30;
  int _selectedWeeklyOff = 1;
  bool _feedbackEnabled = false;

  final Map<int, String> _daysOfWeek = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };

  final List<int> _slotDurations = [15, 30, 45, 60];

  @override
  void initState() {
    super.initState();
    _startController = TextEditingController(
      text: widget.settings['working_hours_start'] ?? '09:00:00',
    );
    _endController = TextEditingController(
      text: widget.settings['working_hours_end'] ?? '21:00:00',
    );
    _selectedSlotDuration = int.tryParse(widget.settings['appointment_slot_duration']?.toString() ?? '30') ?? 30;
    if (!_slotDurations.contains(_selectedSlotDuration)) {
      _selectedSlotDuration = 30;
    }
    _advanceDaysController = TextEditingController(
      text: (widget.settings['booking_advance_days'] ?? 30).toString(),
    );
    _selectedWeeklyOff = int.tryParse(widget.settings['weekly_off_day']?.toString() ?? '1') ?? 1;
    _cancellationPolicyController = TextEditingController(
      text: widget.settings['cancellation_policy'] ?? '',
    );
    _feedbackEnabled = widget.settings['feedback_enabled'] == true || widget.settings['feedback_enabled'] == 1;
  }

  @override
  void dispose() {
    _startController.dispose();
    _endController.dispose();
    _advanceDaysController.dispose();
    _cancellationPolicyController.dispose();
    super.dispose();
  }

  Future<void> _pickTime(TextEditingController controller) async {
    final parts = controller.text.split(':');
    final initialHour = parts.isNotEmpty ? (int.tryParse(parts[0]) ?? 9) : 9;
    final initialMinute = parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0;

    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: initialHour, minute: initialMinute),
    );

    if (picked != null) {
      final h = picked.hour.toString().padLeft(2, '0');
      final m = picked.minute.toString().padLeft(2, '0');
      setState(() {
        controller.text = '$h:$m:00';
      });
    }
  }

  void _save() {
    if (_formKey.currentState!.validate()) {
      ref.read(settingsDataProvider.notifier).updateConfig({
        'working_hours_start': _startController.text.trim(),
        'working_hours_end': _endController.text.trim(),
        'appointment_slot_duration': _selectedSlotDuration,
        'booking_advance_days': int.tryParse(_advanceDaysController.text.trim()) ?? 30,
        'weekly_off_day': _selectedWeeklyOff,
        'cancellation_policy': _cancellationPolicyController.text.trim(),
        'feedback_enabled': _feedbackEnabled,
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Operations Settings Updated Successfully')),
      );
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
            'Operations & Scheduling',
            style: GoogleFonts.poppins(
              fontSize: 18.sp,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 6.h),
          Text(
            'Configure salon working hours, booking slot size and cancellations',
            style: GoogleFonts.inter(
              fontSize: 12.sp,
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: 16.h),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => _pickTime(_startController),
                  child: AbsorbPointer(
                    child: TextFormField(
                      controller: _startController,
                      decoration: _inputDecoration('Opening Time', Icons.access_time),
                    ),
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: GestureDetector(
                  onTap: () => _pickTime(_endController),
                  child: AbsorbPointer(
                    child: TextFormField(
                      controller: _endController,
                      decoration: _inputDecoration('Closing Time', Icons.access_time_filled),
                    ),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 14.h),
          DropdownButtonFormField<int>(
            initialValue: _selectedWeeklyOff,
            decoration: _inputDecoration('Weekly Off Day', Icons.event_busy),
            items: _daysOfWeek.entries.map((e) {
              return DropdownMenuItem<int>(
                value: e.key,
                child: Text(e.value, style: GoogleFonts.inter()),
              );
            }).toList(),
            onChanged: (v) {
              if (v != null) setState(() => _selectedWeeklyOff = v);
            },
          ),
          SizedBox(height: 14.h),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<int>(
                  initialValue: _selectedSlotDuration,
                  decoration: _inputDecoration('Slot Duration', Icons.timelapse),
                  items: _slotDurations.map((mins) {
                    return DropdownMenuItem<int>(
                      value: mins,
                      child: Text('$mins mins', style: GoogleFonts.inter()),
                    );
                  }).toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _selectedSlotDuration = v);
                  },
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: TextFormField(
                  controller: _advanceDaysController,
                  decoration: _inputDecoration('Max Advance Days', Icons.calendar_month),
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
          SizedBox(height: 14.h),
          TextFormField(
            controller: _cancellationPolicyController,
            decoration: _inputDecoration('Cancellation & Reschedule Policy', Icons.policy),
            maxLines: 3,
          ),
          SizedBox(height: 14.h),
          SwitchListTile(
            title: Text('Enable Customer Feedback System', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
            subtitle: Text('Allows collecting ratings after appointments', style: GoogleFonts.inter(fontSize: 12.sp, color: AppColors.textSecondary)),
            value: _feedbackEnabled,
            activeThumbColor: AppColors.primary,
            contentPadding: EdgeInsets.zero,
            onChanged: (v) => setState(() => _feedbackEnabled = v),
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

  InputDecoration _inputDecoration(String label, [IconData? icon]) {
    return InputDecoration(
      labelText: label,
      prefixIcon: icon != null ? Icon(icon, color: AppColors.primary, size: 20.sp) : null,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r)),
      filled: true,
      fillColor: Colors.white,
    );
  }
}

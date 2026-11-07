import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../../core/theme/app_colors.dart';
import '../providers/settings_provider.dart';

class CommissionsTab extends ConsumerWidget {
  const CommissionsTab({super.key});

  void _showProfileDialog(
    BuildContext context,
    WidgetRef ref, [
    Map<String, dynamic>? profile,
  ]) {
    final nameController = TextEditingController(text: profile?['name']);
    final valueController = TextEditingController(
      text: profile?['value']?.toString(),
    );
    String selectedType = profile?['type'] ?? 'percentage';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text(
                profile == null ? 'New Profile' : 'Edit Profile',
                style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(
                      labelText: 'Profile Name',
                    ),
                  ),
                  SizedBox(height: 16.h),
                  DropdownButtonFormField<String>(
                    initialValue: selectedType,
                    items: const [
                      DropdownMenuItem(
                        value: 'percentage',
                        child: Text('Percentage'),
                      ),
                      DropdownMenuItem(
                        value: 'flat',
                        child: Text('Flat Amount'),
                      ),
                      DropdownMenuItem(value: 'tiered', child: Text('Tiered')),
                    ],
                    onChanged: (v) => setState(() => selectedType = v!),
                    decoration: const InputDecoration(labelText: 'Type'),
                  ),
                  SizedBox(height: 16.h),
                  if (selectedType != 'tiered')
                    TextField(
                      controller: valueController,
                      decoration: const InputDecoration(labelText: 'Value'),
                      keyboardType: TextInputType.number,
                    ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    final data = {
                      'name': nameController.text,
                      'type': selectedType,
                      if (selectedType != 'tiered')
                        'value': double.tryParse(valueController.text),
                    };
                    if (profile == null) {
                      ref
                          .read(commissionProfilesProvider.notifier)
                          .createProfile(data);
                    } else {
                      ref
                          .read(commissionProfilesProvider.notifier)
                          .updateProfile(profile['id'], data);
                    }
                    Navigator.pop(context);
                  },
                  child: Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profilesAsync = ref.watch(commissionProfilesProvider);

    return profilesAsync.when(
      loading: () => Center(child: CircularProgressIndicator()),
      error: (e, st) => Center(child: Text('Error: $e')),
      data: (profiles) {
        return ListView(
          padding: EdgeInsets.all(16.w),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Commissions',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => _showProfileDialog(context, ref),
                  icon: Icon(Icons.add, size: 18.sp),
                  label: Text('Add Profile'),
                ),
              ],
            ),
            SizedBox(height: 16.h),
            if (profiles.isEmpty)
              Padding(
                padding: EdgeInsets.symmetric(vertical: 32.h),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.percent_rounded, size: 48.sp, color: Colors.grey.shade400),
                      SizedBox(height: 8.h),
                      Text(
                        'No commission profiles yet',
                        style: GoogleFonts.inter(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...profiles.map(
                (p) => Card(
                  elevation: 0,
                  margin: EdgeInsets.only(bottom: 12.h),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16.r),
                    side: BorderSide(color: Colors.grey.shade200),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(16.w),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(10.w),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Icon(
                                p['type'] == 'percentage'
                                    ? Icons.percent
                                    : (p['type'] == 'flat'
                                        ? Icons.currency_rupee
                                        : Icons.stacked_bar_chart),
                                color: AppColors.primary,
                                size: 20.sp,
                              ),
                            ),
                            SizedBox(width: 12.w),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    p['name'] ?? 'Unnamed Profile',
                                    style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15.sp,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    p['type'] == 'percentage'
                                        ? '${p['value'] ?? 0}% of service price'
                                        : '₹${p['value'] ?? 0} flat per service',
                                    style: GoogleFonts.inter(
                                      fontSize: 12.sp,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: Icon(Icons.edit_outlined, color: AppColors.primary, size: 20.sp),
                              onPressed: () => _showProfileDialog(context, ref, p),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete_outline_rounded, color: Colors.red.shade400, size: 20.sp),
                              onPressed: () => _confirmDelete(context, ref, p),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, Map<String, dynamic> profile) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Profile', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete "${profile['name']}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              ref.read(commissionProfilesProvider.notifier).deleteProfile(profile['id']);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Commission profile deleted')),
              );
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

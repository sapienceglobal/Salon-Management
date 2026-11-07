import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../../core/theme/app_colors.dart';
import '../providers/settings_provider.dart';

class NotificationsTab extends ConsumerWidget {
  const NotificationsTab({super.key});

  void _showTemplateDialog(
    BuildContext context,
    WidgetRef ref, [
    Map<String, dynamic>? template,
  ]) {
    final eventTypeController = TextEditingController(
      text: template?['event_type'],
    );
    final subjectController = TextEditingController(text: template?['subject']);
    final bodyController = TextEditingController(text: template?['body']);
    String selectedChannel = template?['channel'] ?? 'sms';
    bool isActive =
        template?['is_active'] == 1 || template?['is_active'] == true;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text(
                template == null ? 'New Template' : 'Edit Template',
                style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: eventTypeController,
                      decoration: const InputDecoration(
                        labelText: 'Event Type (e.g. appointment_booked)',
                      ),
                    ),
                    SizedBox(height: 16.h),
                    DropdownButtonFormField<String>(
                      initialValue: selectedChannel,
                      items: const [
                        DropdownMenuItem(value: 'sms', child: Text('SMS')),
                        DropdownMenuItem(value: 'email', child: Text('Email')),
                        DropdownMenuItem(
                          value: 'whatsapp',
                          child: Text('WhatsApp'),
                        ),
                      ],
                      onChanged: (v) => setState(() => selectedChannel = v!),
                      decoration: const InputDecoration(labelText: 'Channel'),
                    ),
                    SizedBox(height: 16.h),
                    if (selectedChannel == 'email')
                      TextField(
                        controller: subjectController,
                        decoration: const InputDecoration(labelText: 'Subject'),
                      ),
                    if (selectedChannel == 'email') SizedBox(height: 16.h),
                    TextField(
                      controller: bodyController,
                      decoration: const InputDecoration(
                        labelText: 'Body Template',
                      ),
                      maxLines: 3,
                    ),
                    SizedBox(height: 16.h),
                    SwitchListTile(
                      title: Text('Active'),
                      value: isActive,
                      onChanged: (v) => setState(() => isActive = v),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    final data = {
                      'event_type': eventTypeController.text,
                      'channel': selectedChannel,
                      'subject': subjectController.text,
                      'body': bodyController.text,
                      'is_active': isActive,
                    };
                    ref
                        .read(notificationsProvider.notifier)
                        .upsertTemplate(data);
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
    final notificationsAsync = ref.watch(notificationsProvider);

    return notificationsAsync.when(
      loading: () => Center(child: CircularProgressIndicator()),
      error: (e, st) => Center(child: Text('Error: $e')),
      data: (templates) {
        return ListView(
          padding: EdgeInsets.all(16.w),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Notifications',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => _showTemplateDialog(context, ref),
                  icon: Icon(Icons.add, size: 18.sp),
                  label: Text('Add Template'),
                ),
              ],
            ),
            SizedBox(height: 16.h),
            if (templates.isEmpty)
              Padding(
                padding: EdgeInsets.symmetric(vertical: 32.h),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.notifications_none_rounded, size: 48.sp, color: Colors.grey.shade400),
                      SizedBox(height: 8.h),
                      Text(
                        'No notification templates configured yet',
                        style: GoogleFonts.inter(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...templates.map(
                (t) => Card(
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
                                color: (t['channel'] == 'whatsapp'
                                        ? const Color(0xFF25D366)
                                        : (t['channel'] == 'email'
                                            ? Colors.blue
                                            : AppColors.primary))
                                    .withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Icon(
                                t['channel'] == 'email'
                                    ? Icons.email_rounded
                                    : (t['channel'] == 'whatsapp'
                                        ? Icons.chat_rounded
                                        : Icons.sms_rounded),
                                color: t['channel'] == 'whatsapp'
                                    ? const Color(0xFF25D366)
                                    : (t['channel'] == 'email'
                                        ? Colors.blue
                                        : AppColors.primary),
                                size: 20.sp,
                              ),
                            ),
                            SizedBox(width: 12.w),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    t['event_type'] ?? 'Event',
                                    style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14.sp,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    (t['channel'] ?? 'SMS').toString().toUpperCase(),
                                    style: GoogleFonts.inter(
                                      fontSize: 11.sp,
                                      fontWeight: FontWeight.w500,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: Icon(Icons.edit_outlined, color: AppColors.primary, size: 20.sp),
                              onPressed: () => _showTemplateDialog(context, ref, t),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete_outline_rounded, color: Colors.red.shade400, size: 20.sp),
                              onPressed: () => _confirmDelete(context, ref, t),
                            ),
                          ],
                        ),
                        if (t['subject'] != null && t['subject'].toString().isNotEmpty) ...[
                          SizedBox(height: 8.h),
                          Text(
                            'Subject: ${t['subject']}',
                            style: GoogleFonts.inter(fontSize: 12.sp, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
                          ),
                        ],
                        SizedBox(height: 6.h),
                        Container(
                          width: double.infinity,
                          padding: EdgeInsets.all(10.w),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(10.r),
                          ),
                          child: Text(
                            t['body'] ?? '',
                            style: GoogleFonts.inter(
                              fontSize: 12.sp,
                              color: AppColors.textSecondary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
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

  void _confirmDelete(BuildContext context, WidgetRef ref, Map<String, dynamic> template) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Template', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete template for "${template['event_type']}"?'),
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
              if (template['id'] != null) {
                ref.read(notificationsProvider.notifier).deleteTemplate(template['id']);
              }
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Template deleted')),
              );
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

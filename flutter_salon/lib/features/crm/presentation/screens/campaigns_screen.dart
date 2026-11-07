import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../../data/crm_provider.dart';

class CampaignsScreen extends ConsumerStatefulWidget {
  const CampaignsScreen({super.key});

  @override
  ConsumerState<CampaignsScreen> createState() => _CampaignsScreenState();
}

class _CampaignsScreenState extends ConsumerState<CampaignsScreen> {
  @override
  Widget build(BuildContext context) {
    final campaignsAsync = ref.watch(campaignsListProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Campaigns',
          style: GoogleFonts.playfairDisplay(
            fontSize: 28.sp,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddCampaignDialog,
        backgroundColor: AppColors.primary,
        elevation: 4,
        icon: Icon(Icons.add_rounded, color: Colors.white),
        label: Text(
          'New Campaign',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
      body: campaignsAsync.when(
        loading: () => const SkeletonList(),
        error: (err, stack) => Center(
          child: Text(
            'Error: $err',
            style: GoogleFonts.inter(color: AppColors.error),
          ),
        ),
        data: (campaigns) {
          if (campaigns.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: EdgeInsets.all(24.w),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 20,
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.campaign_rounded,
                      size: 64.sp,
                      color: AppColors.textSecondary.withOpacity(0.3),
                    ),
                  ),
                  SizedBox(height: 16.h),
                  Text(
                    'No campaigns found.',
                    style: GoogleFonts.inter(
                      color: AppColors.textSecondary,
                      fontSize: 16.sp,
                    ),
                  ),
                  SizedBox(height: 80.h),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: EdgeInsets.all(20.w).copyWith(bottom: 100),
            itemCount: campaigns.length,
            itemBuilder: (context, index) {
              final camp = campaigns[index];
              final isSent = camp['status'] == 'sent';
              final isDraft = camp['status'] == 'draft';
              final isEmail = camp['type'] == 'email';

              return Container(
                margin: EdgeInsets.only(bottom: 16.h),
                padding: EdgeInsets.all(20.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20.r),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 15,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: EdgeInsets.all(12.w),
                      decoration: BoxDecoration(
                        color: isEmail
                            ? const Color(0xFF4A90E2).withOpacity(0.15)
                            : const Color(0xFFF39C12).withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isEmail ? Icons.email_rounded : Icons.sms_rounded,
                        color: isEmail
                            ? const Color(0xFF4A90E2)
                            : const Color(0xFFF39C12),
                        size: 24.sp,
                      ),
                    ),
                    SizedBox(width: 16.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  camp['name'] ?? 'Untitled',
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16.sp,
                                    color: AppColors.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: 10.w,
                                  vertical: 4.h,
                                ),
                                decoration: BoxDecoration(
                                  color: isSent
                                      ? const Color(0xFF2ECC71).withOpacity(0.1)
                                      : (isDraft
                                            ? AppColors.textSecondary
                                                  .withOpacity(0.1)
                                            : AppColors.primary.withOpacity(
                                                0.1,
                                              )),
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                                child: Text(
                                  (camp['status']?.toString() ?? 'unknown')
                                      .toUpperCase(),
                                  style: GoogleFonts.inter(
                                    color: isSent
                                        ? const Color(0xFF2ECC71)
                                        : (isDraft
                                              ? AppColors.textSecondary
                                              : AppColors.primary),
                                    fontSize: 10.sp,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 12.h),
                          if (isSent)
                            Row(
                              children: [
                                Icon(
                                  Icons.done_all_rounded,
                                  size: 14.sp,
                                  color: Color(0xFF2ECC71),
                                ),
                                SizedBox(width: 4.w),
                                Text(
                                  'Sent: ${camp['sent_count']}',
                                  style: GoogleFonts.inter(
                                    fontSize: 13.sp,
                                    color: const Color(0xFF2ECC71),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                SizedBox(width: 16.w),
                                Icon(
                                  Icons.error_outline_rounded,
                                  size: 14.sp,
                                  color: Color(0xFFE74C3C),
                                ),
                                SizedBox(width: 4.w),
                                Text(
                                  'Failed: ${camp['failed_count']}',
                                  style: GoogleFonts.inter(
                                    fontSize: 13.sp,
                                    color: const Color(0xFFE74C3C),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            )
                          else if (isDraft)
                            Text(
                              'Draft saved. Ready to send.',
                              style: GoogleFonts.inter(
                                fontSize: 13.sp,
                                color: AppColors.textSecondary,
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (isDraft)
                      Padding(
                        padding: EdgeInsets.only(left: 12.w),
                        child: InkWell(
                          onTap: () => _sendCampaign(camp['id']),
                          borderRadius: BorderRadius.circular(12.r),
                          child: Container(
                            padding: EdgeInsets.all(10.w),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                            child: Icon(
                              Icons.send_rounded,
                              color: AppColors.primary,
                              size: 20.sp,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _showAddCampaignDialog() {
    final nameCtrl = TextEditingController();
    final contentCtrl = TextEditingController();
    String type = 'sms';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateModal) {
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(32.r)),
            ),
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
              left: 24,
              right: 24,
              top: 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                SizedBox(height: 24.h),
                Text(
                  'New Campaign',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 24.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 24.h),
                _buildPremiumTextField(
                  controller: nameCtrl,
                  label: 'Campaign Name',
                  icon: Icons.campaign_rounded,
                ),
                SizedBox(height: 16.h),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  icon: Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: AppColors.textSecondary,
                  ),
                  decoration: InputDecoration(
                    labelText: 'Type',
                    labelStyle: GoogleFonts.inter(
                      color: AppColors.textSecondary,
                    ),
                    prefixIcon: Icon(
                      Icons.category_rounded,
                      color: AppColors.primary,
                    ),
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16.r),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 20.w,
                      vertical: 18.h,
                    ),
                  ),
                  items: [
                    DropdownMenuItem(
                      value: 'sms',
                      child: Text('SMS', style: GoogleFonts.inter()),
                    ),
                    DropdownMenuItem(
                      value: 'email',
                      child: Text('Email', style: GoogleFonts.inter()),
                    ),
                  ],
                  onChanged: (val) {
                    if (val != null) setStateModal(() => type = val);
                  },
                ),
                SizedBox(height: 16.h),
                _buildPremiumTextField(
                  controller: contentCtrl,
                  label: 'Content',
                  icon: Icons.notes_rounded,
                  maxLines: 4,
                ),
                SizedBox(height: 32.h),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: EdgeInsets.symmetric(vertical: 18.h),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16.r),
                      ),
                      elevation: 4,
                      shadowColor: AppColors.primary.withOpacity(0.4),
                    ),
                    onPressed: () async {
                      if (nameCtrl.text.isEmpty || contentCtrl.text.isEmpty)
                        return;
                      try {
                        await ref.read(crmRepositoryProvider).createCampaign({
                          'name': nameCtrl.text,
                          'type': type,
                          'content': contentCtrl.text,
                          'subject': type == 'email' ? nameCtrl.text : null,
                        });
                        ref.invalidate(campaignsListProvider);
                        if (mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Campaign saved as draft'),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Error: $e'),
                              backgroundColor: AppColors.error,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    },
                    child: Text(
                      'Create Draft',
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
          );
        },
      ),
    );
  }

  Widget _buildPremiumTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
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

  Future<void> _sendCampaign(int id) async {
    try {
      await ref.read(crmRepositoryProvider).sendCampaign(id);
      ref.invalidate(campaignsListProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Campaign sent!'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}

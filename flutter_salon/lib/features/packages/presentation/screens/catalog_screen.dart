import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../providers/catalog_provider.dart';
import '../../data/catalog_repository.dart';
import '../widgets/package_form_sheet.dart';
import '../widgets/membership_form_sheet.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key});

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showPackageForm([Map<String, dynamic>? initialData]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FractionallySizedBox(
        heightFactor: 0.9,
        child: PackageFormSheet(initialData: initialData),
      ),
    );
  }

  void _showMembershipForm([Map<String, dynamic>? initialData]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FractionallySizedBox(
        heightFactor: 0.9,
        child: MembershipFormSheet(initialData: initialData),
      ),
    );
  }

  Future<void> _deleteItem(bool isPackage, int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20.r),
        ),
        title: Text(
          'Delete',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to delete this item?',
          style: GoogleFonts.inter(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10.r),
              ),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Delete',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      if (isPackage) {
        await ref.read(catalogRepositoryProvider).deletePackage(id);
        ref.invalidate(packagesListProvider);
      } else {
        await ref.read(catalogRepositoryProvider).deleteMembership(id);
        ref.invalidate(membershipsListProvider);
      }
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Deleted successfully'),
            behavior: SnackBarBehavior.floating,
          ),
        );
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Catalog',
          style: GoogleFonts.playfairDisplay(
            fontSize: 28.sp,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: false,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelStyle: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            fontSize: 16.sp,
          ),
          unselectedLabelStyle: GoogleFonts.inter(
            fontWeight: FontWeight.w500,
            fontSize: 16.sp,
          ),
          dividerColor: AppColors.border.withOpacity(0.5),
          tabs: const [
            Tab(text: 'Packages'),
            Tab(text: 'Memberships'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [_buildPackagesTab(), _buildMembershipsTab()],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          if (_tabController.index == 0) {
            _showPackageForm();
          } else {
            _showMembershipForm();
          }
        },
        backgroundColor: AppColors.primary,
        elevation: 4,
        icon: Icon(Icons.add_rounded, color: Colors.white),
        label: Text(
          _tabController.index == 0 ? 'New Package' : 'New VIP Tier',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildPackagesTab() {
    final packagesAsync = ref.watch(packagesListProvider);

    return packagesAsync.when(
      loading: () => const SkeletonList(),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
      ),
      data: (packages) {
        if (packages.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.redeem_rounded,
                  size: 64.sp,
                  color: AppColors.primaryLight,
                ),
                SizedBox(height: 16.h),
                Text(
                  'No packages available.',
                  style: GoogleFonts.inter(
                    color: AppColors.textSecondary,
                    fontSize: 16.sp,
                  ),
                ),
              ],
            ),
          );
        }
        return ListView.builder(
          padding: EdgeInsets.only(
            left: 20.w,
            right: 20.w,
            top: 20.h,
            bottom: 100.h,
          ),
          itemCount: packages.length,
          itemBuilder: (context, index) {
            final pkg = packages[index];
            return Container(
              margin: EdgeInsets.only(bottom: 24.h),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24.r),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (pkg['image_url'] != null)
                    ClipRRect(
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(24.r),
                      ),
                      child: Image.network(
                        pkg['image_url'],
                        height: 180.h,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (c, e, s) => Container(
                          height: 140.h,
                          color: AppColors.primaryLight.withOpacity(0.3),
                          child: Icon(
                            Icons.image_not_supported_rounded,
                            color: AppColors.primary,
                            size: 40.sp,
                          ),
                        ),
                      ),
                    )
                  else
                    Container(
                      height: 100.h,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(24.r),
                        ),
                      ),
                      child: Center(
                        child: Icon(
                          Icons.redeem_rounded,
                          color: AppColors.primary.withOpacity(0.5),
                          size: 48.sp,
                        ),
                      ),
                    ),
                  Padding(
                    padding: EdgeInsets.all(20.w),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                pkg['name'],
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20.sp,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 12.w,
                                vertical: 6.h,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primaryLight.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Text(
                                '₹${pkg['total_price']}',
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                  fontSize: 16.sp,
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 12.h),
                        if (pkg['description'] != null)
                          Text(
                            pkg['description'],
                            style: GoogleFonts.inter(
                              color: AppColors.textSecondary,
                              height: 1.4.h,
                            ),
                          ),
                        SizedBox(height: 16.h),
                        Container(
                          padding: EdgeInsets.all(12.w),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.calendar_today_outlined,
                                    size: 16.sp,
                                    color: AppColors.textSecondary,
                                  ),
                                  SizedBox(width: 6.w),
                                  Text(
                                    'Valid: ${pkg['validity_days'] ?? 'Unlimited'} d',
                                    style: GoogleFonts.inter(
                                      fontSize: 13.sp,
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              Row(
                                children: [
                                  Icon(
                                    Icons.repeat_rounded,
                                    size: 16.sp,
                                    color: AppColors.textSecondary,
                                  ),
                                  SizedBox(width: 6.w),
                                  Text(
                                    'Uses: ${pkg['max_uses'] ?? 'Unlimited'}',
                                    style: GoogleFonts.inter(
                                      fontSize: 13.sp,
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 20.h),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _showPackageForm(pkg),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  padding: EdgeInsets.symmetric(vertical: 12.h),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12.r),
                                  ),
                                  elevation: 0,
                                ),
                                icon: Icon(Icons.edit_rounded, size: 18.sp),
                                label: Text(
                                  'Edit',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(width: 12.w),
                            OutlinedButton.icon(
                              onPressed: () => _deleteItem(true, pkg['id']),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.error,
                                side: const BorderSide(color: AppColors.error),
                                padding: EdgeInsets.symmetric(
                                  vertical: 12.h,
                                  horizontal: 16.w,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                              ),
                              icon: Icon(
                                Icons.delete_outline_rounded,
                                size: 18.sp,
                              ),
                              label: Text(
                                'Delete',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildMembershipsTab() {
    final membershipsAsync = ref.watch(membershipsListProvider);

    return membershipsAsync.when(
      loading: () => const SkeletonList(),
      error: (err, stack) => Center(
        child: Text(
          'Error: $err',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
      ),
      data: (memberships) {
        if (memberships.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.workspace_premium_rounded,
                  size: 64.sp,
                  color: AppColors.primaryLight,
                ),
                SizedBox(height: 16.h),
                Text(
                  'No memberships available.',
                  style: GoogleFonts.inter(
                    color: AppColors.textSecondary,
                    fontSize: 16.sp,
                  ),
                ),
              ],
            ),
          );
        }
        return ListView.builder(
          padding: EdgeInsets.only(
            left: 20.w,
            right: 20.w,
            top: 20.h,
            bottom: 100.h,
          ),
          itemCount: memberships.length,
          itemBuilder: (context, index) {
            final mem = memberships[index];
            return Container(
              margin: EdgeInsets.only(bottom: 24.h),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24.r),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFE4C062).withOpacity(0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
                border: Border.all(
                  color: const Color(0xFFE4C062).withOpacity(0.3),
                  width: 1.5.w,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (mem['image_url'] != null)
                    ClipRRect(
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(24.r),
                      ),
                      child: Image.network(
                        mem['image_url'],
                        height: 160.h,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (c, e, s) => Container(
                          height: 140.h,
                          color: const Color(0xFFFFF9E6),
                          child: Icon(
                            Icons.image_not_supported_rounded,
                            color: Color(0xFFE4C062),
                            size: 40.sp,
                          ),
                        ),
                      ),
                    )
                  else
                    Container(
                      height: 100.h,
                      decoration: BoxDecoration(
                        color: Color(0xFFFFF9E6),
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(24.r),
                        ),
                      ),
                      child: Center(
                        child: Icon(
                          Icons.workspace_premium_rounded,
                          color: const Color(0xFFE4C062).withOpacity(0.5),
                          size: 48.sp,
                        ),
                      ),
                    ),
                  Padding(
                    padding: EdgeInsets.all(20.w),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.workspace_premium_rounded,
                                    color: Color(0xFFE4C062),
                                    size: 24.sp,
                                  ),
                                  SizedBox(width: 8.w),
                                  Expanded(
                                    child: Text(
                                      mem['name'],
                                      style: GoogleFonts.poppins(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 20.sp,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 12.w,
                                vertical: 6.h,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF9E6),
                                borderRadius: BorderRadius.circular(12.r),
                                border: Border.all(
                                  color: const Color(
                                    0xFFE4C062,
                                  ).withOpacity(0.5),
                                ),
                              ),
                              child: Text(
                                '₹${mem['price']}',
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFFE4C062),
                                  fontSize: 16.sp,
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 12.h),
                        if (mem['description'] != null)
                          Text(
                            mem['description'],
                            style: GoogleFonts.inter(
                              color: AppColors.textSecondary,
                              height: 1.4.h,
                            ),
                          ),
                        SizedBox(height: 16.h),

                        Container(
                          padding: EdgeInsets.all(16.w),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF9E6),
                            borderRadius: BorderRadius.circular(16.r),
                            border: Border.all(
                              color: const Color(0xFFE4C062).withOpacity(0.2),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              Column(
                                children: [
                                  Text(
                                    'DURATION',
                                    style: GoogleFonts.inter(
                                      fontSize: 10.sp,
                                      color: const Color(0xFFD4AF37),
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                  SizedBox(height: 4.h),
                                  Text(
                                    '${mem['duration_months']} mo',
                                    style: GoogleFonts.poppins(
                                      fontSize: 16.sp,
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              if (mem['discount_percentage'] != null)
                                Column(
                                  children: [
                                    Text(
                                      'DISCOUNT',
                                      style: GoogleFonts.inter(
                                        fontSize: 10.sp,
                                        color: const Color(0xFFD4AF37),
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                    SizedBox(height: 4.h),
                                    Text(
                                      '${mem['discount_percentage']}%',
                                      style: GoogleFonts.poppins(
                                        fontSize: 16.sp,
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                        ),

                        SizedBox(height: 20.h),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _showMembershipForm(mem),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFE4C062),
                                  foregroundColor: Colors.white,
                                  padding: EdgeInsets.symmetric(vertical: 12.h),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12.r),
                                  ),
                                  elevation: 0,
                                ),
                                icon: Icon(Icons.edit_rounded, size: 18.sp),
                                label: Text(
                                  'Edit',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(width: 12.w),
                            OutlinedButton.icon(
                              onPressed: () => _deleteItem(false, mem['id']),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.error,
                                side: const BorderSide(color: AppColors.error),
                                padding: EdgeInsets.symmetric(
                                  vertical: 12.h,
                                  horizontal: 16.w,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                              ),
                              icon: Icon(
                                Icons.delete_outline_rounded,
                                size: 18.sp,
                              ),
                              label: Text(
                                'Delete',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import 'package:flutter_salon/features/services/data/service_provider.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../../../../core/widgets/skeletons/skeleton_card.dart';
import '../widgets/category_form_dialog.dart';
import 'package:flutter_salon/core/network/dio_client.dart';

class ServicesListScreen extends ConsumerStatefulWidget {
  const ServicesListScreen({super.key});

  @override
  ConsumerState<ServicesListScreen> createState() => _ServicesListScreenState();
}

class _ServicesListScreenState extends ConsumerState<ServicesListScreen> {
  int? _activeCategoryId;

  void _showCategoryForm([Map<String, dynamic>? category]) {
    showDialog(
      context: context,
      builder: (context) => CategoryFormDialog(category: category),
    );
  }

  void _showCategoryOptions(Map<String, dynamic> category) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.all(24.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              category['name'] ?? 'Category Options',
              style: GoogleFonts.poppins(
                fontSize: 18.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 24.h),
            ListTile(
              leading: Icon(Icons.edit_outlined, color: AppColors.textPrimary),
              title: Text(
                'Edit Category',
                style: GoogleFonts.inter(fontWeight: FontWeight.w500),
              ),
              onTap: () {
                Navigator.pop(ctx);
                _showCategoryForm(category);
              },
            ),
            ListTile(
              leading: Icon(Icons.delete_outline, color: AppColors.error),
              title: Text(
                'Delete Category',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w500,
                  color: AppColors.error,
                ),
              ),
              onTap: () {
                Navigator.pop(ctx);
                _deleteCategory(category['id']);
              },
            ),
            SizedBox(height: 16.h),
          ],
        ),
      ),
    );
  }

  void _deleteCategory(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20.r),
        ),
        title: Text(
          'Delete Category',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to delete this category? All its services will also be deleted.',
          style: GoogleFonts.inter(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
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
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              'Delete',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(serviceRepositoryProvider).deleteCategory(id);
        ref.invalidate(categoriesListProvider);
        if (_activeCategoryId == id) {
          setState(() => _activeCategoryId = null);
        }
        if (mounted)
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Category deleted'),
              behavior: SnackBarBehavior.floating,
            ),
          );
      } catch (e) {
        if (mounted)
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

  void _deleteService(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20.r),
        ),
        title: Text(
          'Delete Service',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to delete this service?',
          style: GoogleFonts.inter(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
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
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              'Delete',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(serviceRepositoryProvider).deleteService(id);
        ref.invalidate(servicesListProvider);
        if (mounted)
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Service deleted'),
              behavior: SnackBarBehavior.floating,
            ),
          );
      } catch (e) {
        if (mounted)
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

  Future<void> _toggleServiceActive(int id) async {
    try {
      await ref.read(serviceRepositoryProvider).toggleServiceActive(id);
      ref.invalidate(servicesListProvider);
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Service status updated'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Color(0xFF10B981),
          ),
        );
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll("Exception: ", "")}'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final servicesAsync = ref.watch(servicesListProvider);
    final categoriesAsync = ref.watch(categoriesListProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: CustomScrollView(
        slivers: [
          // Banner Section
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16.0.w),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24.r),
                child: Container(
                  height: 220.h,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        const Color(0xFFFFFFFF), // Pure white
                        const Color(0xFFFDF2F8), // Very soft pink
                        const Color(0xFFFCE7F3), // Brand light pink
                        const Color(0xFFF9A8D4).withOpacity(0.3), // A hint of deeper pink
                      ],
                      stops: const [0.0, 0.4, 0.7, 1.0],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFCE7F3).withOpacity(0.5),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Text Content
                      Positioned(
                        left: 20.w,
                        top: 24.h,
                        bottom: 24.h,
                        right: 20.w,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'SALON SERVICES',
                              style: GoogleFonts.inter(
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 2,
                                color: const Color(0xFFE91E63),
                              ),
                            ),
                            SizedBox(height: 6.h),
                            RichText(
                              text: TextSpan(
                                style: GoogleFonts.poppins(
                                  fontSize: 28.sp,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF0F172A),
                                  height: 1.1,
                                ),
                                children: const [
                                  TextSpan(text: 'Hair & Beauty '),
                                  TextSpan(
                                    text: 'Care',
                                    style: TextStyle(color: Color(0xFFE91E63)),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(height: 8.h),
                            Text(
                              'Healthy Hair. Happier You.',
                              style: GoogleFonts.inter(
                                fontSize: 13.sp,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF334155),
                              ),
                            ),
                            SizedBox(height: 6.h),
                            Text(
                              'From stylish cuts to nourishing treatments, get the perfect look for every occasion.',
                              style: GoogleFonts.inter(
                                fontSize: 12.sp,
                                color: const Color(0xFF64748B),
                                height: 1.4,
                              ),
                            ),
                            const Spacer(),
                            Container(
                              width: 40.w,
                              height: 3.h,
                              decoration: BoxDecoration(
                                color: const Color(0xFFE91E63),
                                borderRadius: BorderRadius.circular(2.r),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Categories Horizontal List
          SliverToBoxAdapter(
            child: categoriesAsync.when(
              loading: () => Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.w),
                child: SkeletonCard(
                  horizontal: true,
                  height: 90.h,
                  width: 80.w,
                  count: 4,
                ),
              ),
              error: (err, stack) => Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Unable to load categories',
                        style: GoogleFonts.inter(
                          color: AppColors.error,
                          fontSize: 12.sp,
                        ),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () {
                        ref.invalidate(categoriesListProvider);
                        ref.invalidate(servicesListProvider);
                      },
                      icon: Icon(Icons.refresh, size: 16.sp, color: const Color(0xFFE91E63)),
                      label: Text(
                        'Retry',
                        style: GoogleFonts.inter(
                          color: const Color(0xFFE91E63),
                          fontWeight: FontWeight.w600,
                          fontSize: 12.sp,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              data: (categories) {
                // Determine icons based on index/name for aesthetic
                final icons = [
                  Icons.content_cut_rounded,
                  Icons.water_drop_outlined,
                  Icons.air_rounded,
                  Icons.spa_outlined,
                  Icons.palette_outlined,
                ];

                return SizedBox(
                  height: 100.h,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: EdgeInsets.symmetric(horizontal: 16.w),
                    itemCount:
                        categories.length + 1, // +1 for "All" or just map them
                    itemBuilder: (context, index) {
                      // Adjusting to not have "All" as a block but making the first category selected by default if null
                      if (_activeCategoryId == null && categories.isNotEmpty) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          setState(
                            () => _activeCategoryId = categories[0]['id'],
                          );
                        });
                      }

                      if (index == categories.length) {
                        return GestureDetector(
                          onTap: () => _showCategoryForm(),
                          child: Container(
                            width: 85.w,
                            margin: EdgeInsets.only(right: 12.w, bottom: 4.h),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16.r),
                              border: Border.all(
                                color: const Color(0xFFEEEEEE),
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: EdgeInsets.all(12.w),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFFFF0F5),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.add_rounded,
                                    color: Color(0xFFE91E63),
                                    size: 24.sp,
                                  ),
                                ),
                                SizedBox(height: 8.h),
                                Text(
                                  'Add New',
                                  style: GoogleFonts.inter(
                                    fontSize: 11.sp,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF1A1A2E),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      final cat = categories[index];
                      final isSelected = _activeCategoryId == cat['id'];
                      final iconData = icons[index % icons.length];

                      return GestureDetector(
                        onTap: () =>
                            setState(() => _activeCategoryId = cat['id']),
                        onLongPress: () =>
                            _showCategoryOptions(cat), // Options on long press
                        child: Container(
                          width: 85.w,
                          margin: EdgeInsets.only(right: 12.w, bottom: 4.h),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFFE91E63)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(16.r),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFFE91E63)
                                  : const Color(0xFFEEEEEE),
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: const Color(
                                        0xFFE91E63,
                                      ).withOpacity(0.3),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ]
                                : [],
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: EdgeInsets.all(12.w),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? Colors.transparent
                                      : const Color(0xFFFFF0F5),
                                  shape: BoxShape.circle,
                                  border: isSelected
                                      ? Border.all(
                                          color: Colors.white.withOpacity(0.3),
                                        )
                                      : null,
                                ),
                                child: Icon(
                                  iconData,
                                  color: isSelected
                                      ? Colors.white
                                      : const Color(0xFFE91E63),
                                  size: 24.sp,
                                ),
                              ),
                              SizedBox(height: 8.h),
                              Text(
                                cat['name'] ?? '',
                                textAlign: TextAlign.center,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: 11.sp,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? Colors.white
                                      : const Color(0xFF1A1A2E),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),

          // Subheader
          SliverToBoxAdapter(
            child: Builder(
              builder: (context) {
                final categories = categoriesAsync.valueOrNull;
                final activeCat = categories?.firstWhere(
                  (c) => c['id'] == _activeCategoryId,
                  orElse: () => {'name': 'Services'},
                ) ?? {'name': 'Services'};

                return Padding(
                  padding: EdgeInsets.fromLTRB(20, 24, 20, 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              activeCat['name'] ?? 'Services',
                              style: GoogleFonts.poppins(
                                fontSize: 20.sp,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1A1A2E),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Container(
                              width: 30.w,
                              height: 3.h,
                              margin: EdgeInsets.only(top: 4.h),
                              decoration: BoxDecoration(
                                color: const Color(0xFFE91E63),
                                borderRadius: BorderRadius.circular(2.r),
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Text(
                        'Classic. Trendy. Always You.',
                        style: GoogleFonts.inter(
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // Services List
          servicesAsync.when(
            loading: () => const SliverToBoxAdapter(child: SkeletonList()),
            error: (err, stack) => SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 40.h),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.wifi_off_rounded, size: 48.sp, color: const Color(0xFF94A3B8)),
                      SizedBox(height: 12.h),
                      Text(
                        'Failed to load services',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 16.sp,
                          color: const Color(0xFF1A1A2E),
                        ),
                      ),
                      SizedBox(height: 6.h),
                      Text(
                        err.toString().replaceAll('Exception: ', ''),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          color: const Color(0xFF64748B),
                          fontSize: 12.sp,
                        ),
                      ),
                      SizedBox(height: 16.h),
                      ElevatedButton.icon(
                        onPressed: () {
                          ref.invalidate(categoriesListProvider);
                          ref.invalidate(servicesListProvider);
                        },
                        icon: const Icon(Icons.refresh, size: 18),
                        label: const Text('Try Again'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE91E63),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 10.h),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            data: (services) {
              final filteredServices = _activeCategoryId == null
                  ? services
                  : services
                        .where((s) => s['category_id'] == _activeCategoryId)
                        .toList();

              if (filteredServices.isEmpty) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(40.0.w),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.content_cut_rounded,
                            size: 64.sp,
                            color: Color(0xFFE2E8F0),
                          ),
                          SizedBox(height: 16.h),
                          Text(
                            'No services found.',
                            style: GoogleFonts.inter(
                              color: const Color(0xFF64748B),
                              fontSize: 16.sp,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              return SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final service = filteredServices[index];
                  return _buildServiceCard(context, service);
                }, childCount: filteredServices.length),
              );
            },
          ),

          // Bottom padding
          SliverToBoxAdapter(child: SizedBox(height: 100.h)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/services/add'),
        backgroundColor: const Color(0xFF1A1A2E),
        elevation: 4,
        child: Icon(Icons.add_rounded, color: Colors.white),
      ),
    );
  }

  Widget _buildServiceCard(BuildContext context, Map<String, dynamic> service) {
    // Generate a fallback description based on name
    final name = service['name']?.toString().toLowerCase() ?? '';
    String desc = 'Get a stylish look tailored to your personality.';
    if (name.contains('women'))
      desc = 'Get a stylish haircut tailored to your look and personality.';
    if (name.contains('men')) desc = 'Trendy & classic cuts for a sharp look.';
    if (name.contains('kids')) desc = 'Special care for your little ones.';
    if (name.contains('fringe'))
      desc = 'Add a fresh new look with stylish bangs.';
    if (name.contains('beard')) desc = 'Keep your beard neat and stylish.';

    return Container(
      margin: EdgeInsets.only(left: 16.w, right: 16.w, bottom: 16.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20.r),
          onTap: () => context.push('/services/edit', extra: service),
          onLongPress: () => _deleteService(
            service['id'],
          ), // Keep delete functionality accessible
          child: Padding(
            padding: EdgeInsets.all(12.0.w),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Service Image
                ClipRRect(
                  borderRadius: BorderRadius.circular(16.r),
                  child:
                      service['image_url'] != null &&
                          service['image_url'].toString().isNotEmpty
                      ? Builder(
                          builder: (context) {
                            final fullUrl = resolveMediaUrl(service['image_url']);

                            return Image.network(
                              fullUrl, // Use first image if multiple, prefixed with base URL
                              width: 82.w,
                              height: 94.h,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  Image.asset(
                                    'assets/images/service_thumbnail.jpg',
                                    width: 82.w,
                                    height: 94.h,
                                    fit: BoxFit.cover,
                                  ),
                            );
                          },
                        )
                      : Image.asset(
                          'assets/images/service_thumbnail.jpg',
                          width: 82.w,
                          height: 94.h,
                          fit: BoxFit.cover,
                        ),
                ),
                SizedBox(width: 12.w),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        service['name'] ?? 'Unnamed Service',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          fontSize: 14.sp,
                          color: const Color(0xFF1A1A2E),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 4.h),
                      Text(
                        desc,
                        style: GoogleFonts.inter(
                          fontSize: 11.sp,
                          color: const Color(0xFF64748B),
                          height: 1.3.h,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 8.h),
                      // Hardcoded Tags with Wrap to prevent overflow
                      Wrap(
                        spacing: 6.w,
                        runSpacing: 4.h,
                        children: [
                          _buildTag('Wash Included'),
                          _buildTag(
                            name.contains('beard') ? 'Grooming' : 'Styling',
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                SizedBox(width: 8.w),

                // Right Column (Price & Actions)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.access_time_rounded,
                          size: 12.sp,
                          color: Color(0xFF64748B),
                        ),
                        SizedBox(width: 4.w),
                        Text(
                          '${service['duration_minutes']} mins',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF64748B),
                            fontSize: 11.sp,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 12.h),
                    Text(
                      '₹ ${service['price']}',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w800,
                        fontSize: 16.sp,
                        color: const Color(0xFF1A1A2E),
                      ),
                    ),
                    SizedBox(height: 12.h),
                    // Edit + Delete Buttons
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        GestureDetector(
                          onTap: () =>
                              context.push('/services/edit', extra: service),
                          child: Container(
                            padding: EdgeInsets.all(8.w),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                            child: Icon(
                              Icons.edit_outlined,
                              size: 16.sp,
                              color: Color(0xFF3B82F6),
                            ),
                          ),
                        ),
                        SizedBox(width: 8.w),
                        GestureDetector(
                          onTap: () => _toggleServiceActive(service['id']),
                          child: Container(
                            padding: EdgeInsets.all(8.w),
                            decoration: BoxDecoration(
                              color: service['is_active'] == true || service['is_active'] == 1
                                  ? const Color(0xFFF0FDF4)
                                  : const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                            child: Icon(
                              service['is_active'] == true || service['is_active'] == 1
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              size: 16.sp,
                              color: service['is_active'] == true || service['is_active'] == 1
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFF59E0B),
                            ),
                          ),
                        ),
                        SizedBox(width: 8.w),
                        GestureDetector(
                          onTap: () => _deleteService(service['id']),
                          child: Container(
                            padding: EdgeInsets.all(8.w),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              borderRadius: BorderRadius.circular(10.r),
                            ),
                            child: Icon(
                              Icons.delete_outline_rounded,
                              size: 16.sp,
                              color: Color(0xFFEF4444),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTag(String text) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 7.w, vertical: 3.h),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF0F5),
        borderRadius: BorderRadius.circular(6.r),
      ),
      child: Text(
        text,
        style: GoogleFonts.inter(
          color: const Color(0xFFE91E63),
          fontSize: 9.sp,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

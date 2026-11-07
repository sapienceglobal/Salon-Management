import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../../../../core/widgets/skeletons/skeleton_card.dart';
import 'package:flutter_salon/features/customers/data/customer_provider.dart';
import '../../../../core/widgets/stat_card.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_salon/core/network/dio_client.dart';

class CustomersListScreen extends ConsumerStatefulWidget {
  const CustomersListScreen({super.key});

  @override
  ConsumerState<CustomersListScreen> createState() =>
      _CustomersListScreenState();
}

class _CustomersListScreenState extends ConsumerState<CustomersListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final customersAsync = ref.watch(customersListProvider(_searchQuery));

    return Scaffold(
      backgroundColor: AppColors.background,

      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              children: [
                // --- Hero Section ---
                Padding(
                  padding: EdgeInsets.only(
                    left: 16.w,
                    right: 16.w,
                    top: 16.h,
                    bottom: 8.h,
                  ),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final isSmallScreen = constraints.maxWidth < 600;
                      return ClipRRect(
                        borderRadius: BorderRadius.circular(16.r),
                        child: Container(
                          height: isSmallScreen ? 160 : 180,
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
                                left: isSmallScreen ? 16 : 32,
                                top: 0,
                                bottom: 0,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Customers',
                                      style: GoogleFonts.poppins(
                                        fontSize: isSmallScreen ? 24 : 32,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF1A1A2E),
                                      ),
                                    ),
                                    Text(
                                      'Manage & Retain',
                                      style: GoogleFonts.poppins(
                                        fontSize: isSmallScreen ? 14 : 16,
                                        color: const Color(0xFFE91E63),
                                      ),
                                    ),
                                    SizedBox(height: 4.h),
                                    Text(
                                      'Track all your loyal clients\nand improve customer retention.',
                                      style: GoogleFonts.inter(
                                        fontSize: isSmallScreen ? 10 : 12,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Back button if needed
                              if (GoRouterState.of(
                                context,
                              ).uri.path.endsWith('_full'))
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: IconButton(
                                    icon: Icon(
                                      Icons.close_rounded,
                                      color: const Color(0xFF1A1A2E),
                                    ),
                                    onPressed: () {
                                      if (context.canPop()) {
                                        context.pop();
                                      } else {
                                        context.go('/dashboard');
                                      }
                                    },
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // --- Premium Stat Cards ---
                Padding(
                  padding: EdgeInsets.only(top: 8.0.h, bottom: 8.0.h),
                  child: ref
                      .watch(customerStatsProvider)
                      .when(
                        data: (stats) {
                          return StatCardRow(
                            cards: [
                              StatCardData(
                                title: 'New Customers',
                                value: '${stats['new_customers'] ?? 0}',
                                icon: Icons.person_add_rounded,
                                backgroundColor: AppColors.primary,
                              ),
                              StatCardData(
                                title: 'Returning',
                                value: '${stats['returning_customers'] ?? 0}',
                                icon: Icons.people_rounded,
                                backgroundColor: const Color(
                                  0xFFC76479,
                                ), // Lighter pink
                              ),
                              StatCardData(
                                title: 'Inactive',
                                value: '${stats['churn'] ?? 0}',
                                icon: Icons.person_off_rounded,
                                backgroundColor: const Color(
                                  0xFFE196A5,
                                ), // Soft rose
                              ),
                            ],
                          );
                        },
                        loading: () => SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          padding: EdgeInsets.symmetric(horizontal: 16.0.w),
                          child: SkeletonCard(
                            horizontal: true,
                            count: 3,
                            width: 140.w,
                            height: 100.h,
                          ),
                        ),
                        error: (_, _) => SizedBox.shrink(),
                      ),
                ),

                // --- Premium Floating Search Bar ---
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: 16.0.w,
                    vertical: 12.0.h,
                  ),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search customers...',
                      hintStyle: GoogleFonts.inter(
                        color: const Color(0xFF94A3B8),
                        fontSize: 13.sp,
                      ),
                      prefixIcon: Icon(
                        Icons.search_rounded,
                        color: const Color(0xFF94A3B8),
                        size: 20.sp,
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide: const BorderSide(
                          color: Color(0xFFE2E8F0),
                          width: 1.0,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide: const BorderSide(
                          color: Color(0xFFE2E8F0),
                          width: 1.0,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide: const BorderSide(
                          color: Color(0xFFE91E63),
                          width: 1.5,
                        ),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 0,
                      ),
                    ),
                    onChanged: (value) {
                      setState(() {
                        _searchQuery = value;
                      });
                    },
                  ),
                ),
              ],
            ),
          ),

          SliverToBoxAdapter(child: SizedBox(height: 8.h)),

          // --- Premium Customer List ---
          customersAsync.when(
            loading: () => const SliverToBoxAdapter(child: SkeletonList()),
            error: (err, stack) =>
                SliverToBoxAdapter(child: Center(child: Text('Error: $err'))),
            data: (customers) {
              if (customers.isEmpty) {
                return SliverToBoxAdapter(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64.sp,
                          color: AppColors.primaryLight,
                        ),
                        SizedBox(height: 16.h),
                        Text(
                          'No customers found',
                          style: GoogleFonts.inter(
                            fontSize: 16.sp,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }
              return SliverPadding(
                padding: EdgeInsets.only(bottom: 100.h), // padding for FAB
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final customer = customers[index];
                    return Container(
                      margin: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 6.h,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16.r),
                        border: Border.all(
                          color: AppColors.border.withOpacity(0.5),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ListTile(
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 16.w,
                          vertical: 8.h,
                        ),
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(12.r),
                          child: Builder(
                            builder: (context) {
                              final rawImageUrl = customer['profile_image_url'] ??
                                  customer['profile_picture'] ??
                                  customer['avatar_url'] ??
                                  customer['profile_image'] ??
                                  customer['image_url'];
                              final rawUrl = rawImageUrl != null &&
                                      rawImageUrl.toString().trim().isNotEmpty
                                  ? rawImageUrl.toString().split(',').first.trim()
                                  : null;
                              final fullUrl = (rawUrl != null && rawUrl.startsWith('/'))
                                  ? '$kBaseMediaUrl$rawUrl'
                                  : rawUrl;
                              
                              final firstName = customer['first_name']?.toString() ?? '';
                              final lastName = customer['last_name']?.toString() ?? '';
                              final initials = (firstName.isNotEmpty ? firstName[0].toUpperCase() : '') +
                                               (lastName.isNotEmpty ? lastName[0].toUpperCase() : '');

                              if (fullUrl != null && fullUrl.isNotEmpty) {
                                return Image.network(
                                  fullUrl,
                                  width: 48.w,
                                  height: 48.h,
                                  fit: BoxFit.cover,
                                  errorBuilder: (c, e, s) => _buildFallbackAvatar(initials),
                                );
                              } else {
                                return _buildFallbackAvatar(initials);
                              }
                            },
                          ),
                        ),
                        title: Text(
                          '${customer['first_name'] ?? ''} ${customer['last_name'] ?? ''}'
                              .trim(),
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600,
                            fontSize: 16.sp,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        subtitle: Padding(
                          padding: EdgeInsets.only(top: 4.0.h),
                          child: Row(
                            children: [
                              Icon(
                                Icons.phone_outlined,
                                size: 14.sp,
                                color: AppColors.textSecondary,
                              ),
                              SizedBox(width: 4.w),
                              Text(
                                customer['phone'] ??
                                    customer['email'] ??
                                    'No contact',
                                style: GoogleFonts.inter(
                                  color: AppColors.textSecondary,
                                  fontSize: 13.sp,
                                ),
                              ),
                            ],
                          ),
                        ),
                        trailing: PopupMenuButton<String>(
                          icon: Icon(
                            Icons.more_vert_rounded,
                            color: AppColors.textSecondary,
                          ),
                          onSelected: (value) {
                            if (value == 'edit') {
                              context.push('/customers/edit', extra: customer);
                            } else if (value == 'delete') {
                              _confirmDelete(context, customer);
                            }
                          },
                          itemBuilder: (context) => [
                            PopupMenuItem(
                              value: 'edit',
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.edit_outlined,
                                    size: 20.sp,
                                    color: AppColors.textPrimary,
                                  ),
                                  SizedBox(width: 12.w),
                                  Text(
                                    'Edit',
                                    style: GoogleFonts.inter(
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            PopupMenuItem(
                              value: 'delete',
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.delete_outline,
                                    size: 20.sp,
                                    color: AppColors.error,
                                  ),
                                  SizedBox(width: 12.w),
                                  Text(
                                    'Delete',
                                    style: GoogleFonts.inter(
                                      color: AppColors.error,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        onTap: () {
                          context.push('/customers/${customer['id']}');
                        },
                      ),
                    );
                  }, childCount: customers.length),
                ),
              );
            },
          ),
        ],
      ),
      floatingActionButton: MediaQuery.of(context).size.width > 380
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/customers/add'),
              backgroundColor: AppColors.primary,
              elevation: 4,
              icon: Icon(Icons.add_rounded, color: Colors.white),
              label: Text(
                'Add Customer',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            )
          : FloatingActionButton(
              onPressed: () => context.push('/customers/add'),
              backgroundColor: AppColors.primary,
              elevation: 4,
              child: Icon(Icons.add_rounded, color: Colors.white, size: 24.sp),
            ),
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    Map<String, dynamic> customer,
  ) async {
    final name =
        '${customer['first_name'] ?? ''} ${customer['last_name'] ?? ''}'.trim();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16.r),
        ),
        title: Text(
          'Delete Customer?',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to delete $name? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        final repository = ref.read(customerRepositoryProvider);
        await repository.deleteCustomer(customer['id']);
        ref.invalidate(customersListProvider);
        ref.invalidate(customerStatsProvider);

        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$name has been deleted'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: AppColors.error,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: $e'),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  Widget _buildFallbackAvatar(String initials) {
    return Image.asset(
      'assets/images/customer_profile_avatar.jpg',
      width: 48.w,
      height: 48.h,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => Container(
        width: 48.w,
        height: 48.h,
        decoration: BoxDecoration(
          color: const Color(0xFFFCE7F3),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Center(
          child: Text(
            initials.isNotEmpty ? initials : '?',
            style: GoogleFonts.poppins(
              color: const Color(0xFFE91E63),
              fontWeight: FontWeight.bold,
              fontSize: 16.sp,
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/features/crm/data/crm_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/widgets/main_layout_screen.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../widgets/enquiry_details_sheet.dart';
import '../../../../core/network/socket_client.dart';
import 'package:flutter_salon/core/widgets/premium_stat_card.dart';
import '../../../../core/widgets/skeletons/skeleton_card.dart';

class LeadsScreen extends ConsumerStatefulWidget {
  const LeadsScreen({super.key});

  @override
  ConsumerState<LeadsScreen> createState() => _LeadsScreenState();
}

class _LeadsScreenState extends ConsumerState<LeadsScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  late SocketService _socketService;

  // To match the UI tabs
  String _selectedTab = 'All';
  String _selectedSource = 'All Sources';
  String _searchQuery = '';
  DateTimeRange? _selectedDateRange;

  String get _dateRangeText {
    if (_selectedDateRange == null) return 'All Time';
    final start = _selectedDateRange!.start;
    final end = _selectedDateRange!.end;
    return '${start.day}/${start.month}/${start.year} - ${end.day}/${end.month}/${end.year}';
  }

  Future<void> _pickDateRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      initialDateRange: _selectedDateRange,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFE91E63),
              onPrimary: Colors.white,
              onSurface: Color(0xFF1A1A2E),
            ),
          ),
          child: child!,
        );
      },
    );
    if (range != null) {
      setState(() {
        _selectedDateRange = range;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(() {
      setState(() {
        _searchQuery = _searchCtrl.text;
      });
    });
    _socketService = ref.read(socketServiceProvider);
    _socketService.onNewLead((lead) {
      if (mounted) {
        ref.invalidate(leadsListProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('New Lead from Meta: ${lead['name']}'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    });
  }

  void _showAddLeadForm() {
    context.push('/leads/add');
  }

  void _showDetails(Map<String, dynamic> lead) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => EnquiryDetailsSheet(enquiry: lead),
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    Map<String, dynamic> lead,
  ) async {
    final name = lead['name'] ?? 'this lead';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
        insetPadding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: 420.w),
          child: Padding(
            padding: EdgeInsets.all(24.w),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64.w,
                  height: 64.w,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFFECACA), width: 1.5),
                  ),
                  child: const Icon(
                    Icons.delete_outline_rounded,
                    size: 32,
                    color: Color(0xFFDC2626),
                  ),
                ),
                SizedBox(height: 18.h),
                Text(
                  'Delete Lead?',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 8.h),
                Text(
                  'Are you sure you want to delete $name? This action cannot be undone.',
                  style: GoogleFonts.inter(
                    fontSize: 13.sp,
                    color: const Color(0xFF64748B),
                    height: 1.45,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 24.h),
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 48.h,
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFE2E8F0)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                          ),
                          child: Text(
                            'Cancel',
                            style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: SizedBox(
                        height: 48.h,
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFDC2626),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                          ),
                          child: Text(
                            'Delete Lead',
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13.sp),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        final repo = ref.read(crmRepositoryProvider);
        await repo.deleteLead(lead['id']);
        ref.invalidate(leadsListProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$name deleted successfully'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  Color _getStatusBgColor(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return const Color(0xFFECFDF5);
      case 'contacted':
        return const Color(0xFFFFFBEB);
      case 'follow up':
        return const Color(0xFFEFF6FF);
      case 'converted':
        return const Color(0xFFECFDF5);
      case 'lost':
        return const Color(0xFFFEF2F2);
      default:
        return const Color(0xFFF1F5F9);
    }
  }

  Color _getStatusTextColor(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return const Color(0xFF10B981);
      case 'contacted':
        return const Color(0xFFF59E0B);
      case 'follow up':
        return const Color(0xFF3B82F6);
      case 'converted':
        return const Color(0xFF10B981);
      case 'lost':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  IconData _getSourceIcon(String source) {
    final s = source.toLowerCase();
    if (s.contains('facebook') || s.contains('fb'))
      return Icons.facebook_rounded;
    if (s.contains('instagram') || s.contains('ig'))
      return Icons.camera_alt_outlined;
    if (s.contains('whatsapp') || s.contains('wa'))
      return Icons.chat_bubble_outline_rounded;
    if (s.contains('website') || s.contains('web'))
      return Icons.language_rounded;
    if (s.contains('walk-in') || s.contains('walkin'))
      return Icons.storefront_rounded;
    if (s.contains('manual')) return Icons.person_add_alt_1_outlined;
    return Icons.language_rounded;
  }

  Color _getSourceColor(String source) {
    final s = source.toLowerCase();
    if (s.contains('facebook') || s.contains('fb'))
      return const Color(0xFF1877F2);
    if (s.contains('instagram') || s.contains('ig'))
      return const Color(0xFFE1306C);
    if (s.contains('whatsapp') || s.contains('wa'))
      return const Color(0xFF25D366);
    if (s.contains('website') || s.contains('web'))
      return const Color(0xFF3B82F6);
    if (s.contains('walk-in') || s.contains('walkin'))
      return const Color(0xFF06B6D4);
    if (s.contains('manual')) return const Color(0xFF8B5CF6);
    return const Color(0xFF64748B);
  }

  @override
  Widget build(BuildContext context) {
    final leadsAsync = ref.watch(leadsListProvider);
    final filters = ref.watch(leadsFilterProvider);

    final List<Map<String, dynamic>> allLeads =
        leadsAsync.value?.cast<Map<String, dynamic>>() ?? [];
    final int totalLeads = allLeads.length;
    final int newLeadsCount = allLeads
        .where((l) => l['status']?.toString().toLowerCase() == 'new')
        .length;
    final int contactedLeadsCount = allLeads
        .where((l) => l['status']?.toString().toLowerCase() == 'contacted')
        .length;
    final int followUpLeadsCount = allLeads
        .where((l) => l['status']?.toString().toLowerCase() == 'follow up')
        .length;
    final int convertedLeadsCount = allLeads
        .where((l) => l['status']?.toString().toLowerCase() == 'converted')
        .length;
    final int lostLeadsCount = allLeads
        .where((l) => l['status']?.toString().toLowerCase() == 'lost')
        .length;

    final int facebookCount = allLeads.where((l) {
      final s = l['source']?.toString().toLowerCase() ?? '';
      return s.contains('facebook') || s.contains('fb');
    }).length;
    final int instagramCount = allLeads.where((l) {
      final s = l['source']?.toString().toLowerCase() ?? '';
      return s.contains('instagram') || s.contains('ig');
    }).length;
    final int websiteCount = allLeads.where((l) {
      final s = l['source']?.toString().toLowerCase() ?? '';
      return s.contains('website') || s.contains('online') || s.contains('web');
    }).length;
    final int whatsappCount = allLeads.where((l) {
      final s = l['source']?.toString().toLowerCase() ?? '';
      return s.contains('whatsapp') || s.contains('wa');
    }).length;
    final int walkinCount = allLeads.where((l) {
      final s = l['source']?.toString().toLowerCase() ?? '';
      return s.contains('walk-in') ||
          s.contains('walkin') ||
          s.contains('walk in');
    }).length;
    final int manualCount = allLeads.where((l) {
      final s = l['source']?.toString().toLowerCase() ?? '';
      return s.contains('manual') ||
          s.contains('referral') ||
          s.contains('other');
    }).length;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: CustomScrollView(
        slivers: [
          // Hero Section
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(20.w),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isSmallScreen = constraints.maxWidth < 600;

                  return ClipRRect(
                    borderRadius: BorderRadius.circular(16.r),
                    child: Container(
                      height: 210.h,
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

                          // Text Section
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
                                  'Leads',
                                  style: GoogleFonts.poppins(
                                    fontSize: 32.sp,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                    height: 1.1.h,
                                  ),
                                ),
                                SizedBox(height: 4.h),
                                Text(
                                  'Capture. Nurture. Convert.',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14.sp,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFFE91E63),
                                  ),
                                ),
                                SizedBox(height: 8.h),
                                SizedBox(
                                  width:
                                      MediaQuery.of(context).size.width * 0.55,
                                  child: Text(
                                    'Manage all your leads from multiple sources and turn them into loyal customers.',
                                    style: GoogleFonts.inter(
                                      fontSize: 12.sp,
                                      fontWeight: FontWeight.w500,
                                      color: const Color(0xFF334155),
                                      height: 1.4.h,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Add Lead Button
                          Positioned(
                            top: isSmallScreen ? 12 : 16,
                            right: isSmallScreen ? 12 : 16,
                            child: ElevatedButton.icon(
                              onPressed: _showAddLeadForm,
                              icon: Icon(Icons.add_rounded, size: 18.sp),
                              label: Text(
                                'Add Lead',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE91E63),
                                foregroundColor: Colors.white,
                                padding: EdgeInsets.symmetric(
                                  horizontal: 16.w,
                                  vertical: 8.h,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12.r),
                                ),
                                elevation: 0,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // Stat Cards
          SliverToBoxAdapter(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: EdgeInsets.symmetric(horizontal: 20.w),
              clipBehavior: Clip.none,
              child: (leadsAsync.isLoading && !leadsAsync.hasValue)
                  ? SkeletonCard(
                      horizontal: true,
                      count: 4,
                      width: 160.w,
                      height: 120.h,
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildStatCard(
                          'Total Leads',
                          '$totalLeads',
                          Icons.people_alt_rounded,
                          const Color(0xFFE91E63),
                          const Color(0xFFFFF0F5),
                          'Real-time',
                          true,
                        ),
                        SizedBox(width: 12.w),
                        _buildStatCard(
                          'New Leads',
                          '$newLeadsCount',
                          Icons.star_rounded,
                          const Color(0xFF3B82F6),
                          const Color(0xFFEFF6FF),
                          'Recent',
                          true,
                        ),
                        SizedBox(width: 12.w),
                        _buildStatCard(
                          'Contacted',
                          '${contactedLeadsCount + followUpLeadsCount}',
                          Icons.phone_in_talk_rounded,
                          const Color(0xFFF59E0B),
                          const Color(0xFFFFFBEB),
                          'In progress',
                          true,
                        ),
                        SizedBox(width: 12.w),
                        _buildStatCard(
                          'Converted',
                          '$convertedLeadsCount',
                          Icons.check_circle_rounded,
                          const Color(0xFF10B981),
                          const Color(0xFFECFDF5),
                          'Won',
                          true,
                        ),
                      ],
                    ),
            ),
          ),
          SliverToBoxAdapter(child: SizedBox(height: 24.h)),

          // Lead Sources header
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.w),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Lead Sources',
                    style: GoogleFonts.poppins(
                      fontSize: 18.sp,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1A1A2E),
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'View Report',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w600,
                          fontSize: 11.sp,
                          color: const Color(0xFFE91E63),
                        ),
                      ),
                      Icon(
                        Icons.arrow_forward_rounded,
                        color: Color(0xFFE91E63),
                        size: 14.sp,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(child: SizedBox(height: 12.h)),

          // Lead Source Cards
          SliverToBoxAdapter(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: EdgeInsets.symmetric(horizontal: 20.w),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildSourceCard(
                    'All Sources',
                    '$totalLeads',
                    Icons.grid_view_rounded,
                    const Color(0xFFE91E63),
                  ),
                  _buildSourceCard(
                    'Facebook',
                    '$facebookCount',
                    Icons.facebook_rounded,
                    const Color(0xFF1877F2),
                  ),
                  _buildSourceCard(
                    'Instagram',
                    '$instagramCount',
                    Icons.camera_alt_outlined,
                    const Color(0xFFE1306C),
                  ),
                  _buildSourceCard(
                    'WhatsApp',
                    '$whatsappCount',
                    Icons.chat_bubble_outline_rounded,
                    const Color(0xFF25D366),
                  ),
                  _buildSourceCard(
                    'Website',
                    '$websiteCount',
                    Icons.language_rounded,
                    const Color(0xFF3B82F6),
                  ),
                  _buildSourceCard(
                    'Walk-in',
                    '$walkinCount',
                    Icons.storefront_rounded,
                    const Color(0xFF06B6D4),
                  ),
                  _buildSourceCard(
                    'Manual',
                    '$manualCount',
                    Icons.person_add_alt_1_outlined,
                    const Color(0xFFE91E63),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(child: SizedBox(height: 24.h)),

          // Filters and Search
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.w),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isSmallScreen = constraints.maxWidth < 800;

                  Widget searchField = TextField(
                    controller: _searchCtrl,
                    decoration: InputDecoration(
                      hintText: 'Search by name, phone...',
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
                  );

                  Widget dateRange = GestureDetector(
                    onTap: _pickDateRange,
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 12.h,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8.r),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.calendar_month_outlined,
                            color: Color(0xFF1A1A2E),
                            size: 16.sp,
                          ),
                          SizedBox(width: 8.w),
                          Text(
                            _dateRangeText,
                            style: GoogleFonts.inter(
                              color: const Color(0xFF1A1A2E),
                              fontSize: 12.sp,
                            ),
                          ),
                          SizedBox(width: 8.w),
                          Icon(
                            Icons.keyboard_arrow_down_rounded,
                            color: Color(0xFF64748B),
                            size: 16.sp,
                          ),
                        ],
                      ),
                    ),
                  );

                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      isSmallScreen
                          ? Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                searchField,
                                SizedBox(height: 12.h),
                                dateRange,
                              ],
                            )
                          : Row(
                              children: [
                                Expanded(child: searchField),
                                SizedBox(width: 12.w),
                                dateRange,
                              ],
                            ),
                    ],
                  );
                },
              ),
            ),
          ),
          SliverToBoxAdapter(child: SizedBox(height: 16.h)),

          // Tabs
          SliverToBoxAdapter(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: EdgeInsets.symmetric(horizontal: 20.w),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildPillTab('All Leads ($totalLeads)', 'All'),
                  _buildPillTab('New ($newLeadsCount)', 'New'),
                  _buildPillTab(
                    'Contacted ($contactedLeadsCount)',
                    'Contacted',
                  ),
                  _buildPillTab('Follow Up ($followUpLeadsCount)', 'Follow Up'),
                  _buildPillTab(
                    'Converted ($convertedLeadsCount)',
                    'Converted',
                  ),
                  _buildPillTab('Lost ($lostLeadsCount)', 'Lost'),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(child: SizedBox(height: 16.h)),

          // Leads List / Table (Adaptive & 100% Responsive for All Screen Sizes)
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.w),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isMobile = constraints.maxWidth < 650;

                  return leadsAsync.when(
                    loading: () => isMobile
                        ? Column(
                            mainAxisSize: MainAxisSize.min,
                            children: List.generate(
                              4,
                              (i) => Container(
                                margin: EdgeInsets.only(bottom: 12.h),
                                padding: EdgeInsets.all(14.w),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16.r),
                                  border: Border.all(color: const Color(0xFFF1F5F9)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          width: 40.w,
                                          height: 40.w,
                                          decoration: BoxDecoration(
                                            color: Colors.grey[200],
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                        SizedBox(width: 10.w),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Container(
                                                width: 120.w,
                                                height: 14.h,
                                                decoration: BoxDecoration(
                                                  color: Colors.grey[200],
                                                  borderRadius: BorderRadius.circular(4.r),
                                                ),
                                              ),
                                              SizedBox(height: 6.h),
                                              Container(
                                                width: 60.w,
                                                height: 10.h,
                                                decoration: BoxDecoration(
                                                  color: Colors.grey[200],
                                                  borderRadius: BorderRadius.circular(4.r),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          width: 72.w,
                                          height: 24.h,
                                          decoration: BoxDecoration(
                                            color: Colors.grey[200],
                                            borderRadius: BorderRadius.circular(20.r),
                                          ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(height: 10.h),
                                    Container(
                                      width: double.infinity,
                                      height: 28.h,
                                      decoration: BoxDecoration(
                                        color: Colors.grey[100],
                                        borderRadius: BorderRadius.circular(8.r),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          )
                        : Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: EdgeInsets.symmetric(
                                  vertical: 12.h,
                                  horizontal: 16.w,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.only(
                                    topLeft: Radius.circular(12.r),
                                    topRight: Radius.circular(12.r),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      flex: 5,
                                      child: Text(
                                        'Customer Details',
                                        style: TextStyle(
                                          fontSize: 11.sp,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF64748B),
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 3,
                                      child: Text(
                                        'Source',
                                        style: TextStyle(
                                          fontSize: 11.sp,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF64748B),
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 3,
                                      child: Text(
                                        'Status',
                                        style: TextStyle(
                                          fontSize: 11.sp,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF64748B),
                                        ),
                                      ),
                                    ),
                                    SizedBox(
                                      width: 48.w,
                                      child: Text(
                                        'Actions',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 11.sp,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF64748B),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ...List.generate(
                                5,
                                (i) => Container(
                                  padding: EdgeInsets.symmetric(
                                    vertical: 20.h,
                                    horizontal: 16.w,
                                  ),
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    border: Border(
                                      bottom: BorderSide(color: Color(0xFFF1F5F9)),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 5,
                                        child: Row(
                                          children: [
                                            Container(
                                              width: 36.w,
                                              height: 36.h,
                                              decoration: BoxDecoration(
                                                color: Colors.grey[200],
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                            SizedBox(width: 12.w),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Container(
                                                    height: 12.h,
                                                    decoration: BoxDecoration(
                                                      color: Colors.grey[200],
                                                      borderRadius: BorderRadius.circular(4.r),
                                                    ),
                                                  ),
                                                  SizedBox(height: 4.h),
                                                  Container(
                                                    width: 60.w,
                                                    height: 10.h,
                                                    decoration: BoxDecoration(
                                                      color: Colors.grey[200],
                                                      borderRadius: BorderRadius.circular(4.r),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Expanded(
                                        flex: 3,
                                        child: Align(
                                          alignment: Alignment.centerLeft,
                                          child: Container(
                                            width: 60.w,
                                            height: 14.h,
                                            decoration: BoxDecoration(
                                              color: Colors.grey[200],
                                              borderRadius: BorderRadius.circular(4.r),
                                            ),
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        flex: 3,
                                        child: Align(
                                          alignment: Alignment.centerLeft,
                                          child: Container(
                                            width: 60.w,
                                            height: 14.h,
                                            decoration: BoxDecoration(
                                              color: Colors.grey[200],
                                              borderRadius: BorderRadius.circular(4.r),
                                            ),
                                          ),
                                        ),
                                      ),
                                      SizedBox(
                                        width: 48.w,
                                        child: Center(
                                          child: Container(
                                            width: 28.w,
                                            height: 28.w,
                                            decoration: BoxDecoration(
                                              color: Colors.grey[200],
                                              borderRadius: BorderRadius.circular(6.r),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                    error: (err, stack) => Padding(
                      padding: EdgeInsets.all(20.w),
                      child: Text(
                        'Error: $err',
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                    data: (leads) {
                      if (leads.isEmpty) {
                        return Padding(
                          padding: EdgeInsets.symmetric(vertical: 60.h),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.campaign_outlined,
                                size: 48.sp,
                                color: const Color(0xFFCBD5E1),
                              ),
                              SizedBox(height: 16.h),
                              Text(
                                'No Leads Found',
                                style: GoogleFonts.poppins(
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF1A1A2E),
                                ),
                              ),
                              SizedBox(height: 8.h),
                              Text(
                                'You have not received any leads yet.',
                                style: GoogleFonts.inter(
                                  fontSize: 12.sp,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        );
                      }

                      List<Map<String, dynamic>> displayLeads = leads
                          .cast<Map<String, dynamic>>();

                      // Filter by Search Query
                      if (_searchQuery.isNotEmpty) {
                        final q = _searchQuery.toLowerCase();
                        displayLeads = displayLeads.where((l) {
                          final n = l['name']?.toString().toLowerCase() ?? '';
                          final p = l['phone']?.toString().toLowerCase() ?? '';
                          final e = l['email']?.toString().toLowerCase() ?? '';
                          return n.contains(q) ||
                              p.contains(q) ||
                              e.contains(q);
                        }).toList();
                      }

                      // Filter by Source
                      if (_selectedSource != 'All Sources') {
                        displayLeads = displayLeads.where((l) {
                          final s = l['source']?.toString().toLowerCase() ?? '';
                          if (_selectedSource == 'Facebook') {
                            return s.contains('facebook') || s.contains('fb');
                          }
                          if (_selectedSource == 'Instagram') {
                            return s.contains('instagram') || s.contains('ig');
                          }
                          if (_selectedSource == 'WhatsApp') {
                            return s.contains('whatsapp') || s.contains('wa');
                          }
                          if (_selectedSource == 'Website') {
                            return s.contains('website') ||
                                s.contains('online') ||
                                s.contains('web');
                          }
                          if (_selectedSource == 'Walk-in') {
                            return s.contains('walk-in') ||
                                s.contains('walkin');
                          }
                          if (_selectedSource == 'Manual') {
                            return s.contains('manual') ||
                                s.contains('referral') ||
                                s.contains('other');
                          }
                          return false;
                        }).toList();
                      }

                      if (_selectedTab != 'All') {
                        displayLeads = displayLeads
                            .where(
                              (l) =>
                                  l['status']?.toString().toLowerCase() ==
                                  _selectedTab.toLowerCase(),
                            )
                            .toList();
                      }

                      if (displayLeads.isEmpty) {
                        return Padding(
                          padding: EdgeInsets.symmetric(vertical: 40.h),
                          child: Center(
                            child: Text(
                              'No leads match the current filters.',
                              style: GoogleFonts.inter(
                                fontSize: 13.sp,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        );
                      }

                      // Mobile view: Render responsive cards with mobile header
                      if (isMobile) {
                        return Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: EdgeInsets.only(bottom: 12.h, left: 4.w, right: 4.w),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Leads (${displayLeads.length})',
                                    style: GoogleFonts.poppins(
                                      fontSize: 14.sp,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF1E293B),
                                    ),
                                  ),
                                  Text(
                                    'Tap for details',
                                    style: GoogleFonts.inter(
                                      fontSize: 11.sp,
                                      fontWeight: FontWeight.w500,
                                      color: const Color(0xFF94A3B8),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            ...displayLeads
                                .map((lead) => _buildMobileLeadCard(lead))
                                .toList(),
                          ],
                        );
                      }

                      // Desktop / Tablet View: Classic structured data table
                      return Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: EdgeInsets.symmetric(
                              vertical: 12.h,
                              horizontal: 16.w,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(12.r),
                                topRight: Radius.circular(12.r),
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 5,
                                  child: Text(
                                    'Customer Details',
                                    style: TextStyle(
                                      fontSize: 11.sp,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  flex: 3,
                                  child: Text(
                                    'Source',
                                    style: TextStyle(
                                      fontSize: 11.sp,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  flex: 3,
                                  child: Text(
                                    'Status',
                                    style: TextStyle(
                                      fontSize: 11.sp,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                                SizedBox(
                                  width: 48.w,
                                  child: Text(
                                    'Actions',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 11.sp,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ...displayLeads
                              .map((lead) => _buildTableRow(lead))
                              .toList(),
                          Container(
                            height: 16.h,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(12.r),
                                bottomRight: Radius.circular(12.r),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  );
                },
              ),
            ),
          ),

          SliverToBoxAdapter(child: SizedBox(height: 24.h)),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color mainColor,
    Color bgColor,
    String subtext,
    bool isUp,
  ) {
    return PremiumStatCard(
      title: title,
      value: value,
      icon: icon,
      mainColor: mainColor,
      bgColor: bgColor,
      subtext: subtext,
      isUp: isUp,
    );
  }

  Widget _buildSourceCard(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    final isSelected = _selectedSource == label;
    return GestureDetector(
      onTap: () => setState(() => _selectedSource = label),
      child: Container(
        margin: EdgeInsets.only(right: 12.w),
        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 12.h),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE91E63) : Colors.white,
          borderRadius: BorderRadius.circular(16.r),
          border: Border.all(
            color: isSelected ? Colors.transparent : const Color(0xFFE2E8F0),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: isSelected ? Colors.white : color, size: 24.sp),
            SizedBox(height: 8.h),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11.sp,
                color: isSelected ? Colors.white : const Color(0xFF64748B),
              ),
            ),
            SizedBox(height: 2.h),
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 14.sp,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : const Color(0xFF1A1A2E),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterDropdown(String label) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12.sp,
              color: const Color(0xFF64748B),
            ),
          ),
          SizedBox(width: 8.w),
          Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 16.sp,
            color: Color(0xFF64748B),
          ),
        ],
      ),
    );
  }

  Widget _buildPillTab(String label, String value) {
    final isSelected = _selectedTab == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = value),
      child: Container(
        margin: EdgeInsets.only(right: 8.w),
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE91E63) : const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(20.r),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12.sp,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  // ── Responsive Mobile Lead Card (Ultra-Clean, Never Wraps Status) ──
  Widget _buildMobileLeadCard(Map<String, dynamic> lead) {
    final String name = lead['name']?.toString() ?? 'Unnamed Lead';
    final String phone = lead['phone']?.toString() ?? '';
    final String email = lead['email']?.toString() ?? '';
    final String source = lead['source']?.toString() ?? 'Other';
    final String status = lead['status']?.toString() ?? 'New';
    final String dateStr = lead['date']?.toString() ?? lead['created_at']?.toString() ?? '';

    final rawServices = lead['services'];
    final List<String> services = (rawServices is List)
        ? rawServices.map((e) => e.toString()).toList()
        : <String>[];

    final hasContactInfo = (phone.isNotEmpty && phone != 'N/A') || (email.isNotEmpty && email != 'N/A');

    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E293B).withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _showDetails(lead),
          borderRadius: BorderRadius.circular(16.r),
          child: Padding(
            padding: EdgeInsets.all(14.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top Row: Avatar + Name + Source Chip + Status Pill + 3-Dots
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Avatar
                    Container(
                      width: 40.w,
                      height: 40.w,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFFF0F5), Color(0xFFFFE4EC)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFFFD1DC), width: 1.5),
                      ),
                      child: Center(
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : 'U',
                          style: GoogleFonts.playfairDisplay(
                            color: const Color(0xFFE91E63),
                            fontWeight: FontWeight.bold,
                            fontSize: 17.sp,
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 10.w),
                    // Name & Source
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w700,
                              fontSize: 14.sp,
                              color: const Color(0xFF0F172A),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: 3.h),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _getSourceIcon(source),
                                color: _getSourceColor(source),
                                size: 13.sp,
                              ),
                              SizedBox(width: 4.w),
                              Flexible(
                                child: Text(
                                  source,
                                  style: GoogleFonts.inter(
                                    fontSize: 11.sp,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF64748B),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 8.w),
                    // Status Badge (Never breaks/wraps)
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                      decoration: BoxDecoration(
                        color: _getStatusBgColor(status),
                        borderRadius: BorderRadius.circular(20.r),
                        border: Border.all(
                          color: _getStatusTextColor(status).withOpacity(0.25),
                          width: 1,
                        ),
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6.w,
                              height: 6.w,
                              decoration: BoxDecoration(
                                color: _getStatusTextColor(status),
                                shape: BoxShape.circle,
                              ),
                            ),
                            SizedBox(width: 5.w),
                            Text(
                              status,
                              style: GoogleFonts.inter(
                                fontSize: 11.sp,
                                fontWeight: FontWeight.w600,
                                color: _getStatusTextColor(status),
                              ),
                              maxLines: 1,
                              softWrap: false,
                            ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(width: 4.w),
                    // Actions Menu
                    PopupMenuButton<String>(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: Icon(
                        Icons.more_vert_rounded,
                        size: 20.sp,
                        color: const Color(0xFF64748B),
                      ),
                      onSelected: (val) {
                        if (val == 'edit') {
                          context.push('/leads/edit', extra: lead);
                        } else if (val == 'delete') {
                          _confirmDelete(context, lead);
                        }
                      },
                      itemBuilder: (ctx) => [
                        PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(
                                Icons.edit_outlined,
                                size: 18.sp,
                                color: const Color(0xFF1A1A2E),
                              ),
                              SizedBox(width: 8.w),
                              Text(
                                'Edit',
                                style: GoogleFonts.inter(
                                  fontSize: 13.sp,
                                  color: const Color(0xFF1A1A2E),
                                ),
                              ),
                            ],
                          ),
                        ),
                        PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              const Icon(
                                Icons.delete_outline,
                                size: 18,
                                color: Colors.red,
                              ),
                              SizedBox(width: 8.w),
                              Text(
                                'Delete',
                                style: GoogleFonts.inter(
                                  fontSize: 13.sp,
                                  color: Colors.red,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                // Middle Bar: Contact Info (Phone & Email)
                if (hasContactInfo) ...[
                  SizedBox(height: 10.h),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 7.h),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10.r),
                      border: Border.all(color: const Color(0xFFE2E8F0).withOpacity(0.6)),
                    ),
                    child: Row(
                      children: [
                        if (phone.isNotEmpty && phone != 'N/A') ...[
                          Icon(Icons.phone_outlined, size: 13.sp, color: const Color(0xFF64748B)),
                          SizedBox(width: 5.w),
                          Text(
                            phone,
                            style: GoogleFonts.inter(
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF334155),
                            ),
                          ),
                        ],
                        if (email.isNotEmpty && email != 'N/A') ...[
                          if (phone.isNotEmpty && phone != 'N/A') ...[
                            SizedBox(width: 8.w),
                            Container(
                              width: 3.5.w,
                              height: 3.5.w,
                              decoration: const BoxDecoration(
                                color: Color(0xFFCBD5E1),
                                shape: BoxShape.circle,
                              ),
                            ),
                            SizedBox(width: 8.w),
                          ],
                          Expanded(
                            child: Row(
                              children: [
                                Icon(Icons.email_outlined, size: 13.sp, color: const Color(0xFF64748B)),
                                SizedBox(width: 5.w),
                                Expanded(
                                  child: Text(
                                    email,
                                    style: GoogleFonts.inter(
                                      fontSize: 11.5.sp,
                                      color: const Color(0xFF64748B),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],

                // Footer: Services tags or Date
                if (services.isNotEmpty || dateStr.isNotEmpty) ...[
                  SizedBox(height: 8.h),
                  Row(
                    children: [
                      if (services.isNotEmpty)
                        Expanded(
                          child: Wrap(
                            spacing: 6.w,
                            runSpacing: 4.h,
                            children: services.take(2).map((s) => Container(
                              padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(6.r),
                              ),
                              child: Text(
                                s,
                                style: GoogleFonts.inter(
                                  fontSize: 10.sp,
                                  color: const Color(0xFF2563EB),
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            )).toList(),
                          ),
                        ),
                      if (dateStr.isNotEmpty)
                        Text(
                          dateStr,
                          style: GoogleFonts.inter(
                            fontSize: 10.5.sp,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Tablet / Desktop Table Row (Structured, Non-Wrapping Status) ────
  Widget _buildTableRow(Map<String, dynamic> lead) {
    final String name = lead['name']?.toString() ?? 'Unknown';
    final String phone = lead['phone']?.toString() ?? 'N/A';
    final String email = lead['email']?.toString() ?? 'N/A';
    final String source = lead['source']?.toString() ?? 'Other';
    final String status = lead['status']?.toString() ?? 'New';
    final String dateStr = lead['date']?.toString() ?? '';

    return Material(
      color: Colors.white,
      child: InkWell(
        onTap: () => _showDetails(lead),
        child: Container(
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
          ),
          padding: EdgeInsets.symmetric(vertical: 16.h, horizontal: 16.w),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Customer Details — flex 5
              Expanded(
                flex: 5,
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: const Color(0xFFFFF0F5),
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : 'U',
                        style: GoogleFonts.playfairDisplay(
                          color: const Color(0xFFE91E63),
                          fontWeight: FontWeight.bold,
                          fontSize: 16.sp,
                        ),
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            name,
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w600,
                              fontSize: 13.sp,
                              color: const Color(0xFF1A1A2E),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            phone,
                            style: GoogleFonts.inter(
                              fontSize: 11.sp,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                          if (email.isNotEmpty && email != 'N/A')
                            Text(
                              email,
                              style: GoogleFonts.inter(
                                fontSize: 10.sp,
                                color: const Color(0xFF94A3B8),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Source — flex 3
              Expanded(
                flex: 3,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getSourceIcon(source),
                      color: _getSourceColor(source),
                      size: 16.sp,
                    ),
                    SizedBox(width: 6.w),
                    Flexible(
                      child: Text(
                        source,
                        style: GoogleFonts.inter(
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF1A1A2E),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              // Status — flex 3 (Never wraps or drops letters)
              Expanded(
                flex: 3,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 10.w,
                      vertical: 5.h,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusBgColor(status),
                      borderRadius: BorderRadius.circular(20.r),
                      border: Border.all(
                        color: _getStatusTextColor(status).withOpacity(0.2),
                        width: 1,
                      ),
                    ),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6.w,
                            height: 6.w,
                            decoration: BoxDecoration(
                              color: _getStatusTextColor(status),
                              shape: BoxShape.circle,
                            ),
                          ),
                          SizedBox(width: 5.w),
                          Text(
                            status,
                            style: GoogleFonts.inter(
                              fontSize: 11.sp,
                              fontWeight: FontWeight.w600,
                              color: _getStatusTextColor(status),
                            ),
                            softWrap: false,
                            maxLines: 1,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              // Actions — fixed width 48.w
              SizedBox(
                width: 48.w,
                child: Center(
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      borderRadius: BorderRadius.circular(6.r),
                    ),
                    child: PopupMenuButton<String>(
                      padding: EdgeInsets.zero,
                      icon: Icon(
                        Icons.more_vert_rounded,
                        size: 18.sp,
                        color: const Color(0xFF1A1A2E),
                      ),
                      onSelected: (val) {
                        if (val == 'edit') {
                          context.push('/leads/edit', extra: lead);
                        } else if (val == 'delete') {
                          _confirmDelete(context, lead);
                        }
                      },
                      itemBuilder: (ctx) => [
                        PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(
                                Icons.edit_outlined,
                                size: 18.sp,
                                color: const Color(0xFF1A1A2E),
                              ),
                              SizedBox(width: 8.w),
                              Text(
                                'Edit',
                                style: GoogleFonts.inter(
                                  fontSize: 13.sp,
                                  color: const Color(0xFF1A1A2E),
                                ),
                              ),
                            ],
                          ),
                        ),
                        PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              const Icon(
                                Icons.delete_outline,
                                size: 18,
                                color: Colors.red,
                              ),
                              SizedBox(width: 8.w),
                              Text(
                                'Delete',
                                style: GoogleFonts.inter(
                                  fontSize: 13.sp,
                                  color: Colors.red,
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    int index,
    IconData icon,
    String label,
    bool isSelected,
    BuildContext context,
  ) {
    return GestureDetector(
      onTap: () {
        if (Scaffold.maybeOf(context)?.isDrawerOpen ?? false) {
          Scaffold.of(context).closeDrawer();
        }
        switch (index) {
          case 0:
            context.go('/');
            break;
          case 1:
            context.go('/appointments');
            break;
          case 2:
            context.go('/customers');
            break;
          case 3:
            context.go('/leads');
            break;
          case 4:
            context.go('/services');
            break;
          case 5:
            context.go('/reports');
            break;
        }
      },
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isSelected
                ? const Color(0xFFE91E63)
                : const Color(0xFF94A3B8),
            size: 24.sp,
          ),
          SizedBox(height: 4.h),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10.sp,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              color: isSelected
                  ? const Color(0xFFE91E63)
                  : const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }
}

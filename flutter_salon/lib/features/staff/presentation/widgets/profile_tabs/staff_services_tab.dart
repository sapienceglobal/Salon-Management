import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_salon/features/staff/presentation/providers/staff_profile_provider.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';

class StaffServicesTab extends ConsumerStatefulWidget {
  final int staffId;
  const StaffServicesTab({super.key, required this.staffId});

  @override
  ConsumerState<StaffServicesTab> createState() => _StaffServicesTabState();
}

class _StaffServicesTabState extends ConsumerState<StaffServicesTab> {
  String? _selectedCategory;
  String _searchQuery = '';
  final Set<int> _savingServiceIds = {};

  Future<void> _toggleServiceAssignment(Map<String, dynamic> service, bool currentlyAssigned, List<dynamic> allServices) async {
    final serviceId = service['id'] as int;
    setState(() => _savingServiceIds.add(serviceId));

    try {
      final updatedList = allServices.map((s) {
        final sId = s['id'] as int;
        final isAssigned = sId == serviceId ? !currentlyAssigned : (s['is_assigned'] == true || s['is_assigned'] == 1);
        return {
          'service_id': sId,
          'is_assigned': isAssigned,
          'duration_mins': s['duration_mins'] ?? s['duration_minutes'],
          'price': s['price'],
        };
      }).toList();

      await ref.read(staffRepositoryProvider).updateStaffServices(
        widget.staffId,
        updatedList.where((u) => u['is_assigned'] == true).map((u) => u['service_id'] as int).toList(),
      );

      ref.invalidate(staffProfileServicesProvider(widget.staffId));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              currentlyAssigned
                  ? '${service['name']} unassigned'
                  : '${service['name']} assigned to staff',
            ),
            backgroundColor: currentlyAssigned ? const Color(0xFF64748B) : const Color(0xFF10B981),
            duration: const Duration(seconds: 1),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update service: ${e.toString().replaceAll("Exception: ", "")}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _savingServiceIds.remove(serviceId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final servicesAsync = ref.watch(staffProfileServicesProvider(widget.staffId));

    return servicesAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: Color(0xFFE91E63)),
      ),
      error: (err, stack) => Center(
        child: Padding(
          padding: EdgeInsets.all(20.w),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, color: Colors.red, size: 40.sp),
              SizedBox(height: 8.h),
              Text(
                'Failed to load services: $err',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: Colors.red),
              ),
              SizedBox(height: 12.h),
              ElevatedButton(
                onPressed: () => ref.invalidate(staffProfileServicesProvider(widget.staffId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (services) {
        if (services.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.content_cut_rounded, size: 48.sp, color: const Color(0xFFCBD5E1)),
                SizedBox(height: 12.h),
                Text(
                  'No salon services found in system.',
                  style: GoogleFonts.inter(color: const Color(0xFF64748B)),
                ),
              ],
            ),
          );
        }

        // Filter by search query
        final filteredServices = services.where((s) {
          final name = (s['name'] ?? '').toString().toLowerCase();
          final cat = (s['category_name'] ?? '').toString().toLowerCase();
          return name.contains(_searchQuery.toLowerCase()) || cat.contains(_searchQuery.toLowerCase());
        }).toList();

        final Map<String, List<dynamic>> grouped = {};
        for (var s in filteredServices) {
          final cat = s['category_name'] ?? 'General Services';
          if (!grouped.containsKey(cat)) grouped[cat] = [];
          grouped[cat]!.add(s);
        }

        final categories = grouped.keys.toList();
        if (_selectedCategory == null || !categories.contains(_selectedCategory)) {
          _selectedCategory = categories.isNotEmpty ? categories.first : null;
        }

        final currentCategoryServices = _selectedCategory != null ? (grouped[_selectedCategory!] ?? []) : [];
        final assignedCount = services.where((s) => s['is_assigned'] == true || s['is_assigned'] == 1).length;

        return Column(
          children: [
            // Search Bar & Summary Banner
            Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              color: Colors.white,
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          onChanged: (val) => setState(() => _searchQuery = val.trim()),
                          decoration: InputDecoration(
                            hintText: 'Search services or categories...',
                            prefixIcon: Icon(Icons.search_rounded, color: const Color(0xFF94A3B8), size: 20.sp),
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(vertical: 10.h),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12.r),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12.r),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                            fillColor: const Color(0xFFF8FAFC),
                            filled: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8.h),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Assigned: $assignedCount of ${services.length} services',
                        style: GoogleFonts.inter(
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      Text(
                        'Active skills enabled',
                        style: GoogleFonts.inter(
                          fontSize: 11.5.sp,
                          color: const Color(0xFF10B981),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),

            // Category Sidebar & Services List
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Categories Sidebar
                  Container(
                    width: 130.w,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(right: BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                    child: ListView.builder(
                      itemCount: categories.length,
                      itemBuilder: (context, index) {
                        final cat = categories[index];
                        final isSelected = cat == _selectedCategory;
                        final count = grouped[cat]?.length ?? 0;
                        final assignedInCat = (grouped[cat] ?? []).where((s) => s['is_assigned'] == true || s['is_assigned'] == 1).length;

                        return InkWell(
                          onTap: () => setState(() => _selectedCategory = cat),
                          child: Container(
                            padding: EdgeInsets.symmetric(vertical: 14.h, horizontal: 10.w),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFFFDF2F8) : Colors.transparent,
                              border: isSelected
                                  ? Border(
                                      right: BorderSide(
                                        color: const Color(0xFFE91E63),
                                        width: 3.w,
                                      ),
                                    )
                                  : null,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  cat,
                                  style: GoogleFonts.inter(
                                    color: isSelected ? const Color(0xFFDB2777) : const Color(0xFF334155),
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    fontSize: 12.5.sp,
                                  ),
                                ),
                                SizedBox(height: 2.h),
                                Text(
                                  '$assignedInCat / $count',
                                  style: GoogleFonts.inter(
                                    fontSize: 10.5.sp,
                                    color: isSelected ? const Color(0xFFE91E63) : const Color(0xFF94A3B8),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Services in Category
                  Expanded(
                    child: Container(
                      color: const Color(0xFFF8FAFC),
                      padding: EdgeInsets.all(14.w),
                      child: currentCategoryServices.isEmpty
                          ? Center(
                              child: Text(
                                'No services in this category.',
                                style: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
                              ),
                            )
                          : ListView.builder(
                              itemCount: currentCategoryServices.length,
                              itemBuilder: (context, index) {
                                final service = currentCategoryServices[index];
                                final isAssigned = service['is_assigned'] == true || service['is_assigned'] == 1;
                                final serviceId = service['id'] as int;
                                final isSaving = _savingServiceIds.contains(serviceId);

                                return Container(
                                  margin: EdgeInsets.only(bottom: 10.h),
                                  padding: EdgeInsets.all(14.w),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(14.r),
                                    border: Border.all(
                                      color: isAssigned ? const Color(0xFFFBCFE8) : const Color(0xFFF1F5F9),
                                      width: isAssigned ? 1.2 : 1.0,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.02),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              service['name'] ?? 'Service',
                                              style: GoogleFonts.inter(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 13.5.sp,
                                                color: const Color(0xFF1E293B),
                                              ),
                                            ),
                                            SizedBox(height: 4.h),
                                            Row(
                                              children: [
                                                Icon(Icons.schedule_rounded, size: 13.sp, color: const Color(0xFF64748B)),
                                                SizedBox(width: 4.w),
                                                Text(
                                                  '${service['duration_mins'] ?? service['duration_minutes'] ?? 30} mins',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 11.5.sp,
                                                    color: const Color(0xFF64748B),
                                                  ),
                                                ),
                                                SizedBox(width: 12.w),
                                                Icon(Icons.payments_outlined, size: 13.sp, color: const Color(0xFF64748B)),
                                                SizedBox(width: 4.w),
                                                Text(
                                                  '₹${service['price'] ?? 0}',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 11.5.sp,
                                                    fontWeight: FontWeight.w600,
                                                    color: const Color(0xFF1E293B),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      SizedBox(width: 8.w),
                                      if (isSaving)
                                        SizedBox(
                                          width: 28.w,
                                          height: 28.w,
                                          child: const CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Color(0xFFE91E63),
                                          ),
                                        )
                                      else
                                        Switch(
                                          value: isAssigned,
                                          activeTrackColor: const Color(0xFFFCE7F3),
                                          activeColor: const Color(0xFFE91E63),
                                          onChanged: (val) => _toggleServiceAssignment(service, isAssigned, services),
                                        ),
                                    ],
                                  ),
                                );
                              },
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

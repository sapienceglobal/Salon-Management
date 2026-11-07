import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../../../core/widgets/main_layout_screen.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../providers/appointment_provider.dart';
import 'package:flutter_salon/core/widgets/premium_stat_card.dart';
import '../../../../core/widgets/skeletons/skeleton_card.dart';

class AppointmentsListScreen extends ConsumerStatefulWidget {
  const AppointmentsListScreen({super.key});

  @override
  ConsumerState<AppointmentsListScreen> createState() =>
      _AppointmentsListScreenState();
}

class _AppointmentsListScreenState
    extends ConsumerState<AppointmentsListScreen> {
  DateTime _baseDate = DateTime.now();
  DateTime _selectedDate = DateTime.now();
  String _selectedFilter = 'All';
  String _searchQuery = '';
  late final ScrollController _dateScrollController;

  @override
  void initState() {
    super.initState();
    _dateScrollController = ScrollController(
      initialScrollOffset: (15 * 60.0) - 150,
    );
  }

  @override
  void dispose() {
    _dateScrollController.dispose();
    super.dispose();
  }

  void _scrollToCenter() {
    if (_dateScrollController.hasClients) {
      _dateScrollController.animateTo(
        (15 * 60.0) - 150,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateString = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final appointmentsAsync = ref.watch(appointmentsListProvider(dateString));
    final monthlyDatesAsync = ref.watch(
      monthlyAppointmentsProvider(DateTime(_baseDate.year, _baseDate.month, 1)),
    );
    final statsAsync = ref.watch(appointmentStatsProvider(dateString));

    final datesWithAppointments = Set<String>.from(
      monthlyDatesAsync.value ?? <String>{},
    );

    // Optimistically show dot for the selected date if it has appointments
    // This fixes the issue where the dot doesn't appear immediately after booking
    if (appointmentsAsync.value != null &&
        appointmentsAsync.value!.isNotEmpty) {
      datesWithAppointments.add(dateString);
    }
    final stats = statsAsync.value;

    final totalApts = stats?['total']?['value']?.toString() ?? '0';
    final confirmedApts = stats?['confirmed']?['value']?.toString() ?? '0';
    final inProgressApts = stats?['in_progress']?['value']?.toString() ?? '0';
    final cancelledApts = stats?['cancelled']?['value']?.toString() ?? '0';

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(20.0.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // --- Header & Banner ---
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16.r),
                    child: Container(
                      height: 160.h,
                      width: double.infinity,
                      color: Colors.white,
                      child: Stack(
                        children: [
                          Positioned(
                            top: 5, // Shift image up
                            bottom: -80, // Allow it to expand down
                            right: -120, // Shift image heavily to the right!
                            width:
                                MediaQuery.of(context).size.width +
                                120, // Ensure it covers the left side
                            child: Image.asset(
                              'assets/images/appointments_banner.jpg',
                              fit: BoxFit.cover,
                            ),
                          ),
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  const Color(0xFFFCE7F3),
                                  const Color(0xFFFCE7F3).withOpacity(0.95),
                                  const Color(0xFFFCE7F3).withOpacity(0.6),
                                  Colors.transparent,
                                ],
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                stops: const [0.0, 0.4, 0.7, 1.0],
                              ),
                            ),
                            padding: EdgeInsets.all(20.0.w),
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Appointments',
                                    style: GoogleFonts.poppins(
                                      fontSize: 26.sp,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF1A1A2E),
                                    ),
                                  ),
                                  SizedBox(height: 4.h),
                                  SizedBox(
                                    width:
                                        MediaQuery.of(context).size.width *
                                        0.45,
                                    child: Text(
                                      'Manage your schedule, clients and services with ease.',
                                      style: GoogleFonts.inter(
                                        fontSize: 13.sp,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SizedBox(height: 24.h),

                  // --- Date Strip Header ---
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () =>
                            _showCalendarBottomSheet(datesWithAppointments),
                        child: Row(
                          children: [
                            Text(
                              DateFormat('MMMM yyyy').format(_selectedDate),
                              style: GoogleFonts.poppins(
                                fontSize: 18.sp,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1A1A2E),
                              ),
                            ),
                            SizedBox(width: 4.w),
                            Icon(
                              Icons.keyboard_arrow_down_rounded,
                              color: Color(0xFF1A1A2E),
                              size: 20.sp,
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedDate = DateTime.now();
                            _baseDate = DateTime.now();
                          });
                        },
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 16.w,
                            vertical: 8.h,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8.r),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Text(
                            'Today',
                            style: GoogleFonts.inter(
                              fontSize: 13.sp,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF1A1A2E),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: 12.w),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedDate = _selectedDate.subtract(
                              const Duration(days: 1),
                            );
                            if (_selectedDate.isBefore(
                              _baseDate.subtract(const Duration(days: 15)),
                            )) {
                              _baseDate = _selectedDate.add(
                                const Duration(days: 15),
                              );
                            }
                          });
                        },
                        child: Container(
                          padding: EdgeInsets.all(6.w),
                          decoration: const BoxDecoration(
                            color: Color(0xFFFFF0F5),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.keyboard_arrow_left_rounded,
                            color: Color(0xFFE91E63),
                            size: 18.sp,
                          ),
                        ),
                      ),
                      SizedBox(width: 8.w),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedDate = _selectedDate.add(
                              const Duration(days: 1),
                            );
                            if (_selectedDate.isAfter(
                              _baseDate.add(const Duration(days: 15)),
                            )) {
                              _baseDate = _selectedDate.subtract(
                                const Duration(days: 15),
                              );
                            }
                          });
                        },
                        child: Container(
                          padding: EdgeInsets.all(6.w),
                          decoration: const BoxDecoration(
                            color: Color(0xFFFFF0F5),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.keyboard_arrow_right_rounded,
                            color: Color(0xFFE91E63),
                            size: 18.sp,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // --- Date Strip ---
                  SizedBox(
                    height: 80.h,
                    child: ListView.builder(
                      controller: _dateScrollController,
                      scrollDirection: Axis.horizontal,
                      itemCount: 31,
                      itemBuilder: (context, index) {
                        final date = _baseDate.subtract(
                          Duration(days: 15 - index),
                        );
                        final isSelected =
                            date.year == _selectedDate.year &&
                            date.month == _selectedDate.month &&
                            date.day == _selectedDate.day;

                        final dateStr = DateFormat('yyyy-MM-dd').format(date);
                        final hasApt = datesWithAppointments.contains(dateStr);

                        return GestureDetector(
                          onTap: () => setState(() => _selectedDate = date),
                          child: Container(
                            width: 60.w,
                            margin: EdgeInsets.only(right: 8.w),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFFE91E63)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(12.r),
                              border: isSelected
                                  ? null
                                  : Border.all(color: const Color(0xFFF1F5F9)),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  DateFormat('E').format(date),
                                  style: GoogleFonts.inter(
                                    color: isSelected
                                        ? Colors.white.withOpacity(0.9)
                                        : const Color(0xFF64748B),
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                SizedBox(height: 4.h),
                                Text(
                                  '${date.day}',
                                  style: GoogleFonts.poppins(
                                    color: isSelected
                                        ? Colors.white
                                        : const Color(0xFF1A1A2E),
                                    fontSize: 20.sp,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 4.h),
                                Opacity(
                                  opacity: hasApt ? 1.0 : 0.0,
                                  child: Container(
                                    width: 4.w,
                                    height: 4.h,
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? Colors.white
                                          : const Color(0xFFE91E63),
                                      shape: BoxShape.circle,
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
                  SizedBox(height: 24.h),

                  // --- Stat Cards ---
                  ref
                      .watch(appointmentStatsProvider(dateString))
                      .when(
                        data: (stats) {
                          return SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _buildStatCard(
                                  totalApts,
                                  'Total\nAppointments',
                                  Icons.calendar_today_rounded,
                                  const Color(0xFFE91E63),
                                  const Color(0xFFFFF0F5),
                                  () => setState(() => _selectedFilter = 'All'),
                                ),
                                _buildStatCard(
                                  confirmedApts,
                                  'Confirmed',
                                  Icons.check_circle_rounded,
                                  const Color(0xFF10B981),
                                  const Color(0xFFECFDF5),
                                  () => setState(
                                    () => _selectedFilter = 'Confirmed',
                                  ),
                                ),
                                _buildStatCard(
                                  inProgressApts,
                                  'In Progress',
                                  Icons.access_time_rounded,
                                  const Color(0xFFF59E0B),
                                  const Color(0xFFFFFBEB),
                                  () => setState(
                                    () => _selectedFilter = 'In Progress',
                                  ),
                                ),
                                _buildStatCard(
                                  cancelledApts,
                                  'Cancelled',
                                  Icons.cancel_rounded,
                                  const Color(0xFFEF4444),
                                  const Color(0xFFFEF2F2),
                                  () => setState(
                                    () => _selectedFilter = 'Cancelled',
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                        loading: () => SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: SkeletonCard(
                            horizontal: true,
                            count: 4,
                            width: 160.w,
                            height: 120.h,
                          ),
                        ),
                        error: (_, _) => SizedBox.shrink(),
                      ),
                  SizedBox(height: 24.h),

                  // --- Filter Tabs ---
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildTab(
                          'All ($totalApts)',
                          _selectedFilter == 'All',
                          () => setState(() => _selectedFilter = 'All'),
                        ),
                        _buildTab(
                          'Confirmed ($confirmedApts)',
                          _selectedFilter == 'Confirmed',
                          () => setState(() => _selectedFilter = 'Confirmed'),
                        ),
                        _buildTab(
                          'In Progress ($inProgressApts)',
                          _selectedFilter == 'In Progress',
                          () => setState(() => _selectedFilter = 'In Progress'),
                        ),
                        _buildTab(
                          'Cancelled ($cancelledApts)',
                          _selectedFilter == 'Cancelled',
                          () => setState(() => _selectedFilter = 'Cancelled'),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 20.h),

                  // --- Search and Filters Row ---
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          onChanged: (val) =>
                              setState(() => _searchQuery = val),
                          decoration: InputDecoration(
                            hintText: 'Search by name, phone or service...',
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
                        ),
                      ),
                      SizedBox(width: 12.w),
                      GestureDetector(
                        onTap: _showFiltersBottomSheet,
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 16.w,
                            vertical: 12.h,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12.r),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.filter_alt_outlined,
                                color: Color(0xFF1A1A2E),
                                size: 18.sp,
                              ),
                              SizedBox(width: 8.w),
                              Text(
                                'Filters',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF1A1A2E),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              SizedBox(width: 8.w),
                              Icon(
                                Icons.keyboard_arrow_down_rounded,
                                color: Color(0xFF64748B),
                                size: 18.sp,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // --- Appointments List ---
          appointmentsAsync.when(
            loading: () => const SliverToBoxAdapter(child: SkeletonList()),
            error: (err, stack) => SliverToBoxAdapter(
              child: Center(
                child: Text('Error: $err', style: GoogleFonts.inter()),
              ),
            ),
            data: (allAppointments) {
              final appointments = allAppointments.where((appt) {
                if (_searchQuery.isNotEmpty) {
                  final s = _searchQuery.toLowerCase();
                  final custName = (appt['customer_name']?.toString() ?? '')
                      .toLowerCase();
                  final custPhone = (appt['customer_phone']?.toString() ?? '')
                      .toLowerCase();
                  final servName = (appt['service_name']?.toString() ?? '')
                      .toLowerCase();
                  if (!custName.contains(s) &&
                      !custPhone.contains(s) &&
                      !servName.contains(s))
                    return false;
                }

                if (_selectedFilter == 'All') return true;
                final status = (appt['status']?.toString() ?? 'scheduled')
                    .toLowerCase();
                if (_selectedFilter == 'Confirmed' && status == 'planned')
                  return true; // UI says Confirmed, backend says planned
                if (_selectedFilter == 'In Progress' && status == 'ongoing')
                  return true; // UI says In Progress, backend says ongoing
                if (_selectedFilter == 'Cancelled' && status == 'cancelled')
                  return true;
                return false;
              }).toList();

              if (appointments.isEmpty) {
                return SliverToBoxAdapter(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(40.0.w),
                      child: Column(
                        children: [
                          Icon(
                            Icons.event_busy_outlined,
                            size: 64.sp,
                            color: Color(0xFFE2E8F0),
                          ),
                          SizedBox(height: 16.h),
                          Text(
                            'No appointments found.',
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
                  final appt = appointments[index];
                  return _buildAppointmentItem(context, appt);
                }, childCount: appointments.length),
              );
            },
          ),

          SliverToBoxAdapter(child: SizedBox(height: 100.h)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/book-appointment'),
        backgroundColor: const Color(0xFFE91E63),
        elevation: 2,
        shape: const CircleBorder(),
        child: Icon(Icons.add_rounded, color: Colors.white, size: 28.sp),
      ),
    );
  }

  Widget _buildTab(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        margin: EdgeInsets.only(right: 8.w),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE91E63) : Colors.white,
          borderRadius: BorderRadius.circular(20.r),
          border: Border.all(
            color: isSelected
                ? const Color(0xFFE91E63)
                : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            color: isSelected ? Colors.white : const Color(0xFF64748B),
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            fontSize: 13.sp,
          ),
        ),
      ),
    );
  }

  void _showCalendarBottomSheet(Set<String> datesWithAppointments) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateBottomSheet) {
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
            ),
            padding: EdgeInsets.all(24.w),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Select Date',
                      style: GoogleFonts.poppins(
                        fontSize: 18.sp,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                SizedBox(height: 16.h),
                TableCalendar(
                  firstDay: DateTime.utc(2020, 1, 1),
                  lastDay: DateTime.utc(2030, 12, 31),
                  focusedDay: _selectedDate,
                  selectedDayPredicate: (day) => isSameDay(_selectedDate, day),
                  onDaySelected: (selectedDay, focusedDay) {
                    setState(() {
                      _selectedDate = selectedDay;
                      _baseDate = focusedDay;
                    });
                    Navigator.pop(context);
                  },
                  onPageChanged: (focusedDay) {
                    setStateBottomSheet(() {
                      _selectedDate = focusedDay;
                    });
                    setState(() {
                      _baseDate = focusedDay;
                    });
                  },
                  calendarBuilders: CalendarBuilders(
                    markerBuilder: (context, date, events) {
                      final dateString = DateFormat('yyyy-MM-dd').format(date);
                      if (datesWithAppointments.contains(dateString)) {
                        return Positioned(
                          bottom: 4,
                          child: Container(
                            width: 6.w,
                            height: 6.w,
                            decoration: const BoxDecoration(
                              color: Color(0xFFE91E63),
                              shape: BoxShape.circle,
                            ),
                          ),
                        );
                      }
                      return null;
                    },
                  ),
                  calendarStyle: CalendarStyle(
                    todayDecoration: BoxDecoration(
                      color: const Color(0xFFFCE7F3),
                      shape: BoxShape.circle,
                    ),
                    todayTextStyle: const TextStyle(color: Color(0xFFE91E63)),
                    selectedDecoration: BoxDecoration(
                      color: const Color(0xFFE91E63),
                      shape: BoxShape.circle,
                    ),
                    markerDecoration: const BoxDecoration(
                      color: Color(0xFFE91E63),
                      shape: BoxShape.circle,
                    ),
                  ),
                  headerStyle: HeaderStyle(
                    formatButtonVisible: false,
                    titleCentered: true,
                    titleTextStyle: GoogleFonts.poppins(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                SizedBox(height: 32.h),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showFiltersBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
        ),
        padding: EdgeInsets.all(24.w),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Filters',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            SizedBox(height: 16.h),
            Text(
              'Filter options coming soon!',
              style: GoogleFonts.inter(color: Colors.grey),
            ),
            SizedBox(height: 32.h),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentItem(
    BuildContext context,
    Map<String, dynamic> appt,
  ) {
    final customerName = appt['customer_name']?.toString() ?? 'Walk-in Client';
    final serviceName = appt['service_name']?.toString() ?? 'Custom Service';
    final statusStr = (appt['status']?.toString() ?? 'scheduled').toLowerCase();
    String timeStr =
        appt['appointment_time']?.toString() ?? appt['time']?.toString() ?? '';

    // Attempt parsing for cleaner display
    try {
      final dt = DateTime.parse(timeStr);
      timeStr = DateFormat('hh:mm a').format(dt);
    } catch (_) {}

    Color statusColor = const Color(0xFFE91E63);
    Color statusBg = const Color(0xFFFFF0F5);
    String statusLabel = 'Scheduled';

    if (statusStr == 'planned') {
      statusColor = const Color(0xFFE91E63);
      statusBg = const Color(0xFFFFF0F5);
      statusLabel = 'Planned';
    } else if (statusStr == 'ongoing') {
      statusColor = const Color(0xFFF59E0B);
      statusBg = const Color(0xFFFFFBEB);
      statusLabel = 'Ongoing';
    } else if (statusStr == 'completed') {
      statusColor = const Color(0xFF10B981);
      statusBg = const Color(0xFFECFDF5);
      statusLabel = 'Completed';
    } else if (statusStr == 'cancelled') {
      statusColor = const Color(0xFFEF4444);
      statusBg = const Color(0xFFFEF2F2);
      statusLabel = 'Cancelled';
    } else if (statusStr == 'no_show') {
      statusColor = const Color(0xFF64748B);
      statusBg = const Color(0xFFF1F5F9);
      statusLabel = 'No Show';
    }

    return GestureDetector(
      onTap: () => context.push('/appointments/${appt['id']}'),
      child: Container(
        margin: EdgeInsets.only(bottom: 12.h, left: 16.w, right: 16.w),
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Column(
              children: [
                Text(
                  timeStr,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 13.sp,
                    color: const Color(0xFF1A1A2E),
                  ),
                ),
              ],
            ),
            SizedBox(width: 16.w),
            Container(width: 2.w, height: 40.h, color: const Color(0xFFF1F5F9)),
            SizedBox(width: 16.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    customerName,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 14.sp,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    serviceName,
                    style: GoogleFonts.inter(
                      color: const Color(0xFF64748B),
                      fontSize: 12.sp,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
              decoration: BoxDecoration(
                color: statusBg,
                borderRadius: BorderRadius.circular(20.r),
              ),
              child: Text(
                statusLabel,
                style: GoogleFonts.inter(
                  color: statusColor,
                  fontSize: 11.sp,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            PopupMenuButton<String>(
              icon: Icon(
                Icons.more_vert,
                color: const Color(0xFF64748B),
                size: 20.sp,
              ),
              padding: EdgeInsets.zero,
              onSelected: (value) async {
                if (value == 'delete') {
                  // Ignore or show dialog
                } else {
                  try {
                    final repo = ref.read(appointmentRepositoryProvider);
                    await repo.updateAppointmentStatus(appt['id'], value);
                    ref.invalidate(appointmentsListProvider);
                    ref.invalidate(monthlyAppointmentsProvider);
                    ref.invalidate(appointmentStatsProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Appointment status updated successfully',
                          ),
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      String errorMessage = e.toString().replaceAll(
                        RegExp(r'Exception:\s*'),
                        '',
                      );
                      if (errorMessage.contains('Cannot change status')) {
                        if (statusStr == value) {
                          errorMessage =
                              'This appointment is already marked as $statusLabel.';
                        } else {
                          // The backend message is already human readable: "Cannot change status from 'completed' to 'planned'"
                          // We just use it as is.
                        }
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(errorMessage),
                          backgroundColor: Colors.redAccent,
                        ),
                      );
                    }
                  }
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'planned',
                  child: Text('Mark Planned'),
                ),
                const PopupMenuItem(
                  value: 'ongoing',
                  child: Text('Mark Ongoing'),
                ),
                const PopupMenuItem(
                  value: 'completed',
                  child: Text('Mark Completed'),
                ),
                const PopupMenuItem(
                  value: 'cancelled',
                  child: Text('Cancel Appointment'),
                ),
                const PopupMenuItem(
                  value: 'no_show',
                  child: Text('Mark No Show'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String value,
    String label,
    IconData icon,
    Color iconColor,
    Color bgColor, [
    VoidCallback? onTap,
  ]) {
    return PremiumStatCard(
      title: label,
      value: value,
      icon: icon,
      mainColor: iconColor,
      bgColor: bgColor,
      onTap: onTap,
      width: 175,
    );
  }
}

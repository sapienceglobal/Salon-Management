import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/appointment_provider.dart';
import '../../../services/data/service_provider.dart';
import '../../../staff/data/staff_provider.dart';
import '../../../customers/data/customer_provider.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../../../../core/utils/form_scroll_helper.dart';
import 'package:flutter_salon/core/network/dio_client.dart';

import '../../../settings/presentation/providers/settings_provider.dart';

class BookAppointmentScreen extends ConsumerStatefulWidget {
  const BookAppointmentScreen({super.key});

  @override
  ConsumerState<BookAppointmentScreen> createState() =>
      _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends ConsumerState<BookAppointmentScreen> {
  final GlobalKey _serviceSectionKey = GlobalKey();
  final GlobalKey _staffSectionKey = GlobalKey();
  final GlobalKey _dateTimeSectionKey = GlobalKey();
  final GlobalKey _clientSectionKey = GlobalKey();

  int _selectedCategoryId = 0; // 0 means 'All Services'
  final Set<int> _selectedServiceIds = {};
  int? get _selectedServiceId =>
      _selectedServiceIds.isEmpty ? null : _selectedServiceIds.first;
  int? _selectedStaffId;
  String? _selectedTime;
  String? _selectedRoom;
  DateTime? _selectedDate;
  DateTime _baseDate = DateTime.now();
  String _searchQuery = '';

  final ScrollController _servicesScrollController = ScrollController();
  final ScrollController _staffScrollController = ScrollController();

  // Customer Selection State
  int? _selectedCustomerId;
  String _customerSearchQuery = '';
  bool _isLoading = false;

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _servicesScrollController.dispose();
    _staffScrollController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Color(0xFF1A1A2E),
            size: 20.sp,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Book Appointment',
          style: GoogleFonts.poppins(
            color: const Color(0xFF1A1A2E),
            fontSize: 18.sp,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: GestureDetector(
        onTap: () => FormScrollHelper.unfocus(),
        behavior: HitTestBehavior.opaque,
        child: SafeArea(
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hero Banner
                _buildHeroBanner(),

                // Stepper
                _buildStepper(),

                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.w),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(height: 24.h),
                      // Step 1: Select Service
                      KeyedSubtree(
                        key: _serviceSectionKey,
                        child: _buildSectionHeader(
                          '1',
                          'Select Service',
                          'Choose the service you want',
                          onViewAll: _showServicesPopup,
                        ),
                      ),
                      _buildCategoryTabs(),
                      SizedBox(height: 16.h),
                      _buildServicesGrid(),
                      SizedBox(height: 32.h),

                      if (_selectedServiceId != null) ...[
                        // Step 2: Choose Staff
                        KeyedSubtree(
                          key: _staffSectionKey,
                          child: _buildSectionHeader(
                            '2',
                            'Choose Staff',
                            'Select your preferred stylist/therapist',
                            onViewAll: _showStaffPopup,
                          ),
                        ),
                        _buildStaffList(),
                        SizedBox(height: 32.h),
                      ],

                      // Step 3 & 4 Layout (Responsive)
                      Builder(
                        builder: (context) {
                          final isSmallScreen =
                              MediaQuery.of(context).size.width < 800;

                          Widget step3 = Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_selectedStaffId != null &&
                                  _selectedServiceId != null) ...[
                                // Removed extra 32.h gap here
                                KeyedSubtree(
                                  key: _dateTimeSectionKey,
                                  child: _buildSectionHeader(
                                    '3',
                                    'Select Date & Time',
                                    'Choose your convenient slot',
                                  ),
                                ),
                                _buildDateAndTimeSelection(),
                              ],
                            ],
                          );

                          Widget step4 = Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_selectedTime != null &&
                                  _selectedStaffId != null &&
                                  _selectedServiceId != null) ...[
                                // Removed extra 16.h gap here
                                KeyedSubtree(
                                  key: _clientSectionKey,
                                  child: _buildSectionHeader(
                                    '4',
                                    'Client & Notes',
                                    'Select client and add notes',
                                  ),
                                ),
                                _buildYourDetailsForm(),
                              ],
                            ],
                          );

                          if (isSmallScreen) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                step3,
                                if (_selectedStaffId != null &&
                                    _selectedTime != null &&
                                    _selectedServiceId != null)
                                  SizedBox(height: 32.h),
                                step4,
                              ],
                            );
                          }

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: step3),
                              SizedBox(width: 20.w),
                              Expanded(child: step4),
                            ],
                          );
                        },
                      ),
                      if (_selectedCustomerId != null &&
                          _selectedTime != null &&
                          _selectedStaffId != null &&
                          _selectedServiceId != null) ...[
                        SizedBox(height: 32.h),
                        _buildSectionHeader(
                          '5',
                          'Confirm Appointment',
                          'Review your details and book',
                        ),
                        _buildConfirmCard(),
                      ],
                      SizedBox(height: MediaQuery.of(context).padding.bottom + 120.h),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroBanner() {
    return Container(
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
          Positioned(
            left: 20.w,
            top: 40.h,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'BOOK APPOINTMENT',
                  style: GoogleFonts.inter(
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2,
                    color: const Color(0xFFE91E63), // Pink color for subtitle
                  ),
                ),
                SizedBox(height: 8.h),
                Text(
                  'Look Good,',
                  style: GoogleFonts.poppins(
                    fontSize: 32.sp,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1A1A2E),
                    height: 1.1,
                  ),
                ),
                Text(
                  'Feel Amazing',
                  style: GoogleFonts.poppins(
                    fontSize: 32.sp,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFFE91E63),
                    height: 1.1,
                  ),
                ),
                SizedBox(height: 12.h),
                Text(
                  'Schedule your next appointment in',
                  style: GoogleFonts.inter(
                    fontSize: 14.sp,
                    color: const Color(0xFF64748B),
                  ),
                ),
                Text(
                  'just a few steps.',
                  style: GoogleFonts.inter(
                    fontSize: 14.sp,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _isStepCompleted(int step) {
    switch (step) {
      case 1:
        return _selectedServiceId != null;
      case 2:
        return _selectedStaffId != null;
      case 3:
        return _selectedDate != null && _selectedTime != null;
      case 4:
        return _selectedCustomerId != null;
      case 5:
        return _selectedServiceId != null &&
            _selectedStaffId != null &&
            _selectedDate != null &&
            _selectedTime != null &&
            _selectedCustomerId != null;
      default:
        return false;
    }
  }

  int _calculateCurrentStep() {
    if (!_isStepCompleted(1)) return 1;
    if (!_isStepCompleted(2)) return 2;
    if (!_isStepCompleted(3)) return 3;
    if (!_isStepCompleted(4)) return 4;
    return 5;
  }

  Future<void> _navigateToAddCustomer() async {
    FormScrollHelper.unfocus();

    String? initName;
    String? initPhone;
    final trimmedQuery = _customerSearchQuery.trim();
    if (trimmedQuery.isNotEmpty) {
      if (RegExp(r'^\d+$').hasMatch(trimmedQuery)) {
        initPhone = trimmedQuery;
      } else {
        initName = trimmedQuery;
      }
    }

    final newCustomer = await context.push<Map<String, dynamic>>(
      '/customers/add',
      extra: {
        if (initName != null) 'initialName': initName,
        if (initPhone != null) 'initialPhone': initPhone,
      },
    );

    if (newCustomer != null && mounted) {
      ref.invalidate(customersListProvider);
      ref.invalidate(recentCustomersProvider);

      final rawId = newCustomer['id'];
      final customerId = rawId is int ? rawId : int.tryParse(rawId.toString());

      final firstName = (newCustomer['first_name'] ?? '').toString().trim();
      final lastName = (newCustomer['last_name'] ?? '').toString().trim();
      final fullName = '$firstName $lastName'.trim();
      final phone = (newCustomer['phone'] ?? '').toString().trim();
      final email = (newCustomer['email'] ?? '').toString().trim();

      setState(() {
        _selectedCustomerId = customerId;
        _nameController.text = fullName;
        _phoneController.text = phone;
        _emailController.text = email;
        _customerSearchQuery = '';
      });

      // If name or phone was somehow empty, fetch profile as fallback
      if (customerId != null && (fullName.isEmpty || phone.isEmpty)) {
        try {
          final customerData =
              await ref.read(customerProfileProvider(customerId).future);
          if (mounted && customerData.isNotEmpty) {
            setState(() {
              final fName =
                  (customerData['first_name'] ?? '').toString().trim();
              final lName =
                  (customerData['last_name'] ?? '').toString().trim();
              if (_nameController.text.isEmpty) {
                _nameController.text = '$fName $lName'.trim();
              }
              if (_phoneController.text.isEmpty) {
                _phoneController.text =
                    (customerData['phone'] ?? '').toString().trim();
              }
              if (_emailController.text.isEmpty) {
                _emailController.text =
                    (customerData['email'] ?? '').toString().trim();
              }
            });
          }
        } catch (_) {}
      }

      // Show confirmation toast
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded,
                  color: Colors.white, size: 20),
              SizedBox(width: 10.w),
              Expanded(
                child: Text(
                  fullName.isNotEmpty
                      ? '$fullName selected for appointment!'
                      : 'New customer selected for appointment!',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    fontSize: 13.sp,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),
          duration: const Duration(seconds: 3),
        ),
      );

      // Smoothly keep focus on client section
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          FormScrollHelper.scrollTo(_clientSectionKey);
        }
      });
    }
  }

  void _showWarning(String message) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
            SizedBox(width: 10.w),
            Expanded(
              child: Text(
                message,
                style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13.sp),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
      ),
    );
  }

  Future<void> _bookAppointment() async {
    FormScrollHelper.unfocus();

    if (_selectedServiceIds.isEmpty) {
      FormScrollHelper.scrollTo(_serviceSectionKey);
      _showWarning('Please select at least one service');
      return;
    }

    if (_selectedStaffId == null) {
      FormScrollHelper.scrollTo(_staffSectionKey);
      _showWarning('Please select a staff member');
      return;
    }

    if (_selectedDate == null || _selectedTime == null) {
      FormScrollHelper.scrollTo(_dateTimeSectionKey);
      _showWarning('Please select an appointment date & time slot');
      return;
    }

    if (_selectedCustomerId == null) {
      FormScrollHelper.scrollTo(_clientSectionKey);
      _showWarning('Please select or add a client for this booking');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final repository = ref.read(appointmentRepositoryProvider);

      // Calculate total duration for all selected services
      final servicesOpt = ref.read(servicesListProvider).valueOrNull;
      int durationMins = 0;
      if (servicesOpt != null) {
        for (final sId in _selectedServiceIds) {
          final service = servicesOpt.firstWhere(
            (s) => s['id'] == sId,
            orElse: () => {},
          );
          if (service.isNotEmpty) {
            final durStr = service['duration_minutes']?.toString() ??
                service['duration']?.toString() ??
                '30';
            durationMins += int.tryParse(durStr) ?? 30;
          }
        }
      }
      if (durationMins == 0) durationMins = 30;

      final timeParts = _selectedTime!.split(':');
      final startHours = int.parse(timeParts[0]);
      final startMins = int.parse(timeParts[1]);

      final endMinsTotal = (startHours * 60) + startMins + durationMins;
      final endH = (endMinsTotal ~/ 60).toString().padLeft(2, '0');
      final endM = (endMinsTotal % 60).toString().padLeft(2, '0');
      final endTimeStr = '$endH:$endM:00';

      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate!);

      final result = await repository.createAppointment({
        'customer_id': _selectedCustomerId,
        'service_ids': _selectedServiceIds.toList(),
        'service_id': _selectedServiceIds.first,
        'staff_id': _selectedStaffId == 0 ? null : _selectedStaffId,
        'appointment_date': dateStr,
        'start_time': _selectedTime,
        'end_time': endTimeStr,
        'room_number': _selectedRoom,
        'notes': _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : null,
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Appointment booked successfully!')),
      );

      // Refresh providers
      ref.invalidate(bookedSlotsProvider);
      ref.invalidate(monthlyAppointmentsProvider);
      ref.invalidate(appointmentsListProvider);
      ref.invalidate(appointmentStatsProvider);

      if (mounted) {
        context.go('/appointments');
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error booking appointment: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildStepper() {
    final activeStep = _calculateCurrentStep();
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 24.h),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final stepWidth = constraints.maxWidth / 5;
          return Stack(
            alignment: Alignment.topCenter,
            children: [
              // Background line
              Positioned(
                left: stepWidth / 2,
                right: stepWidth / 2,
                top: 15.h,
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 2.h,
                        color: (_isStepCompleted(1) && _isStepCompleted(2))
                            ? const Color(0xFFE91E63)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    Expanded(
                      child: Container(
                        height: 2.h,
                        color: (_isStepCompleted(2) && _isStepCompleted(3))
                            ? const Color(0xFFE91E63)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    Expanded(
                      child: Container(
                        height: 2.h,
                        color: (_isStepCompleted(3) && _isStepCompleted(4))
                            ? const Color(0xFFE91E63)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    Expanded(
                      child: Container(
                        height: 2.h,
                        color: (_isStepCompleted(4) && _isStepCompleted(5))
                            ? const Color(0xFFE91E63)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _buildStepIndicator(
                      '1',
                      'Select Service',
                      activeStep == 1,
                      _isStepCompleted(1),
                    ),
                  ),
                  Expanded(
                    child: _buildStepIndicator(
                      '2',
                      'Choose Staff',
                      activeStep == 2,
                      _isStepCompleted(2),
                    ),
                  ),
                  Expanded(
                    child: _buildStepIndicator(
                      '3',
                      'Date & Time',
                      activeStep == 3,
                      _isStepCompleted(3),
                    ),
                  ),
                  Expanded(
                    child: _buildStepIndicator(
                      '4',
                      'Client',
                      activeStep == 4,
                      _isStepCompleted(4),
                    ),
                  ),
                  Expanded(
                    child: _buildStepIndicator(
                      '5',
                      'Confirm',
                      activeStep == 5,
                      _isStepCompleted(5),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStepIndicator(
    String number,
    String label,
    bool isActive,
    bool isCompleted,
  ) {
    return Column(
      children: [
        Container(
          width: 32.w,
          height: 32.h,
          decoration: BoxDecoration(
            color: isCompleted ? const Color(0xFFE91E63) : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(
              color: isCompleted || isActive
                  ? const Color(0xFFE91E63)
                  : const Color(0xFFCBD5E1),
              width: 2.w,
            ),
          ),
          child: Center(
            child: isCompleted
                ? Icon(Icons.check_rounded, color: Colors.white, size: 18.sp)
                : Text(
                    number,
                    style: GoogleFonts.inter(
                      color: isActive
                          ? const Color(0xFFE91E63)
                          : const Color(0xFF94A3B8),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
        SizedBox(height: 8.h),
        Text(
          label,
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.inter(
            fontSize: 10.sp,
            fontWeight: isActive || isCompleted
                ? FontWeight.bold
                : FontWeight.w500,
            color: isActive || isCompleted
                ? const Color(0xFFE91E63)
                : const Color(0xFF94A3B8),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(
    String number,
    String title,
    String subtitle, {
    VoidCallback? onViewAll,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Row(
              children: [
                Container(
                  width: 36.w,
                  height: 36.h,
                  decoration: const BoxDecoration(
                    color: Color(0xFFE91E63),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      number,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16.sp,
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.poppins(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1A1A2E),
                        ),
                      ),
                      Text(
                        subtitle,
                        style: GoogleFonts.inter(
                          fontSize: 12.sp,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (onViewAll != null) ...[
            SizedBox(width: 8.w),
            InkWell(
              onTap: onViewAll,
              borderRadius: BorderRadius.circular(8.r),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                child: Row(
                  children: [
                    Text(
                      'Search All',
                      style: GoogleFonts.inter(
                        color: const Color(0xFFE91E63),
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(width: 4.w),
                    Icon(
                      Icons.search_rounded,
                      color: const Color(0xFFE91E63),
                      size: 14.sp,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCategoryTabs() {
    final categoriesAsync = ref.watch(categoriesListProvider);

    return categoriesAsync.when(
      loading: () => SizedBox(height: 50.h, child: SkeletonList()),
      error: (err, stack) =>
          Text('Error loading categories', style: GoogleFonts.inter()),
      data: (categories) {
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildCategoryTab(
                0,
                'All Services',
                null,
                _selectedCategoryId == 0,
              ),
              ...categories.map((cat) {
                // Try to infer an icon or just use a default one
                IconData icon = Icons.spa_rounded;
                final name = cat['name'].toString().toLowerCase();
                if (name.contains('hair'))
                  icon = Icons.face_retouching_natural_rounded;
                if (name.contains('makeup')) icon = Icons.brush_rounded;
                if (name.contains('nail')) icon = Icons.pan_tool_rounded;

                return _buildCategoryTab(
                  cat['id'],
                  cat['name'],
                  icon,
                  _selectedCategoryId == cat['id'],
                );
              }).toList(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCategoryTab(
    int id,
    String label,
    IconData? icon,
    bool isActive,
  ) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategoryId = id;
        });
      },
      child: Container(
        margin: EdgeInsets.only(right: 12.w),
        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 12.h),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFE91E63) : Colors.white,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: isActive ? Colors.transparent : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 16.sp,
                color: isActive ? Colors.white : const Color(0xFF64748B),
              ),
              SizedBox(width: 8.w),
            ],
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13.sp,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                color: isActive ? Colors.white : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectedServicesSummary() {
    if (_selectedServiceIds.isEmpty) return const SizedBox.shrink();

    final servicesOpt = ref.watch(servicesListProvider).valueOrNull ?? [];
    final selectedList = servicesOpt
        .where((s) => _selectedServiceIds.contains(s['id']))
        .toList();
    if (selectedList.isEmpty) return const SizedBox.shrink();

    final totalMins = selectedList.fold<int>(
      0,
      (sum, s) {
        final dStr = s['duration_minutes']?.toString() ??
            s['duration']?.toString() ??
            '30';
        return sum + (int.tryParse(dStr) ?? 30);
      },
    );
    final totalPrice = selectedList.fold<double>(
      0.0,
      (sum, s) {
        final pStr = s['price']?.toString() ?? '0';
        return sum + (double.tryParse(pStr) ?? 0.0);
      },
    );
    final formattedPrice = totalPrice == totalPrice.roundToDouble()
        ? totalPrice.toInt().toString()
        : totalPrice.toStringAsFixed(2);

    return Container(
      margin: EdgeInsets.only(bottom: 16.h),
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: const Color(0xFFFDF2F8),
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: const Color(0xFFFCE7F3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE91E63),
                      borderRadius: BorderRadius.circular(10.r),
                    ),
                    child: Text(
                      '${selectedList.length} Selected',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  SizedBox(width: 8.w),
                  Text(
                    '₹ $formattedPrice • $totalMins mins total',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF1A1A2E),
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedServiceIds.clear();
                    _selectedTime = null;
                  });
                },
                child: Text(
                  'Clear all',
                  style: GoogleFonts.inter(
                    color: const Color(0xFFE91E63),
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 10.h),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: selectedList.map((service) {
                return Container(
                  margin: EdgeInsets.only(right: 8.w),
                  padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 6.h),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20.r),
                    border: Border.all(
                      color: const Color(0xFFE91E63).withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        service['name'] ?? 'Service',
                        style: GoogleFonts.inter(
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1A1A2E),
                        ),
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        '₹${service['price'] ?? 0}',
                        style: GoogleFonts.poppins(
                          fontSize: 11.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFFE91E63),
                        ),
                      ),
                      SizedBox(width: 6.w),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedServiceIds.remove(service['id']);
                            _selectedTime = null;
                          });
                        },
                        child: Icon(
                          Icons.cancel_rounded,
                          size: 16.sp,
                          color: const Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServicesGrid() {
    final servicesAsync = ref.watch(servicesListProvider);

    return servicesAsync.when(
      loading: () => SizedBox(height: 100.h, child: SkeletonList()),
      error: (err, stack) =>
          Text('Error loading services', style: GoogleFonts.inter()),
      data: (services) {
        final activeServices = services
            .where((s) => s['is_active'] != false && s['is_active'] != 0)
            .toList();
        final filteredServices = _selectedCategoryId == 0
            ? activeServices
            : activeServices
                  .where((s) => s['category_id'] == _selectedCategoryId)
                  .toList();

        if (filteredServices.isEmpty) {
          return Padding(
            padding: EdgeInsets.all(24.0.w),
            child: Center(
              child: Text(
                'No services found in this category.',
                style: GoogleFonts.inter(color: const Color(0xFF64748B)),
              ),
            ),
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSelectedServicesSummary(),
            SingleChildScrollView(
              controller: _servicesScrollController,
              scrollDirection: Axis.horizontal,
              child: Row(
                children: filteredServices.map((service) {
                  return _buildServiceCard(
                    service['id'],
                    service['name'] ?? 'Unknown',
                    '${service['duration_minutes'] ?? 0} mins',
                    '₹ ${service['price'] ?? 0}',
                    service['image_url'] ?? 'assets/images/service_haircut.jpg',
                  );
                }).toList(),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildServiceCard(
    int id,
    String title,
    String duration,
    String price,
    String imgPath,
  ) {
    final isSelected = _selectedServiceIds.contains(id);
    return GestureDetector(
      onTap: () {
        setState(() {
          if (_selectedServiceIds.contains(id)) {
            _selectedServiceIds.remove(id);
          } else {
            _selectedServiceIds.add(id);
          }
          _selectedTime = null;
        });
      },
      child: Container(
        width: 260.w,
        margin: EdgeInsets.only(right: 16.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16.r),
          border: Border.all(
            color: isSelected
                ? const Color(0xFFE91E63)
                : const Color(0xFFF1F5F9),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFFE91E63).withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(15.r),
                bottomLeft: Radius.circular(15.r),
              ),
              child: Builder(
                builder: (context) {
                  final rawUrl = imgPath.split(',').first.trim();
                  final fullUrl = rawUrl.startsWith('/')
                      ? '$kBaseMediaUrl$rawUrl'
                      : rawUrl;
                  
                  return rawUrl.isNotEmpty && (rawUrl.startsWith('http') || rawUrl.startsWith('/'))
                      ? Image.network(
                          fullUrl,
                          width: 80.w,
                          height: 80.h,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Image.asset(
                            'assets/images/service_haircut.jpg',
                            width: 80.w,
                            height: 80.h,
                            fit: BoxFit.cover,
                          ),
                        )
                      : Image.asset(
                          rawUrl.isEmpty ? 'assets/images/service_haircut.jpg' : rawUrl,
                          width: 80.w,
                          height: 80.h,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Image.asset(
                            'assets/images/service_haircut.jpg',
                            width: 80.w,
                            height: 80.h,
                            fit: BoxFit.cover,
                          ),
                        );
                }
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 13.sp,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1A1A2E),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    duration,
                    style: GoogleFonts.inter(
                      fontSize: 11.sp,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    price,
                    style: GoogleFonts.poppins(
                      fontSize: 14.sp,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1A1A2E),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: EdgeInsets.all(12.w),
              child: Icon(
                isSelected
                    ? Icons.check_circle_rounded
                    : Icons.radio_button_unchecked_rounded,
                color: isSelected
                    ? const Color(0xFFE91E63)
                    : const Color(0xFFCBD5E1),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStaffList() {
    final staffAsync = ref.watch(activeStaffListProvider);

    return staffAsync.when(
      loading: () => SizedBox(height: 100.h, child: SkeletonList()),
      error: (err, stack) =>
          Text('Error loading staff', style: GoogleFonts.inter()),
      data: (staffList) {
        if (staffList.isEmpty) {
          return Padding(
            padding: EdgeInsets.all(16.0.w),
            child: Text('No staff members available'),
          );
        }

        return SingleChildScrollView(
          controller: _staffScrollController,
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildStaffCard(
                0,
                'Not Decided Yet',
                'Any Available Staff',
                '',
                '',
                '',
              ),
              ...staffList.map((staff) {
                return _buildStaffCard(
                  staff['id'],
                  '${staff['first_name']} ${staff['last_name']}',
                  staff['role'] ?? 'Specialist',
                  '4.8', // Mocked rating as it might not be in backend
                  '(100)', // Mocked reviews count
                  (staff['avatar_url'] ?? staff['profile_image_url'] ?? staff['image_url'] ?? staff['profile_image'])?.toString() ?? '',
                );
              }).toList(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStaffCard(
    int id,
    String name,
    String role,
    String rating,
    String reviews,
    String imgPath,
  ) {
    final isSelected = _selectedStaffId == id;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedStaffId = id;
          _selectedTime = null; // Reset time slot when staff changes
        });
      },
      child: Container(
        width: 240.w,
        margin: EdgeInsets.only(right: 16.w),
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16.r),
          border: Border.all(
            color: isSelected
                ? const Color(0xFFE91E63)
                : const Color(0xFFF1F5F9),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Stack(
              children: [
                if (id == 0)
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: const Color(0xFFF8FAFC),
                    child: Icon(
                      Icons.people_alt_rounded,
                      color: const Color(0xFF94A3B8),
                      size: 24.sp,
                    ),
                  )
                else
                  Builder(
                    builder: (context) {
                      final rawUrl = imgPath.split(',').first.trim();
                      final fullUrl = rawUrl.startsWith('/')
                          ? '$kBaseMediaUrl$rawUrl'
                          : rawUrl;
                      
                      return ClipOval(
                        child: rawUrl.isNotEmpty && (rawUrl.startsWith('http') || rawUrl.startsWith('/'))
                            ? Image.network(
                                fullUrl,
                                width: 48,
                                height: 48,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => Image.asset(
                                  'assets/images/customer_profile_avatar.jpg',
                                  width: 48,
                                  height: 48,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : Image.asset(
                                rawUrl.isEmpty ? 'assets/images/customer_profile_avatar.jpg' : rawUrl,
                                width: 48,
                                height: 48,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => Image.asset(
                                  'assets/images/customer_profile_avatar.jpg',
                                  width: 48,
                                  height: 48,
                                  fit: BoxFit.cover,
                                ),
                              ),
                      );
                    }
                  ),
                if (isSelected)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.check_circle_rounded,
                        color: Color(0xFFE91E63),
                        size: 16.sp,
                      ),
                    ),
                  ),
              ],
            ),
            SizedBox(width: 12.w),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  name,
                  style: GoogleFonts.inter(
                    fontSize: 14.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1A1A2E),
                  ),
                ),
                Text(
                  role,
                  style: GoogleFonts.inter(
                    fontSize: 11.sp,
                    color: const Color(0xFF64748B),
                  ),
                ),
                if (id != 0) ...[
                  SizedBox(height: 4.h),
                  Row(
                    children: [
                      Icon(
                        Icons.star_rounded,
                        color: Color(0xFFF59E0B),
                        size: 14.sp,
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        rating,
                        style: GoogleFonts.inter(
                          fontSize: 11.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFFF59E0B),
                        ),
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        reviews,
                        style: GoogleFonts.inter(
                          fontSize: 11.sp,
                          color: const Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  SizedBox(height: 4.h),
                  SizedBox(height: 14.sp),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateAndTimeSelection() {
    final settingsAsync = ref.watch(settingsDataProvider);
    final settingsMap = (settingsAsync.value?['settings'] as Map<String, dynamic>?) ?? {};
    final startTimeStr = settingsMap['working_hours_start'] ?? '09:00:00';
    final endTimeStr = settingsMap['working_hours_end'] ?? '21:00:00';
    final slotDuration = int.tryParse(settingsMap['appointment_slot_duration']?.toString() ?? '30') ?? 30;
    final advanceDays = int.tryParse(settingsMap['booking_advance_days']?.toString() ?? '30') ?? 30;
    final weeklyOffDay = int.tryParse(settingsMap['weekly_off_day']?.toString() ?? '1') ?? 1;

    final int daysCount = advanceDays.clamp(7, 60);
    final List<DateTime> nextDays = List.generate(
      daysCount,
      (i) => _baseDate.add(Duration(days: i)),
    );
    final currentMonthYear = DateFormat('MMMM yyyy').format(_baseDate);

    // Dynamic time slots based on salon operating hours and slot duration
    final List<String> availableSlots = [];
    try {
      final startParts = startTimeStr.toString().split(':');
      final endParts = endTimeStr.toString().split(':');
      int curMins = (int.tryParse(startParts[0]) ?? 9) * 60 + (startParts.length > 1 ? (int.tryParse(startParts[1]) ?? 0) : 0);
      final endMins = (int.tryParse(endParts[0]) ?? 21) * 60 + (endParts.length > 1 ? (int.tryParse(endParts[1]) ?? 0) : 0);
      while (curMins + slotDuration <= endMins) {
        final h = (curMins ~/ 60).toString().padLeft(2, '0');
        final m = (curMins % 60).toString().padLeft(2, '0');
        availableSlots.add('$h:$m:00');
        curMins += slotDuration;
      }
    } catch (_) {}
    if (availableSlots.isEmpty) {
      availableSlots.addAll([
        '09:00:00',
        '10:00:00',
        '11:00:00',
        '12:00:00',
        '13:00:00',
        '14:00:00',
        '15:00:00',
        '16:00:00',
        '17:00:00',
        '18:00:00',
      ]);
    }

    final bool isWeeklyOff = _selectedDate != null && (_selectedDate!.weekday % 7) == weeklyOffDay;

    // Function to format time for UI display
    String formatTime(String timeStr) {
      final parts = timeStr.split(':');
      if (parts.length >= 2) {
        final hour = int.parse(parts[0]);
        final minute = parts[1];
        final period = hour >= 12 ? 'PM' : 'AM';
        final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
        return '${displayHour.toString().padLeft(2, '0')}:$minute $period';
      }
      return timeStr;
    }

    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                currentMonthYear,
                style: GoogleFonts.inter(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1A1A2E),
                ),
              ),
              Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      if (_baseDate.isAfter(
                        DateTime.now().subtract(const Duration(days: 1)),
                      )) {
                        setState(
                          () => _baseDate = _baseDate.subtract(
                            const Duration(days: 7),
                          ),
                        );
                      }
                    },
                    child: const Icon(
                      Icons.keyboard_arrow_left_rounded,
                      color: Color(0xFF1A1A2E),
                    ),
                  ),
                  SizedBox(width: 16.w),
                  GestureDetector(
                    onTap: () => setState(
                      () => _baseDate = _baseDate.add(const Duration(days: 7)),
                    ),
                    child: const Icon(
                      Icons.keyboard_arrow_right_rounded,
                      color: Color(0xFF1A1A2E),
                    ),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 16.h),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: nextDays.map((date) {
                return _buildDateItem(date);
              }).toList(),
            ),
          ),
          if (isWeeklyOff) ...[
            SizedBox(height: 12.h),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(10.r),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.amber.shade900, size: 18.sp),
                  SizedBox(width: 8.w),
                  Expanded(
                    child: Text(
                      'Note: Selected date is the salon\'s weekly off day.',
                      style: GoogleFonts.inter(fontSize: 12.sp, color: Colors.amber.shade900, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
          ],
          Padding(
            padding: EdgeInsets.symmetric(vertical: 20.h),
            child: const Divider(color: Color(0xFFF1F5F9)),
          ),

          if (_selectedDate == null)
            Center(
              child: Text(
                'Please select a date to view available slots',
                style: GoogleFonts.inter(color: const Color(0xFF64748B)),
              ),
            ),

          if (_selectedDate != null && _selectedStaffId != null) ...[
            Consumer(
              builder: (context, ref, child) {
                final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate!);
                final query = (date: dateStr, staffId: _selectedStaffId!);
                final bookedSlotsAsync = ref.watch(bookedSlotsProvider(query));

                return bookedSlotsAsync.when(
                  loading: () => SizedBox(height: 100.h, child: const SkeletonList()),
                  error: (err, stack) => Text(
                    'Failed to load slots',
                    style: GoogleFonts.inter(color: Colors.red),
                  ),
                  data: (bookedSlots) {
                    final items = <Widget>[
                      ...availableSlots.map((time) {
                        final isBooked = bookedSlots.contains(time);
                        return _buildTimeItem(time, formatTime(time), isBooked);
                      }),
                      _buildCustomTimeButton(availableSlots, formatTime),
                    ];

                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        mainAxisSpacing: 12.h,
                        crossAxisSpacing: 12.w,
                        childAspectRatio: 2.5,
                      ),
                      itemCount: items.length,
                      itemBuilder: (context, index) => items[index],
                    );
                  },
                );
              },
            ),
            SizedBox(height: 16.h),
            Consumer(
              builder: (context, ref, _) {
                final roomsAsync = ref.watch(roomsProvider);
                final rooms = roomsAsync.value ?? [];
                if (rooms.isEmpty) return const SizedBox.shrink();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Service Room / Station (Optional)',
                      style: GoogleFonts.inter(
                        fontSize: 13.sp,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1A1A2E),
                      ),
                    ),
                    SizedBox(height: 8.h),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedRoom,
                      decoration: InputDecoration(
                        hintText: 'Select Room / Station',
                        prefixIcon: const Icon(Icons.meeting_room_outlined),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r)),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                      ),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('Any Available Chair')),
                        ...rooms.map((r) => DropdownMenuItem(
                              value: r['name'].toString(),
                              child: Text('${r['name']} (Cap: ${r['capacity'] ?? 1})'),
                            )),
                      ],
                      onChanged: (val) => setState(() => _selectedRoom = val),
                    ),
                  ],
                );
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDateItem(DateTime date) {
    // Check if _selectedDate matches this date ignoring time
    final isSelected =
        _selectedDate != null &&
        _selectedDate!.year == date.year &&
        _selectedDate!.month == date.month &&
        _selectedDate!.day == date.day;

    final dayStr = DateFormat('E').format(date); // Mon, Tue...
    final dateStr = DateFormat('d').format(date); // 1, 2...

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedDate = date;
          _selectedTime = null; // reset time on date change
        });
      },
      child: Container(
        margin: EdgeInsets.only(right: 8.w),
        padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 16.w),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE91E63) : Colors.transparent,
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Column(
          children: [
            Text(
              dayStr,
              style: GoogleFonts.inter(
                fontSize: 12.sp,
                color: isSelected ? Colors.white : const Color(0xFF64748B),
              ),
            ),
            SizedBox(height: 8.h),
            Text(
              dateStr,
              style: GoogleFonts.inter(
                fontSize: 16.sp,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : const Color(0xFF1A1A2E),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeItem(String timeValue, String displayTime, bool isBooked) {
    final isSelected = _selectedTime == timeValue;
    return GestureDetector(
      onTap: isBooked ? null : () => setState(() => _selectedTime = timeValue),
      child: Container(
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFE91E63)
              : (isBooked ? const Color(0xFFE2E8F0) : const Color(0xFFF8FAFC)),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Center(
          child: Text(
            displayTime,
            style: GoogleFonts.inter(
              fontSize: 13.sp,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              color: isSelected
                  ? Colors.white
                  : (isBooked
                        ? const Color(0xFF94A3B8)
                        : const Color(0xFF64748B)),
              decoration: isBooked ? TextDecoration.lineThrough : null,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCustomTimeButton(
    List<String> availableSlots,
    String Function(String) formatTime,
  ) {
    final isCustomSelected =
        _selectedTime != null && !availableSlots.contains(_selectedTime);
    final displayStr = isCustomSelected ? formatTime(_selectedTime!) : 'Custom';

    return GestureDetector(
      onTap: () async {
        final time = await showTimePicker(
          context: context,
          initialTime: TimeOfDay.now(),
          builder: (context, child) {
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.light(
                  primary: Color(0xFFE91E63), // Pink brand color
                  onPrimary: Colors.white,
                  surface: Colors.white,
                  onSurface: Color(0xFF1A1A2E),
                ),
                textButtonTheme: TextButtonThemeData(
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFE91E63),
                  ),
                ),
              ),
              child: child!,
            );
          },
        );
        if (time != null) {
          final customTimeStr =
              '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}:00';
          setState(() {
            _selectedTime = customTimeStr;
          });
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: isCustomSelected ? const Color(0xFFE91E63) : Colors.white,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: const Color(0xFFE91E63), width: 1.5),
        ),
        child: Center(
          child: Text(
            displayStr,
            style: GoogleFonts.inter(
              fontSize: 13.sp,
              fontWeight: FontWeight.bold,
              color: isCustomSelected ? Colors.white : const Color(0xFFE91E63),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildYourDetailsForm() {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Customer Selection / Creation Toggle
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Select Customer',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1A1A2E),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (_selectedCustomerId == null)
                TextButton.icon(
                  onPressed: _navigateToAddCustomer,
                  icon: Icon(Icons.person_add_rounded, size: 18.sp),
                  label: Text('Add New', style: TextStyle(fontSize: 13.sp)),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFFE91E63),
                    textStyle: GoogleFonts.inter(fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          SizedBox(height: 16.h),

          if (_selectedCustomerId != null) ...[
            // Show selected customer
            Container(
              padding: EdgeInsets.all(16.w),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFF0F5), Colors.white],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16.r),
                border: Border.all(color: const Color(0xFFFCE7F3), width: 2),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFE91E63).withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 24.r,
                    backgroundColor: const Color(0xFFE91E63).withOpacity(0.1),
                    child: Icon(
                      Icons.person_rounded,
                      color: const Color(0xFFE91E63),
                      size: 24.sp,
                    ),
                  ),
                  SizedBox(width: 16.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _nameController.text,
                          style: GoogleFonts.poppins(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1A1A2E),
                          ),
                        ),
                        SizedBox(height: 4.h),
                        if (_phoneController.text.isNotEmpty)
                          Text(
                            _phoneController.text,
                            style: GoogleFonts.inter(
                              fontSize: 13.sp,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      Icons.close_rounded,
                      color: const Color(0xFF94A3B8),
                    ),
                    onPressed: () {
                      setState(() {
                        _selectedCustomerId = null;
                        _customerSearchQuery = '';
                        _nameController.clear();
                        _phoneController.clear();
                        _emailController.clear();
                      });
                    },
                  ),
                ],
              ),
            ),
          ] else ...[
            // Search Customer
            TextField(
              onChanged: (val) => setState(() => _customerSearchQuery = val),
              style: GoogleFonts.inter(
                fontSize: 14.sp,
                color: const Color(0xFF1A1A2E),
                fontWeight: FontWeight.w500,
              ),
              decoration: InputDecoration(
                hintText: 'Search name or mobile...',
                hintStyle: GoogleFonts.inter(
                  fontSize: 14.sp,
                  color: const Color(0xFF94A3B8),
                ),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: const Color(0xFF94A3B8),
                  size: 20.sp,
                ),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: EdgeInsets.symmetric(
                  vertical: 16.h,
                  horizontal: 16.w,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                  borderSide: const BorderSide(
                    color: Color(0xFFE91E63),
                    width: 1.5,
                  ),
                ),
              ),
            ),

            // Dropdown results
            if (_customerSearchQuery.isNotEmpty)
              Consumer(
                builder: (context, ref, child) {
                  final customersAsync = ref.watch(
                    customersListProvider(_customerSearchQuery),
                  );

                  return customersAsync.when(
                    loading: () => Padding(
                      padding: EdgeInsets.all(16.w),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (e, s) => Padding(
                      padding: EdgeInsets.all(16.w),
                      child: Text(
                        'Error loading customers',
                        style: GoogleFonts.inter(color: Colors.red),
                      ),
                    ),
                    data: (customers) {
                      if (customers.isEmpty) {
                        return Container(
                          margin: EdgeInsets.only(top: 8.h),
                          padding: EdgeInsets.symmetric(
                            horizontal: 16.w,
                            vertical: 14.h,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16.r),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.person_search_rounded,
                                    color: const Color(0xFF94A3B8),
                                    size: 22.sp,
                                  ),
                                  SizedBox(width: 10.w),
                                  Expanded(
                                    child: Text(
                                      'No customer found matching "$_customerSearchQuery"',
                                      style: GoogleFonts.inter(
                                        color: const Color(0xFF64748B),
                                        fontSize: 13.sp,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 12.h),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _navigateToAddCustomer,
                                  icon: Icon(
                                    Icons.person_add_rounded,
                                    size: 16.sp,
                                    color: Colors.white,
                                  ),
                                  label: Text(
                                    'Create New Customer',
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13.sp,
                                      color: Colors.white,
                                    ),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFE91E63),
                                    foregroundColor: Colors.white,
                                    padding: EdgeInsets.symmetric(
                                      vertical: 12.h,
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
                        );
                      }

                      return Container(
                        margin: EdgeInsets.only(top: 8.h),
                        constraints: const BoxConstraints(maxHeight: 200),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16.r),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: customers.length,
                          separatorBuilder: (c, i) =>
                              Divider(height: 1.h, color: Color(0xFFF1F5F9)),
                          itemBuilder: (context, index) {
                            final customer = customers[index];
                            final name =
                                '${customer['first_name']} ${customer['last_name'] ?? ''}'
                                    .trim();
                            return ListTile(
                              title: Text(
                                name,
                                style: GoogleFonts.inter(
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              subtitle: customer['phone'] != null
                                  ? Text(
                                      customer['phone'],
                                      style: GoogleFonts.inter(fontSize: 12.sp),
                                    )
                                  : null,
                              onTap: () {
                                setState(() {
                                  _selectedCustomerId = customer['id'];
                                  _nameController.text = name;
                                  _phoneController.text =
                                      customer['phone'] ?? '';
                                  _emailController.text =
                                      customer['email'] ?? '';
                                  _customerSearchQuery = '';
                                });
                              },
                            );
                          },
                        ),
                      );
                    },
                  );
                },
              ),
          ],

          Padding(
            padding: EdgeInsets.symmetric(vertical: 12.h),
            child: Divider(color: Color(0xFFF1F5F9)),
          ),
          _buildTextField(
            Icons.local_offer_outlined,
            'Additional Notes (Optional)',
            'Any specific requests?',
            _notesController,
            isMultiline: true,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(
    IconData icon,
    String label,
    String hint,
    TextEditingController controller, {
    bool isMultiline = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13.sp,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1A1A2E),
          ),
        ),
        SizedBox(height: 8.h),
        TextField(
          controller: controller,
          maxLines: isMultiline ? 3 : 1,
          style: GoogleFonts.inter(
            fontSize: 14.sp,
            color: const Color(0xFF1A1A2E),
            fontWeight: FontWeight.w500,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(
              fontSize: 14.sp,
              color: const Color(0xFF94A3B8),
            ),
            prefixIcon: isMultiline
                ? Padding(
                    padding: EdgeInsets.only(bottom: 40.h),
                    child: Icon(
                      icon,
                      color: const Color(0xFF94A3B8),
                      size: 20.sp,
                    ),
                  )
                : Icon(icon, color: const Color(0xFF94A3B8), size: 20.sp),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: EdgeInsets.symmetric(
              vertical: 16.h,
              horizontal: 16.w,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: const BorderSide(
                color: Color(0xFFE91E63),
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildConfirmCard() {
    final isSmallScreen = MediaQuery.of(context).size.width < 800;

    // Fetch details safely
    String serviceName = 'Select a service';
    String serviceDetails = '';
    String staffName = 'Select staff';
    String staffRole = '';

    if (_selectedServiceIds.isNotEmpty) {
      final servicesOpt = ref.read(servicesListProvider).valueOrNull;
      if (servicesOpt != null) {
        final selectedList = servicesOpt
            .where((s) => _selectedServiceIds.contains(s['id']))
            .toList();
        if (selectedList.isNotEmpty) {
          final totalMins = selectedList.fold<int>(
            0,
            (sum, s) {
              final dStr = s['duration_minutes']?.toString() ??
                  s['duration']?.toString() ??
                  '30';
              return sum + (int.tryParse(dStr) ?? 30);
            },
          );
          final totalPrice = selectedList.fold<double>(
            0.0,
            (sum, s) {
              final pStr = s['price']?.toString() ?? '0';
              return sum + (double.tryParse(pStr) ?? 0.0);
            },
          );
          final formattedPrice = totalPrice == totalPrice.roundToDouble()
              ? totalPrice.toInt().toString()
              : totalPrice.toStringAsFixed(2);
          if (selectedList.length == 1) {
            serviceName = selectedList.first['name'] ?? serviceName;
            serviceDetails = '$totalMins mins | ₹ $formattedPrice';
          } else {
            serviceName = '${selectedList.first['name']} (+${selectedList.length - 1} more)';
            serviceDetails = '${selectedList.length} services • $totalMins mins total | ₹ $formattedPrice';
          }
        }
      }
    }

    if (_selectedStaffId != null) {
      if (_selectedStaffId == 0) {
        staffName = 'Any Available Staff';
        staffRole = 'Not Decided Yet';
      } else {
        final staffOpt = ref.read(staffListProvider).valueOrNull;
        if (staffOpt != null) {
          final staff = staffOpt.firstWhere(
            (s) => s['id'] == _selectedStaffId,
            orElse: () => {},
          );
          if (staff.isNotEmpty) {
            staffName = 'With ${staff['first_name']}';
            staffRole = staff['role'] ?? 'Specialist';
          }
        }
      }
    }

    final dateDisplay = _selectedDate != null
        ? DateFormat('d MMM yyyy').format(_selectedDate!)
        : 'Select date';
    final timeDisplay = _selectedTime ?? 'Select time';

    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: isSmallScreen
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildConfirmDetail(
                  Icons.edit_outlined,
                  serviceName,
                  serviceDetails,
                ),
                Divider(height: 32.h, color: Color(0xFFF1F5F9)),
                _buildConfirmDetail(
                  Icons.calendar_month_outlined,
                  dateDisplay,
                  timeDisplay,
                ),
                Divider(height: 32.h, color: Color(0xFFF1F5F9)),
                _buildConfirmDetail(
                  Icons.person_outline_rounded,
                  staffName,
                  staffRole,
                ),
                SizedBox(height: 24.h),
                ElevatedButton(
                  onPressed: _isLoading ? null : _bookAppointment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE91E63),
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: 16.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? SizedBox(
                          height: 20.h,
                          width: 20.w,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Book Appointment',
                              style: GoogleFonts.inter(
                                fontSize: 14.sp,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(width: 8.w),
                            Icon(Icons.arrow_forward_rounded, size: 18.sp),
                          ],
                        ),
                ),
              ],
            )
          : Row(
              children: [
                Expanded(
                  child: _buildConfirmDetail(
                    Icons.edit_outlined,
                    serviceName,
                    serviceDetails,
                  ),
                ),
                Container(
                  width: 1.w,
                  height: 40.h,
                  color: const Color(0xFFF1F5F9),
                ),
                Expanded(
                  child: _buildConfirmDetail(
                    Icons.calendar_month_outlined,
                    dateDisplay,
                    timeDisplay,
                  ),
                ),
                Container(
                  width: 1.w,
                  height: 40.h,
                  color: const Color(0xFFF1F5F9),
                ),
                Expanded(
                  child: _buildConfirmDetail(
                    Icons.person_outline_rounded,
                    staffName,
                    staffRole,
                  ),
                ),
                SizedBox(width: 20.w),
                ElevatedButton(
                  onPressed: _isLoading ? null : _bookAppointment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE91E63),
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(
                      horizontal: 24.w,
                      vertical: 16.h,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? SizedBox(
                          height: 20.h,
                          width: 20.w,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Row(
                          children: [
                            Text(
                              'Book Appointment',
                              style: GoogleFonts.inter(
                                fontSize: 14.sp,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(width: 8.w),
                            Icon(Icons.arrow_forward_rounded, size: 18.sp),
                          ],
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildConfirmDetail(IconData icon, String title, String subtitle) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF64748B), size: 24.sp),
          SizedBox(width: 12.w),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 13.sp,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1A1A2E),
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                subtitle,
                style: GoogleFonts.inter(
                  fontSize: 11.sp,
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showServicesPopup() {
    FormScrollHelper.unfocus();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final servicesAsync = ref.watch(servicesListProvider);
            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24.r),
                  topRight: Radius.circular(24.r),
                ),
              ),
              child: Column(
                children: [
                  // Header
                  Padding(
                    padding: EdgeInsets.all(20.w),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Select Service',
                          style: GoogleFonts.poppins(
                            fontSize: 20.sp,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () => context.pop(),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                  ),
                  // Search Bar
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20.w),
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Search services...',
                        prefixIcon: const Icon(
                          Icons.search_rounded,
                          color: Colors.grey,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12.r),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onChanged: (value) {
                        setModalState(() {
                          _searchQuery = value;
                        });
                      },
                    ),
                  ),
                  SizedBox(height: 16.h),
                  // Services List
                  Expanded(
                    child: servicesAsync.when(
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (e, s) =>
                          const Center(child: Text('Error loading services')),
                      data: (servicesList) {
                        final query = _searchQuery.toLowerCase();
                        final filtered = servicesList.where((s) {
                          final name = (s['name'] ?? '').toString().toLowerCase();
                          return name.contains(query);
                        }).toList();
                        if (filtered.isEmpty) {
                          return Center(
                            child: Text(
                              'No services found.',
                              style: GoogleFonts.inter(color: Colors.grey),
                            ),
                          );
                        }
                        return ListView.builder(
                          padding: EdgeInsets.fromLTRB(
                            20.w,
                            0,
                            20.w,
                            16.h,
                          ),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final service = filtered[index];
                            final id = service['id'];
                            final isSelected = _selectedServiceIds.contains(id);
                            final name = service['name'] ?? 'Service';
                            final price = service['price'] != null ? '₹${service['price']}' : '';
                            final duration = service['duration_minutes'] != null ? '${service['duration_minutes']} min' : '';
                            return Padding(
                              padding: EdgeInsets.only(bottom: 12.h),
                              child: ListTile(
                                onTap: () {
                                  setModalState(() {
                                    if (_selectedServiceIds.contains(id)) {
                                      _selectedServiceIds.remove(id);
                                    } else {
                                      _selectedServiceIds.add(id);
                                    }
                                  });
                                  setState(() {
                                    _selectedTime = null;
                                  });
                                },
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12.r),
                                  side: BorderSide(
                                    color: isSelected
                                        ? const Color(0xFFE91E63)
                                        : const Color(0xFFF1F5F9),
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                tileColor: isSelected
                                    ? const Color(0xFFFCE7F3)
                                    : Colors.white,
                                title: Text(
                                  name,
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                subtitle: Text(
                                  duration.isNotEmpty ? '$duration • $price' : price,
                                  style: GoogleFonts.inter(
                                    color: const Color(0xFF64748B),
                                    fontSize: 12.sp,
                                  ),
                                ),
                                trailing: isSelected
                                    ? const Icon(
                                        Icons.check_circle_rounded,
                                        color: Color(0xFFE91E63),
                                      )
                                    : const Icon(
                                        Icons.radio_button_unchecked_rounded,
                                        color: Color(0xFFCBD5E1),
                                      ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                  // Bottom Sticky Done / Confirmation Button
                  Container(
                    padding: EdgeInsets.fromLTRB(
                      20.w,
                      12.h,
                      20.w,
                      16.h + MediaQuery.of(context).padding.bottom,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.06),
                          offset: const Offset(0, -3),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          context.pop();
                          if (_selectedServiceIds.isNotEmpty) {
                            _scrollToService(_selectedServiceIds.first);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE91E63),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 14.h),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                        ),
                        child: Text(
                          _selectedServiceIds.isEmpty
                              ? 'Close'
                              : 'Done (${_selectedServiceIds.length} Selected)',
                          style: GoogleFonts.inter(
                            fontSize: 15.sp,
                            fontWeight: FontWeight.bold,
                          ),
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
    ).whenComplete(() {
      _searchQuery = '';
    });
  }

  void _showStaffPopup() {
    FormScrollHelper.unfocus();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final staffAsync = ref.watch(staffListProvider);
            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24.r),
                  topRight: Radius.circular(24.r),
                ),
              ),
              child: Column(
                children: [
                  // Header
                  Padding(
                    padding: EdgeInsets.all(20.w),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Select Staff',
                          style: GoogleFonts.poppins(
                            fontSize: 20.sp,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () => context.pop(),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                  ),
                  // Search Bar
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20.w),
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Search staff...',
                        prefixIcon: const Icon(
                          Icons.search_rounded,
                          color: Colors.grey,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12.r),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onChanged: (value) {
                        setModalState(() {
                          _searchQuery = value;
                        });
                      },
                    ),
                  ),
                  SizedBox(height: 16.h),
                  // List
                  Expanded(
                    child: staffAsync.when(
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (e, s) =>
                          const Center(child: Text('Error loading staff')),
                      data: (staffList) {
                        final query = _searchQuery.toLowerCase();
                        final filtered = staffList.where((s) {
                          final name = '${s['first_name']} ${s['last_name']}'
                              .toLowerCase();
                          return name.contains(query);
                        }).toList();
                        if (filtered.isEmpty) {
                          return Center(
                            child: Text(
                              'No staff found.',
                              style: GoogleFonts.inter(color: Colors.grey),
                            ),
                          );
                        }
                        return ListView.builder(
                          padding: EdgeInsets.fromLTRB(
                            20.w,
                            0,
                            20.w,
                            24.h + MediaQuery.of(context).padding.bottom,
                          ),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final staff = filtered[index];
                            final id = staff['id'];
                            final isSelected = _selectedStaffId == id;
                            final name =
                                '${staff['first_name']} ${staff['last_name']}';
                            final role = staff['role'] ?? 'Specialist';
                            return Padding(
                              padding: EdgeInsets.only(bottom: 12.h),
                              child: ListTile(
                                onTap: () {
                                  setState(() {
                                    _selectedStaffId = id;
                                    _selectedTime =
                                        null; // Reset time slot when staff changes
                                  });
                                  context.pop();
                                  _scrollToStaff(id);
                                },
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12.r),
                                  side: BorderSide(
                                    color: isSelected
                                        ? const Color(0xFFE91E63)
                                        : const Color(0xFFF1F5F9),
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                tileColor: isSelected
                                    ? const Color(0xFFFCE7F3)
                                    : Colors.white,
                                leading: Builder(
                                  builder: (context) {
                                    final rawUrl = (staff['avatar_url'] ?? staff['profile_image_url'] ?? staff['image_url'] ?? staff['profile_image'] ?? '').toString().split(',').first.trim();
                                    final fullUrl = rawUrl.startsWith('/')
                                        ? '$kBaseMediaUrl$rawUrl'
                                        : rawUrl;
                                    
                                    return ClipOval(
                                      child: rawUrl.isNotEmpty && (rawUrl.startsWith('http') || rawUrl.startsWith('/'))
                                          ? Image.network(
                                              fullUrl,
                                              width: 40,
                                              height: 40,
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) => Image.asset(
                                                'assets/images/customer_profile_avatar.jpg',
                                                width: 40,
                                                height: 40,
                                                fit: BoxFit.cover,
                                              ),
                                            )
                                          : Image.asset(
                                              rawUrl.isEmpty ? 'assets/images/customer_profile_avatar.jpg' : rawUrl,
                                              width: 40,
                                              height: 40,
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) => Image.asset(
                                                'assets/images/customer_profile_avatar.jpg',
                                                width: 40,
                                                height: 40,
                                                fit: BoxFit.cover,
                                              ),
                                            ),
                                    );
                                  },
                                ),
                                title: Text(
                                  name,
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                subtitle: Text(role),
                                trailing: isSelected
                                    ? const Icon(
                                        Icons.check_circle_rounded,
                                        color: Color(0xFFE91E63),
                                      )
                                    : const Icon(
                                        Icons.radio_button_unchecked_rounded,
                                        color: Color(0xFFCBD5E1),
                                      ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      _searchQuery = '';
    });
  }

  void _scrollToService(int id) {
    final services = ref.read(servicesListProvider).valueOrNull ?? [];
    final filteredServices = _selectedCategoryId == 0
        ? services
        : services
              .where((s) => s['category_id'] == _selectedCategoryId)
              .toList();

    int index = filteredServices.indexWhere((s) => s['id'] == id);
    if (index != -1) {
      double itemWidth = 260.w;
      double spacing = 16.w;
      double totalItemWidth = itemWidth + spacing;
      double listViewWidth =
          MediaQuery.of(context).size.width -
          40.w; // 20.w padding on both sides
      double targetOffset =
          (index * totalItemWidth) - (listViewWidth / 2) + (itemWidth / 2);
      if (targetOffset < 0) targetOffset = 0;

      Future.delayed(const Duration(milliseconds: 300), () {
        if (_servicesScrollController.hasClients) {
          _servicesScrollController.animateTo(
            targetOffset,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

  void _scrollToStaff(int id) {
    final staff = ref.read(staffListProvider).valueOrNull ?? [];
    int index = staff.indexWhere((s) => s['id'] == id);
    if (index != -1) {
      double itemWidth = 240.w;
      double spacing = 16.w;
      double totalItemWidth = itemWidth + spacing;
      double listViewWidth =
          MediaQuery.of(context).size.width -
          40.w; // 20.w padding on both sides
      double targetOffset =
          (index * totalItemWidth) - (listViewWidth / 2) + (itemWidth / 2);
      if (targetOffset < 0) targetOffset = 0;

      Future.delayed(const Duration(milliseconds: 300), () {
        if (_staffScrollController.hasClients) {
          _staffScrollController.animateTo(
            targetOffset,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }
}

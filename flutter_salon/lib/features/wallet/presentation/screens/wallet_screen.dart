import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_salon/features/customers/data/customer_provider.dart';
import '../../../../core/theme/app_colors.dart';
import 'package:flutter_salon/features/wallet/presentation/providers/wallet_provider.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../../../../core/widgets/skeletons/skeleton_item.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  int? _selectedCustomerId;
  final _amountController = TextEditingController();

  void _showTopUpDialog() {
    if (_selectedCustomerId == null) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24.r),
        ),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Top Up Wallet',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: 20.sp,
            color: AppColors.textPrimary,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Enter amount to add to wallet',
              style: GoogleFonts.inter(
                color: AppColors.textSecondary,
                fontSize: 14.sp,
              ),
            ),
            SizedBox(height: 20.h),
            TextFormField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              style: GoogleFonts.inter(
                fontSize: 16.sp,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
              decoration: InputDecoration(
                labelText: 'Amount (₹)',
                labelStyle: GoogleFonts.inter(color: AppColors.textSecondary),
                prefixIcon: Icon(
                  Icons.currency_rupee_rounded,
                  color: AppColors.primary,
                ),
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16.r),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16.r),
                  borderSide: BorderSide(
                    color: AppColors.primary,
                    width: 1.5.w,
                  ),
                ),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 20.w,
                  vertical: 16.h,
                ),
              ),
            ),
          ],
        ),
        actionsPadding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 16.h),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _amountController.clear();
            },
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
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 12.h),
              elevation: 4,
              shadowColor: AppColors.primary.withOpacity(0.5),
            ),
            onPressed: () async {
              final amount = double.tryParse(_amountController.text) ?? 0.0;
              if (amount <= 0) return;

              try {
                final repo = ref.read(walletRepositoryProvider);
                await repo.topUp(
                  _selectedCustomerId!,
                  amount,
                  'Manual Top-Up via App',
                );

                ref.invalidate(walletBalanceProvider(_selectedCustomerId!));
                ref.invalidate(
                  walletTransactionsProvider(_selectedCustomerId!),
                );

                if (mounted) {
                  Navigator.pop(context);
                  _amountController.clear();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Top up successful!'),
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
              'Top Up',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final customersAsync = ref.watch(customersListProvider(''));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Wallet & Rewards',
          style: GoogleFonts.playfairDisplay(
            fontSize: 28.sp,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: false,
      ),
      body: Column(
        children: [
          Container(
            margin: EdgeInsets.all(20.w),
            padding: EdgeInsets.all(20.w),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24.r),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Select Customer',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    fontSize: 16.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 16.h),
                customersAsync.when(
                  loading: () =>
                      SkeletonItem(width: double.infinity, height: 56.h),
                  error: (err, stack) => Text(
                    'Error: $err',
                    style: GoogleFonts.inter(color: AppColors.error),
                  ),
                  data: (customers) {
                    return DropdownButtonFormField<int>(
                      decoration: InputDecoration(
                        hintText: 'Search or select customer',
                        hintStyle: GoogleFonts.inter(
                          color: AppColors.textSecondary,
                        ),
                        prefixIcon: Icon(
                          Icons.person_search_rounded,
                          color: AppColors.primary,
                        ),
                        filled: true,
                        fillColor: AppColors.background,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16.r),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16.r),
                          borderSide: BorderSide(
                            color: AppColors.primary,
                            width: 1.5.w,
                          ),
                        ),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 20.w,
                          vertical: 16.h,
                        ),
                      ),
                      icon: Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: AppColors.textSecondary,
                      ),
                      isExpanded: true,
                      initialValue: _selectedCustomerId,
                      items: customers.map((c) {
                        return DropdownMenuItem<int>(
                          value: c['id'],
                          child: Text(
                            '${c['first_name']} ${c['last_name'] ?? ''} - ${c['phone']}',
                            style: GoogleFonts.inter(),
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedCustomerId = val;
                        });
                      },
                    );
                  },
                ),
              ],
            ),
          ),

          if (_selectedCustomerId != null) ...[
            _buildBalanceCard(),
            Padding(
              padding: EdgeInsets.only(
                left: 24.w,
                right: 24.w,
                top: 24.h,
                bottom: 12.h,
              ),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Recent Transactions',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ),
            Expanded(child: _buildTransactionList()),
          ] else ...[
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.account_balance_wallet_rounded,
                      size: 80.sp,
                      color: AppColors.primaryLight.withOpacity(0.5),
                    ),
                    SizedBox(height: 24.h),
                    Text(
                      'No Customer Selected',
                      style: GoogleFonts.poppins(
                        fontSize: 20.sp,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      'Select a customer above to view\ntheir wallet and reward points.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        color: AppColors.textSecondary,
                        height: 1.5.h,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
      floatingActionButton: _selectedCustomerId != null
          ? FloatingActionButton.extended(
              onPressed: _showTopUpDialog,
              backgroundColor: AppColors.primary,
              elevation: 4,
              icon: Icon(Icons.add_rounded, color: Colors.white),
              label: Text(
                'Top Up',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildBalanceCard() {
    final balanceAsync = ref.watch(walletBalanceProvider(_selectedCustomerId!));

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20.w),
      child: balanceAsync.when(
        loading: () => Row(
          children: [
            Expanded(child: SkeletonItem(height: 120.h)),
            SizedBox(width: 16.w),
            Expanded(child: SkeletonItem(height: 120.h)),
          ],
        ),
        error: (err, stack) => Text(
          'Error loading balance: $err',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
        data: (data) {
          final balance = data['wallet_balance'] ?? 0;
          final points = data['reward_points'] ?? 0;
          return Row(
            children: [
              Expanded(
                child: Container(
                  padding: EdgeInsets.all(20.w),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(24.r),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppColors.primary, Color(0xFFD47095)],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: EdgeInsets.all(8.w),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.account_balance_wallet_rounded,
                          color: Colors.white,
                          size: 24.sp,
                        ),
                      ),
                      SizedBox(height: 16.h),
                      Text(
                        'Wallet Balance',
                        style: GoogleFonts.inter(
                          color: Colors.white.withOpacity(0.9),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 4.h),
                      Text(
                        '₹$balance',
                        style: GoogleFonts.poppins(
                          fontSize: 26.sp,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(width: 16.w),
              Expanded(
                child: Container(
                  padding: EdgeInsets.all(20.w),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFB020),
                    borderRadius: BorderRadius.circular(24.r),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFB020).withOpacity(0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFFFC048), Color(0xFFFF9F0A)],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: EdgeInsets.all(8.w),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.stars_rounded,
                          color: Colors.white,
                          size: 24.sp,
                        ),
                      ),
                      SizedBox(height: 16.h),
                      Text(
                        'Reward Points',
                        style: GoogleFonts.inter(
                          color: Colors.white.withOpacity(0.9),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 4.h),
                      Text(
                        '$points',
                        style: GoogleFonts.poppins(
                          fontSize: 26.sp,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildTransactionList() {
    final txnAsync = ref.watch(
      walletTransactionsProvider(_selectedCustomerId!),
    );

    return txnAsync.when(
      loading: () => const SkeletonList(),
      error: (err, stack) => Center(
        child: Text(
          'Error loading transactions',
          style: GoogleFonts.inter(color: AppColors.error),
        ),
      ),
      data: (txns) {
        if (txns.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.history_rounded, size: 64.sp, color: Colors.black12),
                SizedBox(height: 16.h),
                Text(
                  'No transactions found',
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
          padding: EdgeInsets.symmetric(
            horizontal: 20.w,
            vertical: 8.h,
          ).copyWith(bottom: 100),
          itemCount: txns.length,
          itemBuilder: (context, index) {
            final txn = txns[index];
            final isCredit = txn['type'] == 'credit';
            return Container(
              margin: EdgeInsets.only(bottom: 12.h),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16.r),
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
                leading: Container(
                  padding: EdgeInsets.all(12.w),
                  decoration: BoxDecoration(
                    color: isCredit
                        ? Colors.green.withOpacity(0.1)
                        : Colors.red.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isCredit
                        ? Icons.arrow_downward_rounded
                        : Icons.arrow_upward_rounded,
                    color: isCredit ? Colors.green : Colors.red,
                    size: 20.sp,
                  ),
                ),
                title: Text(
                  txn['description'] ?? 'Wallet Transaction',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    fontSize: 15.sp,
                    color: AppColors.textPrimary,
                  ),
                ),
                subtitle: Text(
                  DateFormat(
                    'dd MMM yyyy, hh:mm a',
                  ).format(DateTime.parse(txn['created_at'])),
                  style: GoogleFonts.inter(
                    fontSize: 12.sp,
                    color: AppColors.textSecondary,
                  ),
                ),
                trailing: Text(
                  '${isCredit ? '+' : '-'} ₹${txn['amount']}',
                  style: GoogleFonts.poppins(
                    color: isCredit ? Colors.green : Colors.red,
                    fontWeight: FontWeight.bold,
                    fontSize: 16.sp,
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

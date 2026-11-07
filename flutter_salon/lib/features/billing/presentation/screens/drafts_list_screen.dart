import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import 'package:flutter_salon/features/pos/presentation/providers/invoice_provider.dart';
import 'package:flutter_salon/features/pos/presentation/providers/cart_provider.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class DraftsListScreen extends ConsumerWidget {
  const DraftsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invoicesAsync = ref.watch(invoicesListProvider('draft'));

    return Scaffold(
      appBar: AppBar(title: Text('Saved Drafts')),
      body: invoicesAsync.when(
        loading: () => const SkeletonList(),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (invoices) {
          final drafts = invoices
              .where((inv) => inv['status'] == 'draft')
              .toList();

          if (drafts.isEmpty) {
            return Center(child: Text('No saved drafts found.'));
          }

          return ListView.separated(
            padding: EdgeInsets.all(16.w),
            itemCount: drafts.length,
            separatorBuilder: (context, index) => SizedBox(height: 12.h),
            itemBuilder: (context, index) {
              final draft = drafts[index];
              final customer = draft['customer'] ?? {};
              return Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: ListTile(
                  contentPadding: EdgeInsets.all(16.w),
                  title: Text(
                    'Draft #${draft['id']}',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(height: 4.h),
                      Text(
                        'Customer: ${customer['first_name'] ?? 'Unknown'} ${customer['last_name'] ?? ''}',
                      ),
                      SizedBox(height: 4.h),
                      Text('Amount: ₹${draft['total_amount'] ?? 0}'),
                    ],
                  ),
                  trailing: ElevatedButton(
                    onPressed: () async {
                      try {
                        // Show loading indicator in a dialog
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (context) =>
                              Center(child: CircularProgressIndicator()),
                        );

                        final fullDraft = await ref
                            .read(invoiceRepositoryProvider)
                            .getInvoice(draft['id']);

                        ref.read(cartProvider.notifier).clearCart();

                        if (fullDraft['customer'] != null) {
                          ref
                              .read(cartProvider.notifier)
                              .setCustomer(fullDraft['customer']);
                        }

                        final items =
                            fullDraft['items'] as List<dynamic>? ?? [];
                        for (var item in items) {
                          ref
                              .read(cartProvider.notifier)
                              .addItem(
                                CartItem(
                                  itemType: item['item_type'] ?? 'service',
                                  itemId: item['item_id'],
                                  name: item['item_name'] ?? '',
                                  unitPrice:
                                      double.tryParse(
                                        item['unit_price'].toString(),
                                      ) ??
                                      0.0,
                                  quantity: item['quantity'] ?? 1,
                                  staffMemberId: item['staff_member_id'],
                                ),
                              );
                        }

                        // Close loading dialog
                        if (context.mounted) Navigator.pop(context);

                        // Close drafts screen to return to POS
                        if (context.mounted) context.pop();
                      } catch (e) {
                        if (context.mounted) {
                          Navigator.pop(context); // Close loading dialog
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to load draft: $e')),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Resume'),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

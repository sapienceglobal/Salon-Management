import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/features/pos/presentation/providers/cart_provider.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';

void showQuickAssignStaffDialog(BuildContext context) {
  showDialog(
    context: context,
    builder: (context) {
      return Consumer(
        builder: (context, ref, child) {
          final staffAsync = ref.watch(activeStaffListProvider);
          return AlertDialog(
            title: Text('Quick Assign Staff'),
            content: staffAsync.when(
              loading: () => SizedBox(
                height: 100.h,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (err, stack) => Text('Error: $err'),
              data: (staff) {
                if (staff.isEmpty) return Text('No staff available.');
                return SizedBox(
                  width: double.maxFinite,
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: staff.length,
                    itemBuilder: (context, index) {
                      final s = staff[index];
                      return ListTile(
                        leading: CircleAvatar(child: Icon(Icons.person)),
                        title: Text(
                          '${s['first_name']} ${s['last_name'] ?? ''}'.trim(),
                        ),
                        onTap: () {
                          ref
                              .read(cartProvider.notifier)
                              .setGlobalStaff(s['id']);
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Assigned ${s['first_name']} to all items in cart',
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          );
        },
      );
    },
  );
}

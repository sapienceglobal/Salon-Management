import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../../core/theme/app_colors.dart';
import '../providers/settings_provider.dart';

class RoomsTab extends ConsumerWidget {
  const RoomsTab({super.key});

  void _showRoomDialog(
    BuildContext context,
    WidgetRef ref, [
    Map<String, dynamic>? room,
  ]) {
    final nameController = TextEditingController(text: room?['name']);
    final capacityController = TextEditingController(
      text: room?['capacity']?.toString() ?? '1',
    );

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(
            room == null ? 'New Room' : 'Edit Room',
            style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Room Name'),
              ),
              SizedBox(height: 16.h),
              TextField(
                controller: capacityController,
                decoration: const InputDecoration(labelText: 'Capacity'),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final data = {
                  'name': nameController.text,
                  'capacity': int.tryParse(capacityController.text),
                };
                if (room == null) {
                  ref.read(roomsProvider.notifier).createRoom(data);
                } else {
                  ref.read(roomsProvider.notifier).updateRoom(room['id'], data);
                }
                Navigator.pop(context);
              },
              child: Text('Save'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roomsAsync = ref.watch(roomsProvider);

    return roomsAsync.when(
      loading: () => Center(child: CircularProgressIndicator()),
      error: (e, st) => Center(child: Text('Error: $e')),
      data: (rooms) {
        return ListView(
          padding: EdgeInsets.all(16.w),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Service Rooms',
                  style: GoogleFonts.poppins(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => _showRoomDialog(context, ref),
                  icon: Icon(Icons.add, size: 18.sp),
                  label: Text('Add Room'),
                ),
              ],
            ),
            SizedBox(height: 16.h),
            if (rooms.isEmpty)
              Padding(
                padding: EdgeInsets.symmetric(vertical: 32.h),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.meeting_room_outlined, size: 48.sp, color: Colors.grey.shade400),
                      SizedBox(height: 8.h),
                      Text(
                        'No service rooms configured yet',
                        style: GoogleFonts.inter(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...rooms.map(
                (r) => Card(
                  elevation: 0,
                  margin: EdgeInsets.only(bottom: 12.h),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16.r),
                    side: BorderSide(color: Colors.grey.shade200),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(16.w),
                    child: Row(
                      children: [
                        Container(
                          padding: EdgeInsets.all(12.w),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                          child: Icon(Icons.chair_rounded, color: AppColors.primary, size: 22.sp),
                        ),
                        SizedBox(width: 14.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                r['name'] ?? 'Unnamed Room',
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15.sp,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              SizedBox(height: 2.h),
                              Text(
                                'Capacity: ${r['capacity'] ?? 1} guest(s)',
                                style: GoogleFonts.inter(
                                  fontSize: 12.sp,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.edit_outlined, color: AppColors.primary, size: 20.sp),
                          onPressed: () => _showRoomDialog(context, ref, r),
                        ),
                        IconButton(
                          icon: Icon(Icons.delete_outline_rounded, color: Colors.red.shade400, size: 20.sp),
                          onPressed: () => _confirmDelete(context, ref, r),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, Map<String, dynamic> room) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Room', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to remove "${room['name']}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              ref.read(roomsProvider.notifier).deleteRoom(room['id']);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Service room removed')),
              );
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

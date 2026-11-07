import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/skeletons/skeleton_list.dart';
import '../../../../core/widgets/skeletons/skeleton_card.dart';
import '../../data/crm_provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class FeedbackScreen extends ConsumerWidget {
  const FeedbackScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(feedbackStatsProvider);
    final feedbackAsync = ref.watch(feedbackListProvider);

    return Scaffold(
      appBar: AppBar(title: Text('Customer Feedback')),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: statsAsync.when(
              loading: () => Padding(
                padding: EdgeInsets.all(20.w),
                child: SkeletonCard(height: 100.h),
              ),
              error: (err, stack) => Padding(
                padding: EdgeInsets.all(20.w),
                child: Text('Error: $err'),
              ),
              data: (stats) {
                return Padding(
                  padding: EdgeInsets.all(20.w),
                  child: Row(
                    children: [
                      Expanded(
                        child: Card(
                          color: AppColors.primaryLight,
                          child: Padding(
                            padding: EdgeInsets.all(16.w),
                            child: Column(
                              children: [
                                Text(
                                  'Avg Rating',
                                  style: TextStyle(color: AppColors.primary),
                                ),
                                Text(
                                  '${stats['average_rating'] ?? 0}',
                                  style: TextStyle(
                                    fontSize: 24.sp,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.star,
                                      color: Colors.amber,
                                      size: 20.sp,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Card(
                          color: Colors.green.shade50,
                          child: Padding(
                            padding: EdgeInsets.all(16.w),
                            child: Column(
                              children: [
                                Text(
                                  'Total Reviews',
                                  style: TextStyle(color: Colors.green),
                                ),
                                Text(
                                  '${stats['total_feedback'] ?? 0}',
                                  style: TextStyle(
                                    fontSize: 24.sp,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          SliverPadding(
            padding: EdgeInsets.symmetric(horizontal: 16.w.w),
            sliver: SliverToBoxAdapter(
              child: Text(
                'Recent Feedback',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
          ),
          feedbackAsync.when(
            loading: () => SliverFillRemaining(child: SkeletonList()),
            error: (err, stack) =>
                SliverFillRemaining(child: Center(child: Text('Error: $err'))),
            data: (feedback) {
              if (feedback.isEmpty) {
                return SliverFillRemaining(
                  child: Center(child: Text('No feedback found.')),
                );
              }
              return SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final item = feedback[index];
                  return Card(
                    margin: EdgeInsets.symmetric(
                      horizontal: 16.w.w,
                      vertical: 8.h.h,
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.amber.shade100,
                        child: Text(
                          '${item['rating']}',
                          style: TextStyle(
                            color: Colors.amber,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text(item['customer_name'] ?? 'Unknown Customer'),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (item['comment'] != null &&
                              item['comment'].isNotEmpty) ...[
                            SizedBox(height: 4.h),
                            Text(
                              '"${item['comment']}"',
                              style: TextStyle(fontStyle: FontStyle.italic),
                            ),
                          ],
                          SizedBox(height: 4.h),
                          Text(
                            'Staff: ${item['staff_name'] ?? 'N/A'}',
                            style: TextStyle(
                              fontSize: 12.sp,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }, childCount: feedback.length),
              );
            },
          ),
        ],
      ),
    );
  }
}

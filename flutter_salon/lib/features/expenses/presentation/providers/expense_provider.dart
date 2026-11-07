import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/expense_repository.dart';

final expenseRepositoryProvider = Provider<ExpenseRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ExpenseRepository(dio: dio);
});

final expensesListProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final repository = ref.watch(expenseRepositoryProvider);
  final res = await repository.getExpenses();
  if (res is Map<String, dynamic>) {
    return res;
  }
  return <String, dynamic>{
    'data': res,
    'meta': {
      'summary': {'total_expenses': 0, 'total_tax': 0},
    },
  };
});

final expenseCategoriesProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repository = ref.watch(expenseRepositoryProvider);
  return await repository.getExpenseCategories();
});

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/features/inventory/data/inventory_repository.dart';

final inventorySearchQueryProvider = StateProvider<String>((ref) => '');
final inventoryCategoryProvider = StateProvider<String>((ref) => '');
final inventoryStatusProvider = StateProvider<String>((ref) => 'active');
final inventoryLowStockProvider = StateProvider<bool>((ref) => false);

final inventoryListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repository = ref.watch(inventoryRepositoryProvider);
  final search = ref.watch(inventorySearchQueryProvider);
  final category = ref.watch(inventoryCategoryProvider);
  final status = ref.watch(inventoryStatusProvider);
  final lowStock = ref.watch(inventoryLowStockProvider);

  return repository.getProducts(
    search: search,
    category: category,
    status: status,
    lowStock: lowStock,
  );
});

// Computed Metrics
final inventoryMetricsProvider = Provider.autoDispose<Map<String, dynamic>>((
  ref,
) {
  final productsAsync = ref.watch(inventoryListProvider);

  return productsAsync.maybeWhen(
    data: (products) {
      int totalProducts = 0;
      int lowStockAlerts = 0;
      int outOfStock = 0;
      double totalValue = 0.0;

      for (var p in products) {
        if (p['is_active'] == true) {
          totalProducts++;
          final qty = p['stock_quantity'] ?? 0;
          final minAlert = p['min_stock_alert'] ?? 0;
          final price =
              double.tryParse(p['selling_price']?.toString() ?? '0') ?? 0.0;

          if (qty <= 0) {
            outOfStock++;
          } else if (qty <= minAlert) {
            lowStockAlerts++;
          }
          totalValue += (price * qty);
        }
      }

      return {
        'totalProducts': totalProducts,
        'lowStockAlerts': lowStockAlerts,
        'outOfStock': outOfStock,
        'totalValue': totalValue,
      };
    },
    orElse: () => {
      'totalProducts': 0,
      'lowStockAlerts': 0,
      'outOfStock': 0,
      'totalValue': 0.0,
    },
  );
});

// For Categories Dropdown
final inventoryCategoriesProvider = Provider.autoDispose<List<String>>((ref) {
  final productsAsync = ref.watch(inventoryListProvider);

  return productsAsync.maybeWhen(
    data: (products) {
      final categories = products
          .map((p) => p['category']?.toString())
          .where((c) => c != null && c.isNotEmpty)
          .cast<String>()
          .toSet()
          .toList();
      categories.sort();
      return categories;
    },
    orElse: () => [],
  );
});

import 'package:flutter_riverpod/flutter_riverpod.dart';

class CartItem {
  final String itemType; // 'service', 'product', 'package'
  final int itemId;
  final String name;
  final double unitPrice;
  final int quantity;
  final double discount;
  final int? staffMemberId;

  CartItem({
    required this.itemType,
    required this.itemId,
    required this.name,
    required this.unitPrice,
    this.quantity = 1,
    this.discount = 0.0,
    this.staffMemberId,
  });

  CartItem copyWith({
    String? itemType,
    int? itemId,
    String? name,
    double? unitPrice,
    int? quantity,
    double? discount,
    int? staffMemberId,
  }) {
    return CartItem(
      itemType: itemType ?? this.itemType,
      itemId: itemId ?? this.itemId,
      name: name ?? this.name,
      unitPrice: unitPrice ?? this.unitPrice,
      quantity: quantity ?? this.quantity,
      discount: discount ?? this.discount,
      staffMemberId: staffMemberId ?? this.staffMemberId,
    );
  }
}

class CartState {
  final Map<String, dynamic>? customer;
  final List<CartItem> items;
  final double discountAmount;
  final String discountType; // 'flat' or 'percentage'
  final double tipAmount;

  CartState({
    this.customer,
    this.items = const [],
    this.discountAmount = 0.0,
    this.discountType = 'flat',
    this.tipAmount = 0.0,
  });

  double get subtotal {
    return items.fold(
      0.0,
      (sum, item) => sum + (item.unitPrice * item.quantity) - item.discount,
    );
  }

  double get totalDiscount {
    if (discountType == 'percentage') {
      return subtotal * (discountAmount / 100);
    }
    return discountAmount;
  }

  double get total {
    return subtotal - totalDiscount + tipAmount;
  }

  CartState copyWith({
    Map<String, dynamic>? customer,
    bool clearCustomer = false,
    List<CartItem>? items,
    double? discountAmount,
    String? discountType,
    double? tipAmount,
  }) {
    return CartState(
      customer: clearCustomer ? null : (customer ?? this.customer),
      items: items ?? this.items,
      discountAmount: discountAmount ?? this.discountAmount,
      discountType: discountType ?? this.discountType,
      tipAmount: tipAmount ?? this.tipAmount,
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(CartState());

  void setCustomer(Map<String, dynamic>? cust) {
    state = state.copyWith(customer: cust, clearCustomer: cust == null);
  }

  void setGlobalStaff(int staffId) {
    final updatedItems = state.items
        .map((i) => i.copyWith(staffMemberId: staffId))
        .toList();
    state = state.copyWith(items: updatedItems);
  }

  void addItem(CartItem item) {
    // Check if item already exists
    final index = state.items.indexWhere(
      (i) => i.itemType == item.itemType && i.itemId == item.itemId,
    );
    if (index >= 0) {
      final newItems = List<CartItem>.from(state.items);
      newItems[index] = newItems[index].copyWith(
        quantity: newItems[index].quantity + item.quantity,
      );
      state = state.copyWith(items: newItems);
    } else {
      state = state.copyWith(items: [...state.items, item]);
    }
  }

  void updateItemQuantity(int index, int quantity) {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    final newItems = List<CartItem>.from(state.items);
    newItems[index] = newItems[index].copyWith(quantity: quantity);
    state = state.copyWith(items: newItems);
  }

  void updateItemStaff(int index, int? staffId) {
    final newItems = List<CartItem>.from(state.items);
    newItems[index] = newItems[index].copyWith(staffMemberId: staffId);
    state = state.copyWith(items: newItems);
  }

  void removeItem(int index) {
    final newItems = List<CartItem>.from(state.items)..removeAt(index);
    state = state.copyWith(items: newItems);
  }

  void setDiscount(double amount, String type) {
    state = state.copyWith(discountAmount: amount, discountType: type);
  }

  void setTip(double amount) {
    state = state.copyWith(tipAmount: amount);
  }

  void clearCart() {
    state = CartState();
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});

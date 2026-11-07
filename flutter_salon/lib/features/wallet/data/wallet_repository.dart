import 'package:dio/dio.dart';

class WalletRepository {
  final Dio _dio;

  WalletRepository({Dio? dio}) : _dio = dio!;

  Future<Map<String, dynamic>> getBalance(int customerId) async {
    try {
      final response = await _dio.get(
        '/wallet-rewards/wallet/$customerId/balance',
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load wallet balance: $e');
    }
  }

  Future<Map<String, dynamic>> topUp(
    int customerId,
    double amount,
    String description,
  ) async {
    try {
      final response = await _dio.post(
        '/wallet-rewards/wallet/topup',
        data: {
          'customer_id': customerId,
          'amount': amount,
          'description': description,
        },
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to top up wallet: $e');
    }
  }

  Future<List<dynamic>> getTransactions(int customerId) async {
    try {
      final response = await _dio.get(
        '/wallet-rewards/wallet/$customerId/transactions',
      );
      return response.data['data'] ?? response.data ?? [];
    } catch (e) {
      throw Exception('Failed to load wallet transactions: $e');
    }
  }

  Future<Map<String, dynamic>> redeemPoints(
    int customerId,
    int points,
    String description,
  ) async {
    try {
      final response = await _dio.post(
        '/wallet-rewards/rewards/redeem',
        data: {
          'customer_id': customerId,
          'points': points,
          'description': description,
        },
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to redeem points: $e');
    }
  }
}

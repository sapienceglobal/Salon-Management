import 'package:dio/dio.dart';

class InvoiceRepository {
  final Dio _dio;

  InvoiceRepository({Dio? dio}) : _dio = dio!;

  Future<Map<String, dynamic>> createInvoice(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/invoices', data: data);
      return response.data;
    } catch (e) {
      if (e is DioException &&
          e.response?.data != null &&
          e.response?.data['message'] != null) {
        throw Exception(e.response?.data['message']);
      }
      throw Exception('Failed to create invoice: $e');
    }
  }

  Future<List<dynamic>> getInvoices({String? status}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }
      final response = await _dio.get(
        '/invoices',
        queryParameters: queryParams,
      );
      return response.data['invoices'] ??
          response.data['data'] ??
          response.data;
    } catch (e) {
      throw Exception('Failed to load invoices: $e');
    }
  }

  Future<Map<String, dynamic>> getInvoice(int id) async {
    try {
      final response = await _dio.get('/invoices/$id');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load invoice: $e');
    }
  }

  Future<void> deleteInvoice(int id) async {
    try {
      await _dio.delete('/invoices/$id');
    } catch (e) {
      if (e is DioException &&
          e.response?.data != null &&
          e.response?.data['message'] != null) {
        throw Exception(e.response?.data['message']);
      }
      throw Exception('Failed to delete invoice: $e');
    }
  }

  Future<void> addPayment({
    required int invoiceId,
    required double amount,
    required String paymentMethod,
    String? transactionId,
  }) async {
    try {
      final data = {'amount': amount, 'payment_method': paymentMethod};
      if (transactionId != null && transactionId.isNotEmpty) {
        data['transaction_id'] = transactionId;
      }
      final response = await _dio.post(
        '/invoices/$invoiceId/payment',
        data: data,
      );
      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Payment failed');
      }
    } catch (e) {
      if (e is DioException &&
          e.response?.data != null &&
          e.response?.data['message'] != null) {
        throw Exception(e.response?.data['message']);
      }
      throw Exception('Failed to add payment: $e');
    }
  }

  // ── Update Invoice ───────────────────────────────────────────
  Future<Map<String, dynamic>> updateInvoice(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.put('/invoices/$id', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException &&
          e.response?.data != null &&
          e.response?.data['message'] != null) {
        throw Exception(e.response?.data['message']);
      }
      throw Exception('Failed to update invoice: $e');
    }
  }

  // ── Refund Payment ───────────────────────────────────────────
  Future<Map<String, dynamic>> refundPayment({
    required int invoiceId,
    required double amount,
    String? reason,
  }) async {
    try {
      final data = <String, dynamic>{'amount': amount};
      if (reason != null && reason.isNotEmpty) {
        data['reason'] = reason;
      }
      final response = await _dio.post(
        '/invoices/$invoiceId/refund',
        data: data,
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException &&
          e.response?.data != null &&
          e.response?.data['message'] != null) {
        throw Exception(e.response?.data['message']);
      }
      throw Exception('Failed to process refund: $e');
    }
  }
}

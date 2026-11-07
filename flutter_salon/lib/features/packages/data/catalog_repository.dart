import 'package:dio/dio.dart';
import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository(dio: ref.watch(dioProvider));
});

class CatalogRepository {
  final Dio dio;

  CatalogRepository({required this.dio});

  Future<List<dynamic>> getPackages() async {
    try {
      final response = await dio.get('/catalog/packages');
      if (response.data['success'] == true) {
        return response.data['data'] as List<dynamic>;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to fetch packages');
      }
    } catch (e) {
      throw Exception('Failed to fetch packages: $e');
    }
  }

  Future<List<dynamic>> getMemberships() async {
    try {
      final response = await dio.get('/catalog/memberships');
      if (response.data['success'] == true) {
        return response.data['data'] as List<dynamic>;
      } else {
        throw Exception(
          response.data['message'] ?? 'Failed to fetch memberships',
        );
      }
    } catch (e) {
      throw Exception('Failed to fetch memberships: $e');
    }
  }

  Future<void> purchasePackage(int customerId, int packageId) async {
    try {
      final response = await dio.post(
        '/catalog/packages/purchase',
        data: {'customer_id': customerId, 'package_id': packageId},
      );
      if (response.data['success'] != true) {
        throw Exception(
          response.data['message'] ?? 'Failed to purchase package',
        );
      }
    } catch (e) {
      throw Exception('Failed to purchase package: $e');
    }
  }

  Future<void> purchaseMembership(int customerId, int membershipId) async {
    try {
      final response = await dio.post(
        '/catalog/memberships/purchase',
        data: {'customer_id': customerId, 'membership_id': membershipId},
      );
      if (response.data['success'] != true) {
        throw Exception(
          response.data['message'] ?? 'Failed to purchase membership',
        );
      }
    } catch (e) {
      throw Exception('Failed to purchase membership: $e');
    }
  }

  // --- Package CRUD ---
  Future<void> createPackage(
    Map<String, dynamic> data, {
    File? imageFile,
  }) async {
    try {
      // NOTE: Backend currently doesn't support package images, so we just send JSON.
      final response = await dio.post('/catalog/packages', data: data);
      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to create package');
      }
    } catch (e) {
      throw Exception('Failed to create package: $e');
    }
  }

  Future<void> updatePackage(
    int id,
    Map<String, dynamic> data, {
    File? imageFile,
  }) async {
    try {
      // NOTE: Backend currently doesn't support package images, so we just send JSON.
      final response = await dio.put('/catalog/packages/$id', data: data);
      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to update package');
      }
    } catch (e) {
      throw Exception('Failed to update package: $e');
    }
  }

  Future<void> deletePackage(int id) async {
    try {
      final response = await dio.delete('/catalog/packages/$id');
      if (response.data['success'] != true) {
        throw Exception(response.data['message'] ?? 'Failed to delete package');
      }
    } catch (e) {
      throw Exception('Failed to delete package: $e');
    }
  }

  // --- Membership CRUD ---
  Future<void> createMembership(
    Map<String, dynamic> data, {
    File? imageFile,
  }) async {
    try {
      // NOTE: Backend currently doesn't support membership images, so we just send JSON.
      final response = await dio.post('/catalog/memberships', data: data);
      if (response.data['success'] != true) {
        throw Exception(
          response.data['message'] ?? 'Failed to create membership',
        );
      }
    } catch (e) {
      throw Exception('Failed to create membership: $e');
    }
  }

  Future<void> updateMembership(
    int id,
    Map<String, dynamic> data, {
    File? imageFile,
  }) async {
    try {
      // NOTE: Backend currently doesn't support membership images, so we just send JSON.
      final response = await dio.put('/catalog/memberships/$id', data: data);
      if (response.data['success'] != true) {
        throw Exception(
          response.data['message'] ?? 'Failed to update membership',
        );
      }
    } catch (e) {
      throw Exception('Failed to update membership: $e');
    }
  }

  Future<void> deleteMembership(int id) async {
    try {
      final response = await dio.delete('/catalog/memberships/$id');
      if (response.data['success'] != true) {
        throw Exception(
          response.data['message'] ?? 'Failed to delete membership',
        );
      }
    } catch (e) {
      throw Exception('Failed to delete membership: $e');
    }
  }
}

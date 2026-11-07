import 'package:dio/dio.dart';
import '../../../../core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';

// FILTER STATE PROVIDER
final leadsFilterProvider = StateProvider<Map<String, dynamic>>(
  (ref) => {
    'status': '',
    'assigned_to': '',
    'search': '',
    'enquiry_date': '',
    'follow_up_date': '',
    'source': '',
  },
);

// REPOSITORY
class CrmRepository {
  final Dio _dio;

  CrmRepository({Dio? dio}) : _dio = dio!;

  // Leads
  Future<List<dynamic>> getLeads({
    Map<String, dynamic>? queryParameters,
  }) async {
    // Remove empty parameters
    final params = <String, dynamic>{};
    queryParameters?.forEach((key, value) {
      if (value != null && value.toString().isNotEmpty) {
        params[key] = value;
      }
    });

    final response = await _dio.get(
      '/leads',
      queryParameters: params.isNotEmpty ? params : null,
    );
    return response.data['data'] ?? response.data['leads'] ?? [];
  }

  Future<void> createLead(Map<String, dynamic> data) async {
    try {
      await _dio.post('/leads', data: data);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final resData = e.response!.data;
        if (resData is Map) {
          if (resData['errors'] != null &&
              resData['errors'] is List &&
              resData['errors'].isNotEmpty) {
            throw Exception(
              resData['errors'][0]['message'] ?? 'Validation failed',
            );
          }
          if (resData['message'] != null) {
            throw Exception(resData['message']);
          }
        }
      }
      throw Exception('Failed to create lead: $e');
    }
  }

  Future<void> updateLead(int id, Map<String, dynamic> data) async {
    try {
      await _dio.put('/leads/$id', data: data);
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final resData = e.response!.data;
        if (resData is Map) {
          if (resData['errors'] != null &&
              resData['errors'] is List &&
              resData['errors'].isNotEmpty) {
            throw Exception(
              resData['errors'][0]['message'] ?? 'Validation failed',
            );
          }
          if (resData['message'] != null) {
            throw Exception(resData['message']);
          }
        }
      }
      throw Exception('Failed to update lead: $e');
    }
  }

  Future<void> convertLead(int id) async {
    await _dio.post('/leads/$id/convert');
  }

  Future<void> deleteLead(int id) async {
    await _dio.delete('/leads/$id');
  }

  // ── Lead Stats ───────────────────────────────────────────────
  Future<Map<String, dynamic>> getLeadStats() async {
    try {
      final response = await _dio.get('/leads/stats');
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load lead stats: $e');
    }
  }

  // ── Dashboard Analytics ──────────────────────────────────────
  Future<Map<String, dynamic>> getDashboardAnalytics() async {
    try {
      final response = await _dio.get('/leads/dashboard-analytics');
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load lead analytics: $e');
    }
  }

  // ── Get Single Lead ──────────────────────────────────────────
  Future<Map<String, dynamic>> getLead(int id) async {
    try {
      final response = await _dio.get('/leads/$id');
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load lead details: $e');
    }
  }

  // ── Record Follow-up ────────────────────────────────────────
  Future<void> recordFollowUp(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      await _dio.post('/leads/$id/follow-up', data: data);
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to record follow-up: $e');
    }
  }

  // ── Assign Lead ──────────────────────────────────────────────
  Future<void> assignLead(int id, int? staffId) async {
    try {
      await _dio.post('/leads/$id/assign', data: {
        'staff_id': staffId,
        'assigned_to': staffId,
      });
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to assign lead: $e');
    }
  }

  // Campaigns
  Future<List<dynamic>> getCampaigns() async {
    final response = await _dio.get('/campaigns');
    return response.data['data'] ?? response.data['campaigns'] ?? [];
  }

  Future<void> createCampaign(Map<String, dynamic> data) async {
    await _dio.post('/campaigns', data: data);
  }

  Future<void> sendCampaign(int id) async {
    await _dio.post('/campaigns/$id/send');
  }

  // Feedback
  Future<List<dynamic>> getFeedback() async {
    final response = await _dio.get('/feedback');
    return response.data['data'] ?? response.data['feedback'] ?? [];
  }

  Future<Map<String, dynamic>> getFeedbackStats() async {
    final response = await _dio.get('/feedback/stats');
    return response.data['data'] ?? response.data;
  }
}

// PROVIDERS
final crmRepositoryProvider = Provider<CrmRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return CrmRepository(dio: dio);
});

// Leads Providers
final leadsListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repo = ref.watch(crmRepositoryProvider);
  final filters = ref.watch(leadsFilterProvider);
  return await repo.getLeads(queryParameters: filters);
});

// Lead Stats Provider
final leadStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final repo = ref.watch(crmRepositoryProvider);
  return await repo.getLeadStats();
});

// Lead Dashboard Analytics Provider
final leadAnalyticsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final repo = ref.watch(crmRepositoryProvider);
  return await repo.getDashboardAnalytics();
});

// Single Lead Provider
final singleLeadProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, int>((ref, id) async {
      final repo = ref.watch(crmRepositoryProvider);
      return await repo.getLead(id);
    });

// Campaigns Providers
final campaignsListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repo = ref.watch(crmRepositoryProvider);
  return await repo.getCampaigns();
});

// Feedback Providers
final feedbackListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repo = ref.watch(crmRepositoryProvider);
  return await repo.getFeedback();
});

final feedbackStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final repo = ref.watch(crmRepositoryProvider);
  return await repo.getFeedbackStats();
});

// Staff list for assigning leads
final staffListForAssignProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repo = ref.watch(staffRepositoryProvider);
  final allStaff = await repo.getStaffMembers();
  return allStaff.where((s) => isStaffActive(s)).toList();
});


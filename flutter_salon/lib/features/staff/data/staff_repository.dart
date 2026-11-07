import 'package:dio/dio.dart';

class StaffRepository {
  final Dio _dio;

  StaffRepository({Dio? dio}) : _dio = dio!;

  Future<List<dynamic>> getStaffMembers({String? search, String? role}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (role != null && role.isNotEmpty && role != 'All')
        queryParams['role'] = role;

      final response = await _dio.get('/staff', queryParameters: queryParams);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load staff members: $e');
    }
  }

  Future<Map<String, dynamic>> getStaffMember(int id) async {
    try {
      final response = await _dio.get('/staff/$id');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load staff details: $e');
    }
  }

  Future<Map<String, dynamic>> createUser(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/settings/users', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map) {
          if (data['errors'] != null &&
              data['errors'] is List &&
              data['errors'].isNotEmpty) {
            throw Exception(
              data['errors'][0]['message'] ?? 'Validation failed',
            );
          }
          if (data['message'] != null) {
            throw Exception(data['message']);
          }
        }
      }
      throw Exception('Failed to create user account: $e');
    }
  }

  Future<Map<String, dynamic>> updateUser(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.put('/settings/users/$id', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map) {
          if (data['errors'] != null &&
              data['errors'] is List &&
              data['errors'].isNotEmpty) {
            throw Exception(
              data['errors'][0]['message'] ?? 'Validation failed',
            );
          }
          if (data['message'] != null) {
            throw Exception(data['message']);
          }
        }
      }
      throw Exception('Failed to update user account: $e');
    }
  }

  Future<Map<String, dynamic>> createStaffMember(
    Map<String, dynamic> data,
  ) async {
    try {
      final hasFile = data.values.any((v) => v is MultipartFile);
      final requestData = hasFile ? FormData.fromMap(data) : data;
      final response = await _dio.post('/staff', data: requestData);
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map) {
          if (data['errors'] != null &&
              data['errors'] is List &&
              data['errors'].isNotEmpty) {
            throw Exception(
              data['errors'][0]['message'] ?? 'Validation failed',
            );
          }
          if (data['message'] != null) {
            throw Exception(data['message']);
          }
        }
      }
      throw Exception('Failed to create staff member: $e');
    }
  }

  Future<Map<String, dynamic>> updateStaffMember(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final hasFile = data.values.any((v) => v is MultipartFile);
      final requestData = hasFile ? FormData.fromMap(data) : data;
      final response = await _dio.put('/staff/$id', data: requestData);
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map) {
          if (data['errors'] != null &&
              data['errors'] is List &&
              data['errors'].isNotEmpty) {
            throw Exception(
              data['errors'][0]['message'] ?? 'Validation failed',
            );
          }
          if (data['message'] != null) {
            throw Exception(data['message']);
          }
        }
      }
      throw Exception('Failed to update staff member: $e');
    }
  }

  Future<void> deleteStaffMember(int id) async {
    try {
      await _dio.delete('/staff/$id');
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to delete staff member: $e');
    }
  }

  Future<Map<String, dynamic>> toggleStaffActive(int id) async {
    try {
      final response = await _dio.patch('/staff/$id/toggle-active');
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to toggle staff status: $e');
    }
  }

  // ── Commissions ──────────────────────────────────────────────
  Future<List<dynamic>> getCommissions({
    String? startDate,
    String? endDate,
    int? staffId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;
      if (staffId != null) queryParams['staff_id'] = staffId;

      final response = await _dio.get(
        '/staff/commissions',
        queryParameters: queryParams,
      );
      return response.data['data'] ?? response.data ?? [];
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load commissions: $e');
    }
  }

  // ── Performance ──────────────────────────────────────────────
  Future<Map<String, dynamic>> getStaffPerformance(
    int id, {
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null && startDate.isNotEmpty) {
        queryParams['start_date'] = startDate;
      }
      if (endDate != null && endDate.isNotEmpty) {
        queryParams['end_date'] = endDate;
      }

      final response = await _dio.get(
        '/staff/$id/performance',
        queryParameters: queryParams,
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load staff performance: $e');
    }
  }

  // ── Staff Services ───────────────────────────────────────────
  Future<List<dynamic>> getStaffServices(int id) async {
    try {
      final response = await _dio.get('/staff/$id/services');
      return response.data['data'] ?? response.data ?? [];
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load staff services: $e');
    }
  }

  Future<void> updateStaffServices(
    int id,
    List<int> serviceIds,
  ) async {
    try {
      await _dio.post('/staff/$id/services', data: {
        'service_ids': serviceIds,
      });
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to update staff services: $e');
    }
  }

  // ── Schedule ─────────────────────────────────────────────────
  Future<Map<String, dynamic>> getStaffSchedule(int id) async {
    try {
      final response = await _dio.get('/staff/$id/schedule');
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load staff schedule: $e');
    }
  }

  Future<void> updateStaffSchedule(
    int id,
    Map<String, dynamic> scheduleData,
  ) async {
    try {
      await _dio.post('/staff/$id/schedule', data: scheduleData);
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to update staff schedule: $e');
    }
  }

  // ── Leaves ───────────────────────────────────────────────────
  Future<List<dynamic>> getStaffLeaves(int id) async {
    try {
      final response = await _dio.get('/staff/$id/leaves');
      return response.data['data'] ?? response.data ?? [];
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load staff leaves: $e');
    }
  }

  Future<void> addStaffLeave(
    int id,
    Map<String, dynamic> leaveData,
  ) async {
    try {
      await _dio.post('/staff/$id/leaves', data: leaveData);
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to add staff leave: $e');
    }
  }

  // ── Appointments ─────────────────────────────────────────────
  Future<List<dynamic>> getStaffAppointments(int staffId) async {
    try {
      final response = await _dio.get(
        '/appointments',
        queryParameters: {'staff_member_id': staffId, 'limit': 100},
      );
      final raw = response.data['data'] ?? response.data;
      if (raw is Map && raw['appointments'] != null) {
        return raw['appointments'] as List<dynamic>;
      }
      return raw is List ? raw : [];
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load staff appointments: $e');
    }
  }

  // ── Attendance ───────────────────────────────────────────────
  Future<List<dynamic>> getStaffAttendance({
    required int staffId,
    int? month,
    int? year,
  }) async {
    try {
      final queryParams = <String, dynamic>{'staff_member_id': staffId};
      if (month != null) queryParams['month'] = month;
      if (year != null) queryParams['year'] = year;

      final response = await _dio.get(
        '/staff/attendance',
        queryParameters: queryParams,
      );
      return response.data['data'] ?? response.data ?? [];
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load staff attendance: $e');
    }
  }

  Future<Map<String, dynamic>> markStaffAttendance(
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.post('/staff/attendance', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to mark attendance: $e');
    }
  }

  // ── Documents ────────────────────────────────────────────────
  Future<List<dynamic>> getStaffDocuments(int staffId) async {
    try {
      final response = await _dio.get('/staff/$staffId/documents');
      return response.data['data'] ?? response.data ?? [];
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load staff documents: $e');
    }
  }

  Future<Map<String, dynamic>> uploadStaffDocument({
    required int staffId,
    required String filePath,
    required String docName,
    required String docType,
  }) async {
    try {
      final formData = FormData.fromMap({
        'document': await MultipartFile.fromFile(filePath),
        'document_name': docName,
        'document_type': docType,
      });
      final response = await _dio.post(
        '/staff/$staffId/documents',
        data: formData,
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to upload document: $e');
    }
  }

  Future<void> deleteStaffDocument({
    required int staffId,
    required int docId,
  }) async {
    try {
      await _dio.delete('/staff/$staffId/documents/$docId');
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to delete document: $e');
    }
  }
}

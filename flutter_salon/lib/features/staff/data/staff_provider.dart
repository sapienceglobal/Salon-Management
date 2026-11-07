import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'staff_repository.dart';

final staffRepositoryProvider = Provider<StaffRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return StaffRepository(dio: dio);
});

final staffSearchQueryProvider = StateProvider<String>((ref) => '');
final staffSelectedRoleProvider = StateProvider<String>((ref) => 'All');

final staffListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repository = ref.watch(staffRepositoryProvider);
  final search = ref.watch(staffSearchQueryProvider);
  final role = ref.watch(staffSelectedRoleProvider);

  // Fetch all staff members (with optional search)
  final list = await repository.getStaffMembers(search: search);

  // Apply role filter locally in case backend ignores it
  if (role == 'All') return list;

  return list.where((staff) {
    final staffRole = staff['role']?.toString().toLowerCase() ?? '';
    return staffRole.contains(role.toLowerCase());
  }).toList();
});

final staffMemberProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, int>((ref, id) async {
      final repository = ref.watch(staffRepositoryProvider);
      return await repository.getStaffMember(id);
    });

bool isStaffActive(dynamic staff) {
  if (staff == null) return false;
  final raw = staff is Map ? staff['is_active'] : staff;
  if (raw == true || raw == 1 || raw == '1' || raw == 'true') return true;
  if (raw == false || raw == 0 || raw == '0' || raw == 'false') return false;
  if (staff is Map && staff['status'] != null) {
    final s = staff['status'].toString().toLowerCase();
    if (s == 'active') return true;
    if (s == 'inactive') return false;
  }
  return true;
}

final activeStaffListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final staffList = await ref.watch(staffListProvider.future);
  return staffList.where((s) => isStaffActive(s)).toList();
});


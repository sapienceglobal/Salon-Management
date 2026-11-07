import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/settings_repository.dart';

// --- Business & Config State ---
class SettingsDataNotifier extends AsyncNotifier<Map<String, dynamic>> {
  @override
  Future<Map<String, dynamic>> build() async {
    return _fetchSettings();
  }

  Future<Map<String, dynamic>> _fetchSettings() async {
    return await ref.read(settingsRepositoryProvider).getSettings();
  }

  Future<void> updateBusiness(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).updateBusiness(data);
      state = AsyncValue.data(await _fetchSettings());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateConfig(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).updateConfig(data);
      state = AsyncValue.data(await _fetchSettings());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final settingsDataProvider =
    AsyncNotifierProvider<SettingsDataNotifier, Map<String, dynamic>>(() {
      return SettingsDataNotifier();
    });

// --- Commission Profiles State ---
class CommissionProfilesNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    return ref.read(settingsRepositoryProvider).getCommissionProfiles();
  }

  Future<void> createProfile(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).createCommissionProfile(data);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateProfile(int id, Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await ref
          .read(settingsRepositoryProvider)
          .updateCommissionProfile(id, data);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> deleteProfile(int id) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).deleteCommissionProfile(id);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final commissionProfilesProvider =
    AsyncNotifierProvider<CommissionProfilesNotifier, List<dynamic>>(() {
      return CommissionProfilesNotifier();
    });

// --- Rooms State ---
class RoomsNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    return ref.read(settingsRepositoryProvider).getRooms();
  }

  Future<void> createRoom(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).createRoom(data);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateRoom(int id, Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).updateRoom(id, data);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> deleteRoom(int id) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).deleteRoom(id);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final roomsProvider = AsyncNotifierProvider<RoomsNotifier, List<dynamic>>(() {
  return RoomsNotifier();
});

// --- Notifications State ---
class NotificationsNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    return ref.read(settingsRepositoryProvider).getNotificationTemplates();
  }

  Future<void> upsertTemplate(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await ref
          .read(settingsRepositoryProvider)
          .upsertNotificationTemplate(data);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> deleteTemplate(int id) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).deleteNotificationTemplate(id);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<dynamic>>(() {
      return NotificationsNotifier();
    });

// --- Users (Staff) State ---
class UsersNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    return ref.read(settingsRepositoryProvider).getUsers();
  }

  Future<void> createUser(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).createUser(data);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateUser(int id, Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).updateUser(id, data);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> deleteUser(int id) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(settingsRepositoryProvider).deleteUser(id);
      state = AsyncValue.data(await build());
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final usersProvider = AsyncNotifierProvider<UsersNotifier, List<dynamic>>(() {
  return UsersNotifier();
});

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'home_tab.dart';
import '../../../../core/network/socket_client.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(socketServiceProvider);

    return const Scaffold(
      backgroundColor: Color(0xFFFAFAFA),
      body: HomeTab(),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class LogoIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paintBlack = Paint()
      ..color = const Color(0xFF1A1A2E)
      ..style = PaintingStyle.fill;

    final paintPink = Paint()
      ..color = const Color(0xFFE91E63)
      ..style = PaintingStyle.fill;

    // Left black fold (chevron pointing left)
    final pathBlack = Path();
    pathBlack.moveTo(size.width * 0.6, 0);
    pathBlack.lineTo(0, size.height * 0.25);
    pathBlack.lineTo(size.width * 0.3, size.height * 0.55);
    pathBlack.lineTo(size.width * 0.9, size.height * 0.3);
    pathBlack.close();

    // Bottom black fold
    final pathBlack2 = Path();
    pathBlack2.moveTo(size.width * 0.3, size.height * 0.65);
    pathBlack2.lineTo(0, size.height * 0.45);
    pathBlack2.lineTo(size.width * 0.1, size.height * 0.85);
    pathBlack2.lineTo(size.width * 0.6, size.height);
    pathBlack2.close();

    // Pink blocks
    final pathPink1 = Path();
    pathPink1.moveTo(size.width * 0.35, size.height * 0.6);
    pathPink1.lineTo(size.width * 0.95, size.height * 0.35);
    pathPink1.lineTo(size.width, size.height * 0.65);
    pathPink1.lineTo(size.width * 0.4, size.height * 0.95);
    pathPink1.close();

    // Draw in order
    canvas.drawPath(pathBlack, paintBlack);
    canvas.drawPath(pathBlack2, paintBlack);
    canvas.drawPath(pathPink1, paintPink);

    // Small top pink dot/accent
    canvas.drawRect(
      Rect.fromLTWH(size.width * 0.75, 0, size.width * 0.2, size.height * 0.2),
      paintPink,
    );
    // Vertical pink pillar
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.75,
        size.height * 0.3,
        size.width * 0.2,
        size.height * 0.7,
      ),
      paintPink,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

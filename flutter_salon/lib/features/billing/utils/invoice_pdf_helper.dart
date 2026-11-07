import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import 'package:open_file/open_file.dart';

class InvoicePdfHelper {
  static Future<Uint8List> generateInvoicePdf(
    Map<String, dynamic> invoice, [
    Map<String, dynamic>? business,
  ]) async {
    final pdf = pw.Document();

    final businessName = business?['name']?.toString() ?? 'Salon Time';
    final businessAddress = business?['address']?.toString() ?? '';
    final businessPhone = business?['phone']?.toString() ?? '';
    final businessGst = business?['gst_number']?.toString() ?? '';

    final invoiceNumber = invoice['invoice_number'] ?? 'INV-#${invoice['id']}';
    
    DateTime invoiceDate = DateTime.now();
    try {
      if (invoice['created_at'] != null) {
        invoiceDate = DateTime.parse(invoice['created_at'].toString());
      }
    } catch (_) {}
    final dateStr = DateFormat('dd MMM yyyy, hh:mm a').format(invoiceDate);

    final customerName = invoice['customer'] != null && invoice['customer']['first_name'] != null
        ? '${invoice['customer']['first_name']} ${invoice['customer']['last_name'] ?? ''}'.trim()
        : (invoice['customer_first_name'] != null
            ? '${invoice['customer_first_name']} ${invoice['customer_last_name'] ?? ''}'.trim()
            : 'Walk-in Customer');

    final customerPhone = invoice['customer']?['phone'] ?? invoice['customer_phone'] ?? 'N/A';

    final items = (invoice['items'] as List<dynamic>?) ?? [];
    final subtotal = invoice['subtotal'] ?? 0;
    final discount = invoice['discount_amount'] ?? 0;
    final tax = invoice['tax_amount'] ?? 0;
    final total = invoice['total_amount'] ?? 0;
    final dueAmount = double.tryParse(invoice['due_amount']?.toString() ?? '0') ?? 0.0;
    final isPaid = dueAmount <= 0;

    String paymentMethod = 'Cash';
    String transactionId = 'TXN-${invoice['id'] ?? '001'}';
    if (invoice['payments'] != null && (invoice['payments'] as List).isNotEmpty) {
      final p = invoice['payments'][0];
      paymentMethod = (p['payment_method'] ?? 'Cash').toString().toUpperCase();
      if (p['transaction_id'] != null && p['transaction_id'].toString().isNotEmpty) {
        transactionId = p['transaction_id'].toString();
      }
    } else if (invoice['payment_method'] != null) {
      paymentMethod = invoice['payment_method'].toString().toUpperCase();
    }

    final primaryColor = PdfColor.fromHex('#E91E63');
    final darkColor = PdfColor.fromHex('#1A1A2E');
    final textMuted = PdfColor.fromHex('#64748B');
    final borderColor = PdfColor.fromHex('#F1F5F9');
    final lightBg = PdfColor.fromHex('#FFF0F5');

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        businessName,
                        style: pw.TextStyle(
                          fontSize: 22,
                          fontWeight: pw.FontWeight.bold,
                          color: darkColor,
                        ),
                      ),
                      if (businessGst.isNotEmpty) ...[
                        pw.SizedBox(height: 2),
                        pw.Text(
                          'GSTIN: $businessGst',
                          style: pw.TextStyle(
                            fontSize: 9,
                            fontWeight: pw.FontWeight.bold,
                            color: primaryColor,
                          ),
                        ),
                      ],
                      if (businessAddress.isNotEmpty) ...[
                        pw.SizedBox(height: 2),
                        pw.Text(
                          businessAddress,
                          style: pw.TextStyle(fontSize: 8, color: textMuted),
                        ),
                      ],
                      if (businessPhone.isNotEmpty) ...[
                        pw.SizedBox(height: 2),
                        pw.Text(
                          'Phone: $businessPhone',
                          style: pw.TextStyle(fontSize: 8, color: textMuted),
                        ),
                      ],
                    ],
                  ),
                  pw.Container(
                    padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: pw.BoxDecoration(
                      color: lightBg,
                      borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Text(
                          'INVOICE',
                          style: pw.TextStyle(
                            fontSize: 10,
                            fontWeight: pw.FontWeight.bold,
                            color: primaryColor,
                          ),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text(
                          '#$invoiceNumber',
                          style: pw.TextStyle(
                            fontSize: 13,
                            fontWeight: pw.FontWeight.bold,
                            color: darkColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 18),
              pw.Divider(color: borderColor, thickness: 1),
              pw.SizedBox(height: 12),

              // Branch & Customer Info
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'Downtown Branch',
                        style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: darkColor),
                      ),
                      pw.SizedBox(height: 3),
                      pw.Text(
                        '123 Main Street, Downtown, New Delhi - 110001',
                        style: pw.TextStyle(fontSize: 9, color: textMuted),
                      ),
                      pw.SizedBox(height: 2),
                      pw.Text(
                        'Phone: +91 98765 43210',
                        style: pw.TextStyle(fontSize: 9, color: textMuted),
                      ),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text(
                        'Billed To:',
                        style: pw.TextStyle(fontSize: 9, color: textMuted, fontWeight: pw.FontWeight.bold),
                      ),
                      pw.SizedBox(height: 3),
                      pw.Text(
                        customerName,
                        style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: darkColor),
                      ),
                      pw.SizedBox(height: 2),
                      pw.Text(
                        customerPhone,
                        style: pw.TextStyle(fontSize: 9, color: textMuted),
                      ),
                      pw.SizedBox(height: 3),
                      pw.Text(
                        dateStr,
                        style: pw.TextStyle(fontSize: 9, color: textMuted),
                      ),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 20),

              // Items Table
              pw.Table(
                border: pw.TableBorder(
                  bottom: pw.BorderSide(color: borderColor, width: 1),
                  horizontalInside: pw.BorderSide(color: borderColor, width: 0.5),
                ),
                columnWidths: {
                  0: const pw.FlexColumnWidth(4),
                  1: const pw.FlexColumnWidth(1),
                  2: const pw.FlexColumnWidth(2),
                  3: const pw.FlexColumnWidth(2),
                },
                children: [
                  pw.TableRow(
                    decoration: pw.BoxDecoration(color: lightBg),
                    children: [
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8),
                        child: pw.Text('Item Description', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8),
                        child: pw.Text('Qty', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8),
                        child: pw.Text('Price', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                      ),
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(8),
                        child: pw.Text('Amount', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                      ),
                    ],
                  ),
                  ...items.map((item) {
                    final name = item['item_name'] ?? item['name'] ?? 'Service';
                    final qty = item['quantity'] ?? 1;
                    final price = item['unit_price'] ?? item['price'] ?? 0;
                    final totalItem = item['total_price'] ?? ((double.tryParse(price.toString()) ?? 0.0) * qty);

                    return pw.TableRow(
                      children: [
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(8),
                          child: pw.Text(name.toString(), style: pw.TextStyle(fontSize: 9, color: darkColor, fontWeight: pw.FontWeight.bold)),
                        ),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(8),
                          child: pw.Text('$qty', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 9, color: darkColor)),
                        ),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(8),
                          child: pw.Text('Rs. $price', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: 9, color: darkColor)),
                        ),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(8),
                          child: pw.Text('Rs. $totalItem', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: darkColor)),
                        ),
                      ],
                    );
                  }),
                ],
              ),
              pw.SizedBox(height: 16),

              // Totals
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Container(
                    width: 220,
                    child: pw.Column(
                      children: [
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text('Subtotal:', style: pw.TextStyle(fontSize: 9, color: textMuted)),
                            pw.Text('Rs. $subtotal', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: darkColor)),
                          ],
                        ),
                        if ((double.tryParse(discount.toString()) ?? 0) > 0) ...[
                          pw.SizedBox(height: 4),
                          pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                            children: [
                              pw.Text('Discount:', style: pw.TextStyle(fontSize: 9, color: PdfColor.fromHex('#10B981'))),
                              pw.Text('- Rs. $discount', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#10B981'))),
                            ],
                          ),
                        ],
                        pw.SizedBox(height: 4),
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text('GST (18%):', style: pw.TextStyle(fontSize: 9, color: textMuted)),
                            pw.Text('Rs. $tax', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: darkColor)),
                          ],
                        ),
                        pw.SizedBox(height: 8),
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: pw.BoxDecoration(
                            color: lightBg,
                            borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                          ),
                          child: pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                            children: [
                              pw.Text('Total Amount:', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                              pw.Text('Rs. $total', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 20),

              // Payment Info Box
              pw.Container(
                padding: const pw.EdgeInsets.all(12),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('#F8FAFC'),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                  border: pw.Border.all(color: borderColor),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text('Payment Method: $paymentMethod', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: darkColor)),
                        pw.SizedBox(height: 3),
                        pw.Text('Transaction ID: $transactionId', style: pw.TextStyle(fontSize: 8, color: textMuted)),
                      ],
                    ),
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: pw.BoxDecoration(
                        color: isPaid ? PdfColor.fromHex('#ECFDF5') : PdfColor.fromHex('#FEF3C7'),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(12)),
                      ),
                      child: pw.Text(
                        isPaid ? 'PAID' : 'DUE: Rs. $dueAmount',
                        style: pw.TextStyle(
                          fontSize: 9,
                          fontWeight: pw.FontWeight.bold,
                          color: isPaid ? PdfColor.fromHex('#10B981') : PdfColor.fromHex('#D97706'),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              pw.Spacer(),

              // Thank you note
              pw.Center(
                child: pw.Column(
                  children: [
                    pw.Text(
                      'Thank You!',
                      style: pw.TextStyle(
                        fontSize: 18,
                        fontWeight: pw.FontWeight.bold,
                        color: primaryColor,
                        fontStyle: pw.FontStyle.italic,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      'We look forward to serving you again at Salon Time!',
                      style: pw.TextStyle(fontSize: 9, color: textMuted),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 12),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  static Future<void> printInvoice(BuildContext context, Map<String, dynamic> invoice, [Map<String, dynamic>? business]) async {
    try {
      final invoiceNumber = invoice['invoice_number'] ?? 'INV-#${invoice['id']}';
      final pdfBytes = await generateInvoicePdf(invoice, business);
      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdfBytes,
        name: 'Invoice_$invoiceNumber',
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Print error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  static Future<void> shareInvoice(BuildContext context, Map<String, dynamic> invoice, [Map<String, dynamic>? business]) async {
    try {
      final invoiceNumber = invoice['invoice_number'] ?? 'INV-#${invoice['id']}';
      final pdfBytes = await generateInvoicePdf(invoice, business);
      
      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/Invoice_$invoiceNumber.pdf');
      await file.writeAsBytes(pdfBytes, flush: true);

      final total = invoice['total_amount'] ?? 0;
      final salonName = business?['name'] ?? 'Salon Time';
      // ignore: deprecated_member_use
      await Share.shareXFiles(
        [XFile(file.path, mimeType: 'application/pdf', name: 'Invoice_$invoiceNumber.pdf')],
        text: 'Invoice #$invoiceNumber for Rs. $total from $salonName.',
        subject: 'Invoice #$invoiceNumber - $salonName',
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Share error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  static Future<void> downloadInvoice(BuildContext context, Map<String, dynamic> invoice, [Map<String, dynamic>? business]) async {
    try {
      final invoiceNumber = invoice['invoice_number'] ?? 'INV-#${invoice['id']}';
      final pdfBytes = await generateInvoicePdf(invoice, business);
      
      Directory? dir;
      try {
        dir = await getDownloadsDirectory();
      } catch (_) {}
      dir ??= await getApplicationDocumentsDirectory();

      final filePath = '${dir.path}/Invoice_$invoiceNumber.pdf';
      final file = File(filePath);
      await file.writeAsBytes(pdfBytes, flush: true);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Invoice saved: Invoice_$invoiceNumber.pdf'),
            backgroundColor: const Color(0xFF10B981),
            action: SnackBarAction(
              label: 'Open',
              textColor: Colors.white,
              onPressed: () {
                OpenFile.open(filePath);
              },
            ),
          ),
        );
      }
      // Automatically attempt to open the downloaded file
      await OpenFile.open(filePath);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Download error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

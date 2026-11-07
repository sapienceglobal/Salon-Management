import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/core/theme/app_colors.dart';
import 'package:flutter_salon/features/inventory/data/inventory_repository.dart';
import '../../../../core/utils/form_validators.dart';

class AdjustStockDialog extends ConsumerStatefulWidget {
  final int productId;
  final int currentStock;
  final String productName;

  const AdjustStockDialog({
    super.key,
    required this.productId,
    required this.currentStock,
    required this.productName,
  });

  @override
  ConsumerState<AdjustStockDialog> createState() => _AdjustStockDialogState();
}

class _AdjustStockDialogState extends ConsumerState<AdjustStockDialog> {
  final _formKey = GlobalKey<FormState>();
  String _type = 'add';
  final _quantityController = TextEditingController();
  final _reasonController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _quantityController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final repository = ref.read(inventoryRepositoryProvider);
      await repository.adjustStock(
        widget.productId,
        _type,
        int.parse(_quantityController.text),
        _reasonController.text,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Stock adjusted successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error: ${e.toString().replaceAll('Exception: ', '')}',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Adjust Stock: ${widget.productName}'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Current Stock: ${widget.currentStock}',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            SizedBox(height: 16.h),
            Row(
              children: [
                Expanded(
                  child: RadioListTile<String>(
                    title: Text('Add'),
                    value: 'add',
                    groupValue: _type,
                    onChanged: (val) => setState(() => _type = val!),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                Expanded(
                  child: RadioListTile<String>(
                    title: Text('Remove'),
                    value: 'remove',
                    groupValue: _type,
                    onChanged: (val) => setState(() => _type = val!),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
            SizedBox(height: 8.h),
            TextFormField(
              controller: _quantityController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Quantity',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                ),
              ),
              validator: (val) {
                if (val == null || val.isEmpty)
                  return 'Please enter a quantity';
                if (int.tryParse(val) == null || int.parse(val) <= 0) {
                  return 'Please enter a valid positive number';
                }
                if (_type == 'remove' && int.parse(val) > widget.currentStock) {
                  return 'Cannot remove more than current stock (${widget.currentStock})';
                }
                return null;
              },
            ),
            SizedBox(height: 16.h),
            TextFormField(
              controller: _reasonController,
              decoration: InputDecoration(
                labelText: 'Reason (e.g., New stock, Damaged, Expired)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                ),
              ),
              validator: FormValidators.required('Reason'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Cancel'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
          onPressed: _isLoading ? null : _submit,
          child: _isLoading
              ? SizedBox(
                  width: 20.w,
                  height: 20.h,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text('Confirm', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}

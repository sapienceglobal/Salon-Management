import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_salon/features/staff/presentation/providers/staff_profile_provider.dart';
import 'package:flutter_salon/features/staff/data/staff_provider.dart';

class StaffDocumentsTab extends ConsumerStatefulWidget {
  final int staffId;
  const StaffDocumentsTab({super.key, required this.staffId});

  @override
  ConsumerState<StaffDocumentsTab> createState() => _StaffDocumentsTabState();
}

class _StaffDocumentsTabState extends ConsumerState<StaffDocumentsTab> {
  bool _isUploading = false;

  void _showUploadDialog() async {
    final picker = ImagePicker();
    XFile? pickedFile;
    final nameController = TextEditingController();
    String docType = 'Identity Proof';

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20.w,
                right: 20.w,
                top: 24.h,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24.h,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Upload Staff Document',
                        style: GoogleFonts.poppins(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),

                  // File Picker Trigger
                  Text(
                    'Select Document File',
                    style: GoogleFonts.inter(fontSize: 13.sp, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
                  ),
                  SizedBox(height: 6.h),
                  InkWell(
                    onTap: () async {
                      final img = await picker.pickImage(source: ImageSource.gallery);
                      if (img != null) {
                        setModalState(() {
                          pickedFile = img;
                          if (nameController.text.isEmpty) {
                            nameController.text = img.name.split('.').first;
                          }
                        });
                      }
                    },
                    borderRadius: BorderRadius.circular(12.r),
                    child: Container(
                      padding: EdgeInsets.all(16.w),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12.r),
                        border: Border.all(
                          color: pickedFile != null ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
                          width: pickedFile != null ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            pickedFile != null ? Icons.check_circle_rounded : Icons.upload_file_rounded,
                            color: pickedFile != null ? const Color(0xFF10B981) : const Color(0xFFE91E63),
                            size: 24.sp,
                          ),
                          SizedBox(width: 12.w),
                          Expanded(
                            child: Text(
                              pickedFile != null ? pickedFile!.name : 'Tap to browse document (PDF, PNG, JPG)',
                              style: GoogleFonts.inter(
                                fontSize: 13.5.sp,
                                color: pickedFile != null ? const Color(0xFF1E293B) : const Color(0xFF64748B),
                                fontWeight: pickedFile != null ? FontWeight.w600 : FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SizedBox(height: 14.h),

                  // Document Name
                  Text('Document Name', style: GoogleFonts.inter(fontSize: 13.sp, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                  SizedBox(height: 6.h),
                  TextField(
                    controller: nameController,
                    decoration: InputDecoration(
                      hintText: 'e.g. Aadhaar Card, Employment Contract, Degree',
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                  ),
                  SizedBox(height: 14.h),

                  // Document Type Dropdown
                  Text('Document Type', style: GoogleFonts.inter(fontSize: 13.sp, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                  SizedBox(height: 6.h),
                  DropdownButtonFormField<String>(
                    value: docType,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'Identity Proof', child: Text('Identity Proof')),
                      DropdownMenuItem(value: 'Employment Contract', child: Text('Employment Contract')),
                      DropdownMenuItem(value: 'Certification / License', child: Text('Certification / License')),
                      DropdownMenuItem(value: 'Address Proof', child: Text('Address Proof')),
                      DropdownMenuItem(value: 'Other Document', child: Text('Other Document')),
                    ],
                    onChanged: (val) {
                      if (val != null) setModalState(() => docType = val);
                    },
                  ),
                  SizedBox(height: 24.h),

                  SizedBox(
                    width: double.infinity,
                    height: 48.h,
                    child: ElevatedButton(
                      onPressed: pickedFile == null
                          ? null
                          : () async {
                              final messenger = ScaffoldMessenger.of(context);
                              Navigator.pop(ctx);
                              setState(() => _isUploading = true);
                              try {
                                await ref.read(staffRepositoryProvider).uploadStaffDocument(
                                  staffId: widget.staffId,
                                  filePath: pickedFile!.path,
                                  docName: nameController.text.trim().isEmpty ? pickedFile!.name : nameController.text.trim(),
                                  docType: docType,
                                );
                                ref.invalidate(staffProfileDocumentsProvider(widget.staffId));
                                if (mounted) {
                                  messenger.showSnackBar(
                                    const SnackBar(
                                      content: Text('Document uploaded successfully!'),
                                      backgroundColor: Color(0xFF10B981),
                                    ),
                                  );
                                }
                              } catch (e) {
                                if (mounted) {
                                  messenger.showSnackBar(
                                    SnackBar(
                                      content: Text('Upload failed: ${e.toString().replaceAll("Exception: ", "")}'),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                }
                              } finally {
                                if (mounted) setState(() => _isUploading = false);
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE91E63),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
                        elevation: 0,
                      ),
                      child: Text('Upload Now', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14.sp, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _confirmDeleteDocument(int docId, String docName) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete Document', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete "$docName"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ref.read(staffRepositoryProvider).deleteStaffDocument(staffId: widget.staffId, docId: docId);
        ref.invalidate(staffProfileDocumentsProvider(widget.staffId));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Document deleted successfully'), backgroundColor: Color(0xFF10B981)),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final docsAsync = ref.watch(staffProfileDocumentsProvider(widget.staffId));

    return docsAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: Color(0xFFE91E63)),
      ),
      error: (err, stack) => Center(
        child: Padding(
          padding: EdgeInsets.all(20.w),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, color: Colors.red, size: 40.sp),
              SizedBox(height: 8.h),
              Text('Failed to load documents: $err', style: GoogleFonts.inter(color: Colors.red), textAlign: TextAlign.center),
              SizedBox(height: 12.h),
              ElevatedButton(
                onPressed: () => ref.invalidate(staffProfileDocumentsProvider(widget.staffId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (docs) {
        return Padding(
          padding: EdgeInsets.all(20.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Staff Documents',
                        style: GoogleFonts.poppins(
                          fontSize: 18.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      Text(
                        '${docs.length} files attached',
                        style: GoogleFonts.inter(fontSize: 12.sp, color: const Color(0xFF64748B)),
                      ),
                    ],
                  ),
                  ElevatedButton.icon(
                    onPressed: _isUploading ? null : _showUploadDialog,
                    icon: Icon(Icons.upload_file_rounded, size: 16.sp),
                    label: Text('Upload', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13.sp)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE91E63),
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
                      elevation: 0,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 16.h),

              if (docs.isEmpty)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.folder_open_rounded, size: 48.sp, color: const Color(0xFFCBD5E1)),
                        SizedBox(height: 12.h),
                        Text(
                          'No documents uploaded for this staff member.',
                          style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 14.sp),
                        ),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    itemCount: docs.length,
                    itemBuilder: (context, index) {
                      final item = docs[index];
                      final docId = item['id'] as int;
                      final name = item['document_name']?.toString() ?? 'Document';
                      final type = item['document_type']?.toString() ?? 'Identity Proof';
                      final size = item['file_size']?.toString() ?? '';
                      final fileUrl = item['file_url']?.toString();
                      final fullUrl = (fileUrl != null && fileUrl.startsWith('/')) ? '$kBaseMediaUrl$fileUrl' : fileUrl;

                      return Container(
                        margin: EdgeInsets.only(bottom: 12.h),
                        padding: EdgeInsets.all(16.w),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16.r),
                          border: Border.all(color: const Color(0xFFF1F5F9)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.02),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(10.w),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Icon(Icons.description_rounded, color: const Color(0xFF3B82F6), size: 22.sp),
                            ),
                            SizedBox(width: 14.w),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14.sp,
                                      color: const Color(0xFF1E293B),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  SizedBox(height: 3.h),
                                  Row(
                                    children: [
                                      Text(
                                        type,
                                        style: GoogleFonts.inter(fontSize: 11.5.sp, color: const Color(0xFF64748B)),
                                      ),
                                      if (size.isNotEmpty) ...[
                                        Text('  •  ', style: GoogleFonts.inter(fontSize: 11.5.sp, color: const Color(0xFFCBD5E1))),
                                        Text(size, style: GoogleFonts.inter(fontSize: 11.5.sp, color: const Color(0xFF64748B))),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (fullUrl != null && fullUrl.isNotEmpty)
                              IconButton(
                                icon: const Icon(Icons.remove_red_eye_outlined, color: Color(0xFF3B82F6)),
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('File location: $fullUrl')),
                                  );
                                },
                              ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444)),
                              onPressed: () => _confirmDeleteDocument(docId, name),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

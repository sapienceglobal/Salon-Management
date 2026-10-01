import { productService } from './products.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { deleteUploadedFile } from '../../utils/fileUpload.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { products, meta } = await productService.getAll(req.user.business_id, req.query);
  ApiResponse.ok('Products fetched', products, meta).send(res);
});
export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id, req.user.business_id);
  ApiResponse.ok('Product fetched', product).send(res);
});
export const createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.file) {
    payload.image_url = `/uploads/${req.file.filename}`;
  }
  const product = await productService.create(req.user.business_id, payload);
  ApiResponse.created('Product created', product).send(res);
});
export const updateProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.file) {
    const existing = await productService.getById(req.params.id, req.user.business_id).catch(() => null);
    if (existing?.image_url) {
      deleteUploadedFile(existing.image_url);
    }
    payload.image_url = `/uploads/${req.file.filename}`;
  }
  const product = await productService.update(req.params.id, req.user.business_id, payload);
  ApiResponse.ok('Product updated', product).send(res);
});
export const updateStock = asyncHandler(async (req, res) => {
  const product = await productService.updateStock(req.params.id, req.user.business_id, req.body.quantity);
  ApiResponse.ok('Stock updated', product).send(res);
});
export const deleteProduct = asyncHandler(async (req, res) => {
  if (req.query.permanent === 'true') {
    const existing = await productService.getById(req.params.id, req.user.business_id).catch(() => null);
    if (existing?.image_url) {
      deleteUploadedFile(existing.image_url);
    }
    await productService.delete(req.params.id, req.user.business_id);
    return ApiResponse.ok('Product permanently deleted').send(res);
  }
  await productService.update(req.params.id, req.user.business_id, { is_active: false });
  ApiResponse.ok('Product deactivated').send(res);
});
export const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids) && ids.length > 0) {
    for (const id of ids) {
      const existing = await productService.getById(id, req.user.business_id).catch(() => null);
      if (existing?.image_url) {
        deleteUploadedFile(existing.image_url);
      }
    }
  }
  const count = await productService.bulkDelete(req.user.business_id, ids);
  ApiResponse.ok(`${count} products deleted`, { count }).send(res);
});
export const bulkStatusProducts = asyncHandler(async (req, res) => {
  const count = await productService.bulkUpdateStatus(req.user.business_id, req.body.ids, req.body.is_active);
  ApiResponse.ok(`${count} products updated`, { count }).send(res);
});
export const getLowStock = asyncHandler(async (req, res) => {
  const products = await productService.getLowStock(req.user.business_id);
  ApiResponse.ok('Low stock products', products).send(res);
});

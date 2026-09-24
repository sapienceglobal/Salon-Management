import { productService } from './products.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

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
  await productService.delete(req.params.id, req.user.business_id);
  ApiResponse.ok('Product deactivated').send(res);
});
export const getLowStock = asyncHandler(async (req, res) => {
  const products = await productService.getLowStock(req.user.business_id);
  ApiResponse.ok('Low stock products', products).send(res);
});

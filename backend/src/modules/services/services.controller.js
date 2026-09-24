import { serviceService } from './services.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// Categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await serviceService.getAllCategories(req.user.business_id);
  ApiResponse.ok('Categories fetched', categories).send(res);
});
export const createCategory = asyncHandler(async (req, res) => {
  const cat = await serviceService.createCategory(req.user.business_id, req.body);
  ApiResponse.created('Category created', cat).send(res);
});
export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await serviceService.updateCategory(req.params.id, req.user.business_id, req.body);
  ApiResponse.ok('Category updated', cat).send(res);
});
export const deleteCategory = asyncHandler(async (req, res) => {
  await serviceService.deleteCategory(req.params.id, req.user.business_id);
  ApiResponse.ok('Category deactivated').send(res);
});

// Services
export const getServices = asyncHandler(async (req, res) => {
  const services = await serviceService.getAll(req.user.business_id, req.query.active_only === 'true');
  ApiResponse.ok('Services fetched', services).send(res);
});
export const getService = asyncHandler(async (req, res) => {
  const service = await serviceService.getById(req.params.id, req.user.business_id);
  ApiResponse.ok('Service fetched', service).send(res);
});
export const getServicesByCategory = asyncHandler(async (req, res) => {
  const services = await serviceService.getByCategory(req.params.id, req.user.business_id);
  ApiResponse.ok('Services by category fetched', services).send(res);
});
export const createService = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  let allImages = [];
  if (data.existing_images) {
    allImages = allImages.concat(data.existing_images.split(',').filter(Boolean));
  }
  delete data.existing_images;
  if (req.files && req.files.length > 0) {
    allImages = allImages.concat(req.files.map(f => `/uploads/${f.filename}`));
  }
  data.image_url = allImages.length > 0 ? allImages.join(',') : null;
  const service = await serviceService.create(req.user.business_id, data);
  ApiResponse.created('Service created', service).send(res);
});
export const updateService = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  let allImages = [];
  if (data.existing_images) {
    allImages = allImages.concat(data.existing_images.split(',').filter(Boolean));
  }
  delete data.existing_images;
  if (req.files && req.files.length > 0) {
    allImages = allImages.concat(req.files.map(f => `/uploads/${f.filename}`));
  }
  data.image_url = allImages.length > 0 ? allImages.join(',') : null;
  const service = await serviceService.update(req.params.id, req.user.business_id, data);
  ApiResponse.ok('Service updated', service).send(res);
});
export const deleteService = asyncHandler(async (req, res) => {
  await serviceService.delete(req.params.id, req.user.business_id);
  ApiResponse.ok('Service deactivated').send(res);
});

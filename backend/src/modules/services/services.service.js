import { serviceRepository } from './services.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanObject } from '../../utils/helpers.js';

const ALLOWED_SERVICE_FIELDS = [
  'category_id',
  'name',
  'description',
  'duration_minutes',
  'price',
  'cost_price',
  'hsn_sac_code',
  'tax_percentage',
  'is_active',
  'image_url',
  'gender_target',
  'sort_order',
];

function filterServiceData(data) {
  const filtered = {};
  for (const key of ALLOWED_SERVICE_FIELDS) {
    if (key in data && data[key] !== undefined) {
      filtered[key] = data[key];
    }
  }
  return filtered;
}

class ServiceService {
  // Categories
  async getAllCategories(businessId) { return serviceRepository.findAllCategories(businessId); }
  async getCategoryById(id, businessId) {
    const cat = await serviceRepository.findCategoryById(id, businessId);
    if (!cat) throw ApiError.notFound('Service category not found');
    return cat;
  }
  async createCategory(businessId, data) {
    const payload = { ...data };
    if (payload.display_order !== undefined && payload.sort_order === undefined) {
      payload.sort_order = payload.display_order;
    }
    delete payload.display_order;
    return serviceRepository.createCategory({ ...payload, business_id: businessId });
  }
  async updateCategory(id, businessId, data) {
    await this.getCategoryById(id, businessId);
    const payload = { ...data };
    if (payload.display_order !== undefined && payload.sort_order === undefined) {
      payload.sort_order = payload.display_order;
    }
    delete payload.display_order;
    return serviceRepository.updateCategory(id, businessId, cleanObject(payload));
  }
  async deleteCategory(id, businessId) { await this.getCategoryById(id, businessId); await serviceRepository.deleteCategory(id, businessId); }

  // Services
  async getAll(businessId, activeOnly = false) { return serviceRepository.findAll(businessId, activeOnly); }
  async getById(id, businessId) {
    const service = await serviceRepository.findById(id, businessId);
    if (!service) throw ApiError.notFound('Service not found');
    return service;
  }
  async getByCategory(categoryId, businessId, activeOnly = false) { return serviceRepository.findByCategory(categoryId, businessId, activeOnly); }
  async toggleActive(id, businessId) {
    const service = await this.getById(id, businessId);
    const newStatus = !service.is_active;
    await serviceRepository.update(id, businessId, { is_active: newStatus });
    return this.getById(id, businessId);
  }

  async create(businessId, data) {
    const payload = filterServiceData(data);
    return serviceRepository.create({ ...payload, business_id: businessId });
  }
  async update(id, businessId, data) {
    await this.getById(id, businessId);
    const payload = filterServiceData(data);
    return serviceRepository.update(id, businessId, cleanObject(payload));
  }
  async delete(id, businessId) { await this.getById(id, businessId); await serviceRepository.delete(id, businessId); }
  async bulkDelete(ids, businessId) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    return serviceRepository.bulkDelete(ids, businessId);
  }
  async bulkUpdateStatus(ids, businessId, isActive) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    return serviceRepository.bulkUpdateStatus(ids, businessId, isActive);
  }
}

export const serviceService = new ServiceService();

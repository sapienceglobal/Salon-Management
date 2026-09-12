import { serviceRepository } from './services.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanObject } from '../../utils/helpers.js';

class ServiceService {
  // Categories
  async getAllCategories(businessId) { return serviceRepository.findAllCategories(businessId); }
  async getCategoryById(id, businessId) {
    const cat = await serviceRepository.findCategoryById(id, businessId);
    if (!cat) throw ApiError.notFound('Service category not found');
    return cat;
  }
  async createCategory(businessId, data) { return serviceRepository.createCategory({ ...data, business_id: businessId }); }
  async updateCategory(id, businessId, data) {
    await this.getCategoryById(id, businessId);
    return serviceRepository.updateCategory(id, businessId, cleanObject(data));
  }
  async deleteCategory(id, businessId) { await this.getCategoryById(id, businessId); await serviceRepository.deleteCategory(id, businessId); }

  // Services
  async getAll(businessId, activeOnly = false) { return serviceRepository.findAll(businessId, activeOnly); }
  async getById(id, businessId) {
    const service = await serviceRepository.findById(id, businessId);
    if (!service) throw ApiError.notFound('Service not found');
    return service;
  }
  async getByCategory(categoryId, businessId) { return serviceRepository.findByCategory(categoryId, businessId); }
  async create(businessId, data) { return serviceRepository.create({ ...data, business_id: businessId }); }
  async update(id, businessId, data) {
    await this.getById(id, businessId);
    return serviceRepository.update(id, businessId, cleanObject(data));
  }
  async delete(id, businessId) { await this.getById(id, businessId); await serviceRepository.delete(id, businessId); }
}

export const serviceService = new ServiceService();

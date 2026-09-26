import { productRepository } from './products.repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanObject } from '../../utils/helpers.js';

class ProductService {
  async getAll(businessId, query) { return productRepository.findAll(businessId, query); }

  async getById(id, businessId) {
    const product = await productRepository.findById(id, businessId);
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  }

  async create(businessId, data) {
    if (data.sku) {
      const existing = await productRepository.findBySku(data.sku, businessId);
      if (existing) throw ApiError.conflict('A product with this SKU already exists');
    }
    // 'supplier' column might not exist in db, so we strip it to prevent Unknown column error
    const { supplier, ...dbData } = data;
    try {
      return await productRepository.create({ ...dbData, business_id: businessId });
    } catch (err) {
      if (err.message && err.message.includes('Unknown column')) {
        const match = err.message.match(/Unknown column '([^']+)'/);
        if (match && match[1]) {
          delete dbData[match[1]];
          return await productRepository.create({ ...dbData, business_id: businessId });
        }
      }
      throw err;
    }
  }

  async update(id, businessId, data) {
    await this.getById(id, businessId);
    if (data.sku) {
      const existing = await productRepository.findBySku(data.sku, businessId);
      if (existing && existing.id !== id) throw ApiError.conflict('SKU already in use');
    }
    const { supplier, ...dbData } = data;
    try {
      return await productRepository.update(id, businessId, cleanObject(dbData));
    } catch (err) {
      if (err.message && err.message.includes('Unknown column')) {
        const match = err.message.match(/Unknown column '([^']+)'/);
        if (match && match[1]) {
          delete dbData[match[1]];
          return await productRepository.update(id, businessId, cleanObject(dbData));
        }
      }
      throw err;
    }
  }

  async updateStock(id, businessId, quantityChange) {
    const product = await this.getById(id, businessId);
    if (product.stock_quantity + quantityChange < 0) throw ApiError.badRequest('Insufficient stock');
    return productRepository.updateStock(id, businessId, quantityChange);
  }

  async delete(id, businessId) { await this.getById(id, businessId); await productRepository.delete(id, businessId); }
  async getLowStock(businessId) { return productRepository.getLowStock(businessId); }
}

export const productService = new ProductService();

import { db } from '../../config/database.js';

class ServiceRepository {
  // ===== Categories =====
  async findAllCategories(businessId) {
    return db('service_categories')
      .where({ business_id: businessId }).orderBy('sort_order', 'asc');
  }
  async findCategoryById(id, businessId) {
    return db('service_categories').where({ id, business_id: businessId }).first();
  }
  async createCategory(data) {
    const [id] = await db('service_categories').insert(data);
    return this.findCategoryById(id, data.business_id);
  }
  async updateCategory(id, businessId, data) {
    await db('service_categories').where({ id, business_id: businessId }).update({ ...data, updated_at: db.fn.now() });
    return this.findCategoryById(id, businessId);
  }
  async deleteCategory(id, businessId) {
    return db('service_categories').where({ id, business_id: businessId }).update({ is_active: false, updated_at: db.fn.now() });
  }

  // ===== Services =====
  async findAll(businessId, activeOnly = false) {
    const query = db('salon_services as s')
      .leftJoin('service_categories as c', 's.category_id', 'c.id')
      .where('s.business_id', businessId)
      .select('s.*', 'c.name as category_name')
      .orderBy('s.sort_order', 'asc');
    if (activeOnly) query.where('s.is_active', true);
    return query;
  }
  async findById(id, businessId) {
    return db('salon_services as s')
      .leftJoin('service_categories as c', 's.category_id', 'c.id')
      .where({ 's.id': id, 's.business_id': businessId })
      .select('s.*', 'c.name as category_name')
      .first();
  }
  async findByCategory(categoryId, businessId) {
    return db('salon_services')
      .where({ category_id: categoryId, business_id: businessId, is_active: true })
      .orderBy('sort_order', 'asc');
  }
  async create(data) {
    const [id] = await db('salon_services').insert(data);
    return this.findById(id, data.business_id);
  }
  async update(id, businessId, data) {
    await db('salon_services').where({ id, business_id: businessId }).update({ ...data, updated_at: db.fn.now() });
    return this.findById(id, businessId);
  }
  async delete(id, businessId) {
    return db('salon_services').where({ id, business_id: businessId }).update({ is_active: false, updated_at: db.fn.now() });
  }
}

export const serviceRepository = new ServiceRepository();

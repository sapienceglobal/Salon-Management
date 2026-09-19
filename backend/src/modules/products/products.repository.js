import { db } from '../../config/database.js';
import { parsePagination, buildPaginationMeta, applySorting } from '../../utils/pagination.js';

const TABLE = 'products';
const SORTABLE = ['name', 'brand', 'category', 'selling_price', 'stock_quantity', 'created_at'];

class ProductRepository {
  async findAll(businessId, query) {
    const { page, limit, offset } = parsePagination(query);
    const base = db(TABLE).where({ business_id: businessId });
    if (query.search) {
      const s = `%${query.search}%`;
      base.where(function () { this.where('name', 'like', s).orWhere('sku', 'like', s).orWhere('brand', 'like', s); });
    }
    if (query.category) base.where('category', query.category);
    if (query.is_active !== undefined) base.where('is_active', query.is_active === 'true');
    if (query.low_stock === 'true') base.whereRaw('stock_quantity <= min_stock_alert');

    const [{ count }] = await base.clone().count('* as count');
    const products = await applySorting(base.clone().select('*'), query.sort_by, query.sort_order, SORTABLE).limit(limit).offset(offset);
    return { products, meta: buildPaginationMeta(parseInt(count, 10), page, limit) };
  }

  async findById(id, businessId) { return db(TABLE).where({ id, business_id: businessId }).first(); }
  async findBySku(sku, businessId) { return db(TABLE).where({ sku, business_id: businessId }).first(); }

  async create(data) {
    const [id] = await db(TABLE).insert(data);
    return this.findById(id, data.business_id);
  }

  async update(id, businessId, data) {
    await db(TABLE).where({ id, business_id: businessId }).update({ ...data, updated_at: db.fn.now() });
    return this.findById(id, businessId);
  }

  async updateStock(id, businessId, quantityChange) {
    await db(TABLE).where({ id, business_id: businessId }).update({
      stock_quantity: db.raw('stock_quantity + ?', [quantityChange]),
      updated_at: db.fn.now(),
    });
    return this.findById(id, businessId);
  }

  async delete(id, businessId) {
    return db(TABLE).where({ id, business_id: businessId }).del();
  }

  async getLowStock(businessId) {
    return db(TABLE).where({ business_id: businessId, is_active: true }).whereRaw('stock_quantity <= min_stock_alert').orderBy('stock_quantity', 'asc');
  }
}

export const productRepository = new ProductRepository();

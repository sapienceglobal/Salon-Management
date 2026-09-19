import { db } from '../../config/database.js';
import { parsePagination, buildPaginationMeta, applySorting } from '../../utils/pagination.js';

const TABLE = 'customers';
const SORTABLE_FIELDS = ['first_name', 'last_name', 'phone', 'email', 'total_spent', 'total_visits', 'last_visit_at', 'created_at'];

class CustomerRepository {
  async findAll(businessId, query) {
    const { page, limit, offset } = parsePagination(query);
    const baseQuery = db(TABLE).where({ business_id: businessId });

    // Search filter
    if (query.search) {
      const search = `%${query.search}%`;
      baseQuery.where(function () {
        this.where('first_name', 'like', search)
          .orWhere('last_name', 'like', search)
          .orWhere('phone', 'like', search)
          .orWhere('email', 'like', search);
      });
    }

    // Filters
    if (query.is_active !== undefined) {
      baseQuery.where('is_active', query.is_active === 'true');
    }
    if (query.gender) baseQuery.where('gender', query.gender);
    if (query.source) baseQuery.where('source', query.source);
    if (query.letter) {
      baseQuery.where('first_name', 'like', `${query.letter}%`);
    }

    // Count total
    const [{ count }] = await baseQuery.clone().count('* as count');
    const total = parseInt(count, 10);

    // Fetch records with sorting and pagination
    const customers = await applySorting(
      baseQuery.clone().select('*'),
      query.sort_by, query.sort_order, SORTABLE_FIELDS
    ).limit(limit).offset(offset);

    return { customers, meta: buildPaginationMeta(total, page, limit) };
  }

  async findById(id, businessId) {
    return db(TABLE).where({ id, business_id: businessId }).first();
  }

  async findByPhone(phone, businessId) {
    return db(TABLE).where({ phone, business_id: businessId }).first();
  }

  async findByEmail(email, businessId) {
    return db(TABLE).where({ email, business_id: businessId }).first();
  }

  async create(data) {
    const [id] = await db(TABLE).insert(data);
    return this.findById(id, data.business_id);
  }

  async update(id, businessId, data) {
    await db(TABLE).where({ id, business_id: businessId }).update({ ...data, updated_at: db.fn.now() });
    return this.findById(id, businessId);
  }

  async delete(id, businessId) {
    return db(TABLE).where({ id, business_id: businessId }).del();
  }

  async getVisitHistory(customerId, businessId, limit = 20) {
    return db('invoices')
      .where({ customer_id: customerId, business_id: businessId })
      .whereNot('status', 'cancelled')
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  async getWalletTransactions(customerId, businessId, limit = 50) {
    return db('wallet_transactions')
      .where({ customer_id: customerId, business_id: businessId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  async getRewardTransactions(customerId, businessId, limit = 50) {
    return db('reward_transactions')
      .where({ customer_id: customerId, business_id: businessId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  async getActivePackages(customerId) {
    return db('customer_packages as cp')
      .join('packages as p', 'cp.package_id', 'p.id')
      .where({ 'cp.customer_id': customerId, 'cp.status': 'active' })
      .select('cp.*', 'p.name as package_name');
  }

  async getActiveMemberships(customerId) {
    return db('customer_memberships as cm')
      .join('memberships as m', 'cm.membership_id', 'm.id')
      .where({ 'cm.customer_id': customerId, 'cm.status': 'active' })
      .select('cm.*', 'm.name as membership_name', 'm.discount_percentage');
  }

  async updateStats(customerId, businessId, amount) {
    await db(TABLE).where({ id: customerId, business_id: businessId }).update({
      total_spent: db.raw('total_spent + ?', [amount]),
      total_visits: db.raw('total_visits + 1'),
      last_visit_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
  }

  async getNewVsReturning(businessId, startDate, endDate) {
    const result = await db(TABLE)
      .where({ business_id: businessId, is_active: true })
      .select(
        db.raw("SUM(CASE WHEN total_visits <= 1 THEN 1 ELSE 0 END) as new_customers"),
        db.raw("SUM(CASE WHEN total_visits > 1 THEN 1 ELSE 0 END) as returning_customers"),
        db.raw(`SUM(CASE WHEN last_visit_at < DATE_SUB(NOW(), INTERVAL 90 DAY) AND total_visits > 0 THEN 1 ELSE 0 END) as defected_customers`)
      )
      .first();
    return result;
  }
}

export const customerRepository = new CustomerRepository();

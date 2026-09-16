import { db } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { cleanObject } from '../../utils/helpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// ===== PACKAGES SERVICE =====
class PackageService {
  async getAll(businessId) {
    const packages = await db('packages').where({ business_id: businessId }).orderBy('created_at', 'desc');
    for (const pkg of packages) {
      pkg.items = await db('package_items as pi')
        .join('salon_services as s', 'pi.service_id', 's.id')
        .where('pi.package_id', pkg.id)
        .select('pi.*', 's.name as service_name', 's.price as service_price');
    }
    return packages;
  }

  async getById(id, businessId) {
    const pkg = await db('packages').where({ id, business_id: businessId }).first();
    if (!pkg) throw ApiError.notFound('Package not found');
    pkg.items = await db('package_items as pi')
      .join('salon_services as s', 'pi.service_id', 's.id')
      .where('pi.package_id', id)
      .select('pi.*', 's.name as service_name', 's.price as service_price');
    return pkg;
  }

  async create(businessId, data) {
    let newId;
    await db.transaction(async (trx) => {
      const [id] = await trx('packages').insert({
        business_id: businessId, name: data.name, description: data.description,
        total_price: data.total_price, validity_days: data.validity_days,
        max_uses: data.max_uses, tax_percentage: data.tax_percentage || 18,
      });
      newId = id;
      if (data.items?.length) {
        await trx('package_items').insert(data.items.map(i => ({ package_id: id, service_id: i.service_id, quantity: i.quantity || 1 })));
      }
    });
    return this.getById(newId, businessId);
  }

  async update(id, businessId, data) {
    await this.getById(id, businessId); // verify exists
    await db.transaction(async (trx) => {
      await trx('packages').where({ id, business_id: businessId }).update({
        name: data.name, description: data.description,
        total_price: data.total_price, validity_days: data.validity_days,
        max_uses: data.max_uses, tax_percentage: data.tax_percentage || 18,
      });
      await trx('package_items').where({ package_id: id }).del();
      if (data.items?.length) {
        await trx('package_items').insert(data.items.map(i => ({ package_id: id, service_id: i.service_id, quantity: i.quantity || 1 })));
      }
    });
    return this.getById(id, businessId);
  }

  async delete(id, businessId) {
    const pkg = await this.getById(id, businessId);
    await db.transaction(async (trx) => {
      await trx('package_items').where({ package_id: id }).del();
      await trx('packages').where({ id, business_id: businessId }).del();
    });
    return pkg;
  }

  async purchaseForCustomer(businessId, customerId, packageId) {
    const pkg = await this.getById(packageId, businessId);
    const customer = await db('customers').where({ id: customerId, business_id: businessId }).first();
    if (!customer) throw ApiError.notFound('Customer not found');

    const expiresAt = pkg.validity_days ? new Date(Date.now() + pkg.validity_days * 86400000) : null;
    const [id] = await db('customer_packages').insert({
      customer_id: customerId, package_id: packageId,
      remaining_uses: pkg.max_uses || 999, expires_at: expiresAt, status: 'active',
    });
    return db('customer_packages').where({ id }).first();
  }
}

// ===== MEMBERSHIPS SERVICE =====
class MembershipService {
  async getAll(businessId) { return db('memberships').where({ business_id: businessId }).orderBy('created_at', 'desc'); }

  async getById(id, businessId) {
    const mem = await db('memberships').where({ id, business_id: businessId }).first();
    if (!mem) throw ApiError.notFound('Membership not found');
    return mem;
  }

  async create(businessId, data) {
    const [id] = await db('memberships').insert({ ...data, benefits: data.benefits ? JSON.stringify(data.benefits) : null, business_id: businessId });
    return this.getById(id, businessId);
  }

  async update(id, businessId, data) {
    await this.getById(id, businessId);
    await db('memberships').where({ id, business_id: businessId }).update({ ...data, benefits: data.benefits ? JSON.stringify(data.benefits) : null });
    return this.getById(id, businessId);
  }

  async delete(id, businessId) {
    const mem = await this.getById(id, businessId);
    await db('memberships').where({ id, business_id: businessId }).del();
    return mem;
  }

  async purchaseForCustomer(businessId, customerId, membershipId) {
    const mem = await this.getById(membershipId, businessId);
    const customer = await db('customers').where({ id: customerId, business_id: businessId }).first();
    if (!customer) throw ApiError.notFound('Customer not found');

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + mem.duration_months);

    const [id] = await db('customer_memberships').insert({
      customer_id: customerId, membership_id: membershipId,
      start_date: startDate.toISOString().split('T')[0], end_date: endDate.toISOString().split('T')[0], status: 'active',
    });
    return db('customer_memberships').where({ id }).first();
  }
}

const packageService = new PackageService();
const membershipService = new MembershipService();

// ===== CONTROLLERS =====
const getPackages = asyncHandler(async (req, res) => { ApiResponse.ok('Packages', await packageService.getAll(req.user.business_id)).send(res); });
const getPackage = asyncHandler(async (req, res) => { ApiResponse.ok('Package', await packageService.getById(req.params.id, req.user.business_id)).send(res); });
const createPackage = asyncHandler(async (req, res) => { ApiResponse.created('Package created', await packageService.create(req.user.business_id, req.body)).send(res); });
const updatePackage = asyncHandler(async (req, res) => { ApiResponse.ok('Package updated', await packageService.update(req.params.id, req.user.business_id, req.body)).send(res); });
const deletePackage = asyncHandler(async (req, res) => { ApiResponse.ok('Package deleted', await packageService.delete(req.params.id, req.user.business_id)).send(res); });
const purchasePackage = asyncHandler(async (req, res) => { ApiResponse.created('Package purchased', await packageService.purchaseForCustomer(req.user.business_id, req.body.customer_id, req.body.package_id)).send(res); });
const getMemberships = asyncHandler(async (req, res) => { ApiResponse.ok('Memberships', await membershipService.getAll(req.user.business_id)).send(res); });
const getMembership = asyncHandler(async (req, res) => { ApiResponse.ok('Membership', await membershipService.getById(req.params.id, req.user.business_id)).send(res); });
const createMembership = asyncHandler(async (req, res) => { ApiResponse.created('Membership created', await membershipService.create(req.user.business_id, req.body)).send(res); });
const updateMembership = asyncHandler(async (req, res) => { ApiResponse.ok('Membership updated', await membershipService.update(req.params.id, req.user.business_id, req.body)).send(res); });
const deleteMembership = asyncHandler(async (req, res) => { ApiResponse.ok('Membership deleted', await membershipService.delete(req.params.id, req.user.business_id)).send(res); });
const purchaseMembership = asyncHandler(async (req, res) => { ApiResponse.created('Membership purchased', await membershipService.purchaseForCustomer(req.user.business_id, req.body.customer_id, req.body.membership_id)).send(res); });

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

// Packages
router.get('/packages', getPackages);
router.get('/packages/:id', validate({ params: idParam }), getPackage);
router.post('/packages', authorize('super_admin', 'admin', 'manager'), validate({
  body: z.object({ name: z.string().min(1), description: z.string().optional(), total_price: z.number().positive(),
    validity_days: z.number().int().positive().optional(), max_uses: z.number().int().positive().optional(),
    tax_percentage: z.number().min(0).max(100).optional(),
    items: z.array(z.object({ service_id: z.number().int().positive(), quantity: z.number().int().positive().optional() })).optional(),
  }),
}), createPackage);
router.put('/packages/:id', authorize('super_admin', 'admin', 'manager'), validate({
  params: idParam,
  body: z.object({ name: z.string().min(1), description: z.string().optional(), total_price: z.number().positive(),
    validity_days: z.number().int().positive().optional(), max_uses: z.number().int().positive().optional(),
    tax_percentage: z.number().min(0).max(100).optional(),
    items: z.array(z.object({ service_id: z.number().int().positive(), quantity: z.number().int().positive().optional() })).optional(),
  }),
}), updatePackage);
router.delete('/packages/:id', authorize('super_admin', 'admin', 'manager'), validate({ params: idParam }), deletePackage);
router.post('/packages/purchase', validate({
  body: z.object({ customer_id: z.number().int().positive(), package_id: z.number().int().positive() }),
}), purchasePackage);

// Memberships
router.get('/memberships', getMemberships);
router.get('/memberships/:id', validate({ params: idParam }), getMembership);
router.post('/memberships', authorize('super_admin', 'admin', 'manager'), validate({
  body: z.object({ name: z.string().min(1), description: z.string().optional(), price: z.number().positive(),
    duration_months: z.number().int().positive(), discount_percentage: z.number().min(0).max(100).optional(),
    benefits: z.array(z.string()).optional(), max_members: z.number().int().positive().optional(),
  }),
}), createMembership);
router.put('/memberships/:id', authorize('super_admin', 'admin', 'manager'), validate({
  params: idParam,
  body: z.object({ name: z.string().min(1), description: z.string().optional(), price: z.number().positive(),
    duration_months: z.number().int().positive(), discount_percentage: z.number().min(0).max(100).optional(),
    benefits: z.array(z.string()).optional(), max_members: z.number().int().positive().optional(),
  }),
}), updateMembership);
router.delete('/memberships/:id', authorize('super_admin', 'admin', 'manager'), validate({ params: idParam }), deleteMembership);
router.post('/memberships/purchase', validate({
  body: z.object({ customer_id: z.number().int().positive(), membership_id: z.number().int().positive() }),
}), purchaseMembership);

export default router;

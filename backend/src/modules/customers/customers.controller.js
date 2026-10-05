import { customerService } from './customers.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { deleteUploadedFile } from '../../utils/fileUpload.js';

export const getCustomers = asyncHandler(async (req, res) => {
  const { customers, meta } = await customerService.getAll(req.user.business_id, req.query);
  ApiResponse.ok('Customers fetched successfully', customers, meta).send(res);
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getById(req.params.id, req.user.business_id);
  ApiResponse.ok('Customer fetched successfully', customer).send(res);
});

export const getCustomerProfile = asyncHandler(async (req, res) => {
  const profile = await customerService.getProfile(req.params.id, req.user.business_id);
  ApiResponse.ok('Customer profile fetched successfully', profile).send(res);
});

const mapSource = (source) => {
  if (!source) return undefined;
  const s = source.toLowerCase();
  if (s.includes('walk')) return 'walk_in';
  if (s.includes('refer')) return 'referral';
  if (s.includes('campaign')) return 'campaign';
  return 'online';
};

export const createCustomer = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.profile_image_url = `/uploads/${req.file.filename}`;
  }
  if (data.source) data.source = mapSource(data.source);
  const customer = await customerService.create(req.user.business_id, data);
  ApiResponse.created('Customer created successfully', customer).send(res);
});

export const importCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.bulkCreate(req.user.business_id, req.body.customers);
  ApiResponse.created('Bulk import completed', result).send(res);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    const existing = await customerService.getById(req.params.id, req.user.business_id).catch(() => null);
    if (existing?.profile_image_url) {
      deleteUploadedFile(existing.profile_image_url);
    }
    data.profile_image_url = `/uploads/${req.file.filename}`;
  } else if (data.profile_image_url !== undefined) {
    if (data.profile_image_url === '') data.profile_image_url = null;
    const existing = await customerService.getById(req.params.id, req.user.business_id).catch(() => null);
    if (existing?.profile_image_url && existing.profile_image_url !== data.profile_image_url) {
      deleteUploadedFile(existing.profile_image_url);
    }
  }
  if (data.source) data.source = mapSource(data.source);
  const customer = await customerService.update(req.params.id, req.user.business_id, data);
  ApiResponse.ok('Customer updated successfully', customer).send(res);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const existing = await customerService.getById(req.params.id, req.user.business_id).catch(() => null);
  if (existing?.profile_image_url) {
    deleteUploadedFile(existing.profile_image_url);
  }
  await customerService.delete(req.params.id, req.user.business_id);
  ApiResponse.ok('Customer deactivated successfully').send(res);
});

export const getVisitHistory = asyncHandler(async (req, res) => {
  const visits = await customerService.getVisitHistory(req.params.id, req.user.business_id);
  ApiResponse.ok('Visit history fetched', visits).send(res);
});

export const getWalletHistory = asyncHandler(async (req, res) => {
  const transactions = await customerService.getWalletTransactions(req.params.id, req.user.business_id);
  ApiResponse.ok('Wallet transactions fetched', transactions).send(res);
});

export const getRewardHistory = asyncHandler(async (req, res) => {
  const transactions = await customerService.getRewardTransactions(req.params.id, req.user.business_id);
  ApiResponse.ok('Reward transactions fetched', transactions).send(res);
});

export const getCustomersStats = asyncHandler(async (req, res) => {
  const stats = await customerService.getCustomerStats(req.user.business_id);
  ApiResponse.ok('Customer stats fetched', stats).send(res);
});

export const bulkDeleteCustomers = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids) && ids.length > 0) {
    for (const id of ids) {
      const existing = await customerService.getById(id, req.user.business_id).catch(() => null);
      if (existing?.profile_image_url) {
        deleteUploadedFile(existing.profile_image_url);
      }
    }
  }
  const count = await customerService.bulkDelete(ids, req.user.business_id);
  ApiResponse.ok(`${count} customers deleted successfully`, { count }).send(res);
});

export const bulkStatusCustomers = asyncHandler(async (req, res) => {
  const { ids, is_active } = req.body;
  const count = await customerService.bulkUpdateStatus(ids, req.user.business_id, is_active);
  ApiResponse.ok(`${count} customers status updated`, { count }).send(res);
});

import { customerService } from './customers.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

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

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.create(req.user.business_id, req.body);
  ApiResponse.created('Customer created successfully', customer).send(res);
});

export const importCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.bulkCreate(req.user.business_id, req.body.customers);
  ApiResponse.created('Bulk import completed', result).send(res);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.update(req.params.id, req.user.business_id, req.body);
  ApiResponse.ok('Customer updated successfully', customer).send(res);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
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

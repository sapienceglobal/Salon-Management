import { billingService } from './billing.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await billingService.createInvoice(req.user.business_id, req.user.id, req.body);
  ApiResponse.created('Invoice created', invoice).send(res);
});
export const getInvoices = asyncHandler(async (req, res) => {
  const { invoices, meta } = await billingService.getAll(req.user.business_id, req.query);
  ApiResponse.ok('Invoices fetched', invoices, meta).send(res);
});
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await billingService.getById(req.params.id, req.user.business_id);
  ApiResponse.ok('Invoice fetched', invoice).send(res);
});
export const addPayment = asyncHandler(async (req, res) => {
  const invoice = await billingService.addPayment(req.params.id, req.user.business_id, req.user.id, req.body);
  ApiResponse.ok('Payment added', invoice).send(res);
});
export const refundPayment = asyncHandler(async (req, res) => {
  const invoice = await billingService.refundPayment(req.params.id, req.user.business_id, req.user.id, req.body);
  ApiResponse.ok('Refund processed', invoice).send(res);
});
export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await billingService.updateInvoice(req.params.id, req.user.business_id, req.user.id, req.body);
  ApiResponse.ok('Invoice updated', invoice).send(res);
});
export const deleteInvoice = asyncHandler(async (req, res) => {
  await billingService.deleteInvoice(req.params.id, req.user.business_id);
  ApiResponse.ok('Invoice deleted').send(res);
});

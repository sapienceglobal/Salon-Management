import { db } from '../../config/database.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, businessScope } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';

const idParam = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// ===== WALLET SERVICE =====
class WalletService {
  async topUp(businessId, userId, data) {
    return db.transaction(async (trx) => {
      const customer = await trx('customers').where({ id: data.customer_id, business_id: businessId }).first();
      if (!customer) throw ApiError.notFound('Customer not found');
      const currentBalance = parseFloat(customer.wallet_balance || 0);
      const newBalance = parseFloat((currentBalance + data.amount).toFixed(2));
      await trx('customers').where({ id: data.customer_id }).update({ wallet_balance: newBalance, updated_at: db.fn.now() });
      await trx('wallet_transactions').insert({
        customer_id: data.customer_id, business_id: businessId, type: 'credit',
        amount: data.amount, balance_after: newBalance,
        description: data.description || 'Wallet top-up',
        reference_type: 'topup', created_by: userId,
      });
      return { wallet_balance: newBalance };
    });
  }

  async getBalance(customerId, businessId) {
    const customer = await db('customers').where({ id: customerId, business_id: businessId }).select('wallet_balance', 'reward_points').first();
    if (!customer) throw ApiError.notFound('Customer not found');
    return customer;
  }

  async getTransactions(customerId, businessId) {
    return db('wallet_transactions').where({ customer_id: customerId, business_id: businessId }).orderBy('created_at', 'desc').limit(100);
  }
}

// ===== REWARDS SERVICE =====
class RewardService {
  async redeem(businessId, userId, data) {
    return db.transaction(async (trx) => {
      const customer = await trx('customers').where({ id: data.customer_id, business_id: businessId }).first();
      if (!customer) throw ApiError.notFound('Customer not found');
      if (customer.reward_points < data.points) throw ApiError.badRequest('Insufficient reward points');

      const settings = await trx('business_settings').where({ business_id: businessId }).first();
      const redeemValue = data.points * (settings?.reward_points_value || 1);

      const newPoints = customer.reward_points - data.points;
      await trx('customers').where({ id: data.customer_id }).update({ reward_points: newPoints, updated_at: db.fn.now() });
      await trx('reward_transactions').insert({
        customer_id: data.customer_id, business_id: businessId, type: 'redeemed',
        points: -data.points, balance_after: newPoints,
        description: data.description || `Redeemed ${data.points} points (₹${redeemValue} value)`,
      });

      // Credit equivalent amount to wallet
      const currentWallet = parseFloat(customer.wallet_balance || 0);
      const newWallet = parseFloat((currentWallet + redeemValue).toFixed(2));
      await trx('customers').where({ id: data.customer_id }).update({ wallet_balance: newWallet });
      await trx('wallet_transactions').insert({
        customer_id: data.customer_id, business_id: businessId, type: 'credit',
        amount: redeemValue, balance_after: newWallet,
        description: `Reward points redeemed (${data.points} pts)`,
        reference_type: 'bonus', created_by: userId,
      });

      return { reward_points: newPoints, wallet_balance: newWallet, redeemed_value: redeemValue };
    });
  }

  async getTransactions(customerId, businessId) {
    return db('reward_transactions').where({ customer_id: customerId, business_id: businessId }).orderBy('created_at', 'desc').limit(100);
  }
}

const walletService = new WalletService();
const rewardService = new RewardService();

// ===== CONTROLLERS =====
const topUp = asyncHandler(async (req, res) => {
  const result = await walletService.topUp(req.user.business_id, req.user.id, req.body);
  ApiResponse.ok('Wallet topped up', result).send(res);
});
const getBalance = asyncHandler(async (req, res) => {
  const bal = await walletService.getBalance(req.params.id, req.user.business_id);
  ApiResponse.ok('Balance fetched', bal).send(res);
});
const getWalletTxn = asyncHandler(async (req, res) => {
  const txns = await walletService.getTransactions(req.params.id, req.user.business_id);
  ApiResponse.ok('Wallet transactions', txns).send(res);
});
const redeemPoints = asyncHandler(async (req, res) => {
  const result = await rewardService.redeem(req.user.business_id, req.user.id, req.body);
  ApiResponse.ok('Points redeemed', result).send(res);
});
const getRewardTxn = asyncHandler(async (req, res) => {
  const txns = await rewardService.getTransactions(req.params.id, req.user.business_id);
  ApiResponse.ok('Reward transactions', txns).send(res);
});

// ===== ROUTES =====
const router = Router();
router.use(authenticate, businessScope());

router.post('/wallet/topup', validate({ body: z.object({ customer_id: z.number().int().positive(), amount: z.number().positive(), description: z.string().optional() }) }), topUp);
router.get('/wallet/:id/balance', validate({ params: idParam }), getBalance);
router.get('/wallet/:id/transactions', validate({ params: idParam }), getWalletTxn);
router.post('/rewards/redeem', validate({ body: z.object({ customer_id: z.number().int().positive(), points: z.number().int().positive(), description: z.string().optional() }) }), redeemPoints);
router.get('/rewards/:id/transactions', validate({ params: idParam }), getRewardTxn);

export default router;

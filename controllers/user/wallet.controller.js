import asyncHandler from '../../utils/asyncHandler.js';
import Wallet from '../../models/wallet.model.js';
import { creditWallet } from '../../helpers/wallet.helper.js';
import razorpay from '../../config/razorpay.js';
import crypto from 'crypto';

export const getWalletPage = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const wallet = await Wallet.findOne({
    user: req.session.user.id,
  });

  let transactions = wallet?.transactions || [];
  transactions = transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalTransaction = transactions.length;
  const totalPages = Math.ceil(totalTransaction / limit);

  const paginatedTransactions = transactions.slice(skip, skip + limit);

  res.render('user/wallet', {
    wallet,
    transactions: paginatedTransactions,
    currentPage: page,
    totalPages,
  });
});

export const createWalletRecharge = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount',
    });
  }

  const options = {
    amount: amount * 100,
    currency: 'INR',
    receipt: `wallet_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  res.json({
    success: true,
    order,
  });
});

export const verifyWalletPayment = asyncHandler(async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed',
    });
  }

  await creditWallet({
    userId: req.session.user.id,
    amount: Number(amount),
    reason: 'Wallet Recharge',
  });

  res.json({ success: true });
});

import crypto from 'crypto';
import asyncHandler from '../../utils/asyncHandler.js';
import Order from '../../models/order.model.js';
import Cart from '../../models/cart.model.js';
import Variant from '../../models/variant.model.js';

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(400).json({ success: false });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment signature',
    });
  }

  order.paymentStatus = 'PAID';
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  await order.save();

  await Cart.findOneAndUpdate({ user: order.user }, { $set: { items: [] } });

  return res.json({ success: true });
});

export const markPaymentFailed = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);

  for (const item of order.items) {
    await Variant.findByIdAndUpdate(item.variant, {
      $inc: { stock: item.quantity },
    });
  }

  order.paymentStatus = 'FAILED';
  await order.save();

  res.json({ success: true });
});

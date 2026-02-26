import asyncHandler from '../../utils/asyncHandler.js';
import Cart from '../../models/cart.model.js';
import Address from '../../models/address.model.js';
import Product from '../../models/product.model.js';
import Variant from '../../models/variant.model.js';
import Order from '../../models/order.model.js';
import Wallet from '../../models/wallet.model.js';
import { validateCartForCheckout } from '../../helpers/cartValidate.js';
import razorpay from '../../config/razorpay.js';
import Coupon from '../../models/coupon.model.js';
import Category from '../../models/category.model.js';
import { calculateBestOffer } from '../../helpers/calculateOffer.js';
import { debitWallet } from '../../helpers/wallet.helper.js';
import mongoose from 'mongoose';

export const getCheckoutPage = asyncHandler(async (req, res) => {
  const { retry, orderId } = req.query;

  const addresses = await Address.find({ userId: req.session.user.id });
  const coupons = await Coupon.find({ isDeleted: false });

  if (retry && orderId) {
    const order = await Order.findById(orderId);

    if (!order || order.paymentStatus !== 'FAILED') {
      return res.redirect('/orders');
    }

    return res.render('user/checkout', {
      retry: true,
      order,
      addresses,
      coupons,
    });
  }
  const cart = await Cart.findOne({ user: req.session.user.id })
    .populate({
      path: 'items.product',
      populate: { path: 'category' },
    })
    .populate('items.variant');

  const result = validateCartForCheckout(cart);

  if (!result.valid) {
    return res.redirect('/cart');
  }

  let subtotal = 0;
  let totalDiscount = 0;
  let finalTotal = 0;

  for (const item of cart.items) {
    const product = item.product;
    const variant = item.variant;
    const category = product.category;

    const { finalPrice, appliedOffer } = calculateBestOffer({
      basePrice: variant.basePrice,
      product,
      category,
    });
    variant.finalPrice = finalPrice;
    variant.appliedOffer = appliedOffer;

    const baseTotal = variant.basePrice * item.quantity;
    finalTotal = finalPrice * item.quantity;

    subtotal += finalTotal;
    totalDiscount += baseTotal - finalTotal;
  }

  const appliedCoupon = req.session.appliedCoupon || null;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shipping = subtotal >= 5000 ? 0 : 50;
  const tax = Math.round((subtotal - couponDiscount) * 0.18);
  const total = subtotal - couponDiscount + tax + shipping;

  res.render('user/checkout', {
    cart,
    addresses,
    coupons,
    appliedCoupon,
    summary: {
      subtotal,
      totalDiscount,
      shipping,
      couponDiscount,
      tax,
      total,
    },
  });
});

export const addAddressCheckout = asyncHandler(async (req, res) => {
  const MAX_ADDRESSES = 5;

  const userId = req.session.user.id;

  const { fullName, phone, pincode, streetAddress, city, state, addressType, isDefault } = req.body;

  if (!fullName || !phone || !pincode || !streetAddress || !city || !state) {
    return res.json({
      suucess: false,
      message: 'All feilds required',
    });
  }
  if (!/^\d{6}$/.test(pincode)) {
    return res.json({
      success: false,
      message: 'Enter a indian pincode.',
    });
  }
  const addressCount = await Address.countDocuments({ user: userId });
  if (addressCount >= MAX_ADDRESSES) {
    return res.json({
      success: false,
      message: `Maximum limit is ${MAX_ADDRESSES}`,
    });
  }

  if (isDefault) {
    await Address.Many({ user: userId }, { $set: { isDefault: false } });
  }

  await Address.create({
    userId,
    fullName,
    phone,
    pincode,
    streetAddress,
    city,
    state,
    addressType,
    isDefault: isDefault ? true : false,
  });

  return res.redirect('/checkout');
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { code } = req.body;

  if (req.session.appliedCoupon) {
    return res.json({
      success: false,
      message: 'Coupon already applied',
    });
  }

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isDeleted: false,
    isListed: true,
  });

  if (!coupon) {
    return res.json({
      success: false,
      message: 'Invalid coupon',
    });
  }

  if (coupon.expiry < new Date()) {
    return res.json({
      success: false,
      message: 'Coupon is expired',
    });
  }
  if (coupon.useCount >= coupon.maxUsage) {
    return res.json({
      success: false,
      message: 'Coupon usage limit exceeded',
    });
  }

  if (coupon.usedBy.includes(userId)) {
    return res.json({
      success: false,
      message: 'You have already used this coupon',
    });
  }

  const cart = await Cart.findOne({ user: userId }).populate('items.variant');

  if (!cart || cart.items.length === 0) {
    return res.json({ success: false, message: 'Your cart is empty' });
  }

  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.variant.finalPrice * item.quantity;
  }

  if (subtotal < coupon.minPurchase) {
    return res.json({
      success: false,
      message: `Minimum purchase ₹${coupon.minPurchase} required`,
    });
  }

  let discountAmount = Math.round((subtotal * coupon.percentage) / 100);

  if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
    discountAmount = coupon.maxDiscount;
  }

  req.session.appliedCoupon = {
    couponId: coupon._id,
    code: coupon.code,
    discountAmount,
  };

  res.json({
    success: true,
    message: 'Coupon applied',
    discountAmount,
  });
});

export const removeCoupon = asyncHandler(async (req, res) => {
  req.session.appliedCoupon = null;
  res.json({
    success: true,
    message: 'Coupon removed',
  });
});

export const placeOrder = asyncHandler(async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const userId = req.session.user.id;
    const { addressId, paymentMethod } = req.body;

    const COD_LIMIT = 10000;

    if (!addressId) {
      throw new Error('Please select an address');
    }

    if (!paymentMethod) {
      throw new Error('Payment method required');
    }

    const cart = await Cart.findOne({ user: userId })
      .populate('items.product')
      .populate('items.variant')
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error('Your cart is empty');
    }

    const address = await Address.findOne({
      _id: addressId,
      userId: userId,
    }).session(session);

    if (!address) {
      throw new Error('Selected address is not available');
    }

    let subtotal = 0;
    let basetotal = 0;
    let tax = 0;
    let discount = 0;
    let totalAmount = 0;

    const orderItems = [];

    for (const item of cart.items) {

      const product = item.product;
      const variant = item.variant;

      if (!product || !product.isActive) {
        throw new Error(`${product?.name || 'Product'} is unavailable`);
      }

      if (!variant || !variant.isActive) {
        throw new Error(`Selected variant of ${product.name} is unavailable.`);
      }

      const updatedVariant = await Variant.findOneAndUpdate(
        {
          _id: variant._id,
          stock: { $gte: item.quantity }
        },
        {
          $inc: { stock: -item.quantity }
        },
        { session }
      );

      if (!updatedVariant) {
        throw new Error(`Only ${variant.stock} left for ${product.name}. Please update quantity.`);
      }

      const { finalPrice } = calculateBestOffer({
        basePrice: variant.basePrice,
        product,
        category: await Category.findById(product.category).session(session)
      });

      const itemTotal = finalPrice * item.quantity;

      subtotal += itemTotal;
      basetotal += variant.basePrice * item.quantity;

      orderItems.push({
        product: product._id,
        variant: variant._id,
        quantity: item.quantity,
        price: finalPrice,
      });
    }

    let couponDiscount = 0;
    let appliedCoupon = req.session.appliedCoupon;

    if (appliedCoupon) {

      const coupon = await Coupon.findById(appliedCoupon.couponId).session(session);

      if (
        !coupon ||
        coupon.expiry < new Date() ||
        coupon.useCount >= coupon.maxUsage ||
        subtotal < coupon.minPurchase ||
        coupon.usedBy.includes(userId)
      ) {
        req.session.appliedCoupon = null;
        throw new Error('Applied coupon is no longer valid');
      }

      couponDiscount = appliedCoupon.discountAmount;

      await Coupon.findByIdAndUpdate(
        coupon._id,
        {
          $inc: { useCount: 1 },
          $addToSet: { usedBy: userId }
        },
        { session }
      );

      req.session.appliedCoupon = null;
    }

    const shipping = subtotal >= 5000 ? 0 : 50;
    discount = basetotal - subtotal;
    tax = Math.round((subtotal - couponDiscount) * 0.18);
    totalAmount = subtotal - couponDiscount + tax + shipping;

    if (paymentMethod === 'COD' && totalAmount > COD_LIMIT) {
      throw new Error('Cash on Delivery not available for this amount');
    }

    if (paymentMethod === 'WALLET') {
      const wallet = await Wallet.findOne({ user: userId }).session(session);

      if (!wallet || wallet.balance < totalAmount) {
        throw new Error('Insufficient wallet balance');
      }

      wallet.balance -= totalAmount;
      wallet.transactions.push({
        type: 'DEBIT',
        amount: totalAmount,
        reason: 'Order payment',
      });

      await wallet.save({ session });
    }

    const order = await Order.create(
      [{
        user: userId,
        orderId: `#ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        items: orderItems,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          pincode: address.pincode,
          streetAddress: address.streetAddress,
          city: address.city,
          state: address.state,
          addressType: address.addressType,
        },
        paymentMethod,
        subtotal,
        discount: couponDiscount,
        tax,
        totalAmount,
        paymentStatus: paymentMethod === 'COD' || paymentMethod === 'WALLET'
          ? 'PAID'
          : 'PENDING',
      }],
      { session }
    );

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: 'Order placed successfully',
      orderId: order[0]._id,
      redirectUrl: `/order-success/${order[0]._id}`
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
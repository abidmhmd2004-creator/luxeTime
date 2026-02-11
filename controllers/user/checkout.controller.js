import asyncHandler from "../../utils/asyncHandler.js";
import Cart from "../../models/cart.model.js";
import Address from "../../models/address.model.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Order from "../../models/order.model.js";
import Wallet from "../../models/wallet.model.js";
import Razorpay from "razorpay";
import { validateCartForCheckout } from "../../helpers/cartValidate.js";
import razorpay from "../../config/razorpay.js";
import Coupon from "../../models/coupon.model.js";
import Category from "../../models/category.model.js";
import { calculateBestOffer } from "../../helpers/calculateOffer.js";
import { debitWallet } from "../../helpers/wallet.helper.js";

export const getCheckoutPage = asyncHandler(async (req, res) => {
  const { retry, orderId } = req.query;

  const addresses = await Address.find({ userId: req.session.user.id });
  const coupons = await Coupon.find({ isDeleted: false });

  if (retry && orderId) {
    const order = await Order.findById(orderId);

    if (!order || order.paymentStatus !== "FAILED") {
      return res.redirect("/orders");
    }

    return res.render("user/checkout", {
      retry: true,
      order,
      addresses,
      coupons,
    });
  }
  const cart = await Cart.findOne({ user: req.session.user.id })
    .populate({
      path: "items.product",
      populate: { path: "category" },
    })
    .populate("items.variant");

  const result = validateCartForCheckout(cart);

  if (!result.valid) {
    return res.redirect("/cart");
  }

  let subtotal = 0;
  let totalDiscount = 0;

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
    const finalTotal = finalPrice * item.quantity;

    subtotal += finalTotal;
    totalDiscount += baseTotal - finalTotal;
  }

  const appliedCoupon = req.session.appliedCoupon || null;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  const tax = Math.round((subtotal - couponDiscount) * 0.18);
  const total = subtotal - couponDiscount + tax;
  res.render("user/checkout", {
    cart,
    addresses,
    coupons,
    appliedCoupon,
    summary: {
      subtotal,
      totalDiscount,
      couponDiscount,
      tax,
      total,
    },
  });
});

export const addAddressCheckout = asyncHandler(async (req, res) => {
  const MAX_ADDRESSES = 5;

  const userId = req.session.user.id;

  const {
    fullName,
    phone,
    pincode,
    streetAddress,
    city,
    state,
    addressType,
    isDefault,
  } = req.body;

  if (!fullName || !phone || !pincode || !streetAddress || !city || !state) {
    return res.json({
      suucess: false,
      message: "All feilds required",
    });
  }
  if (!/^\d{6}$/.test(pincode)) {
    return res.json({
      success: false,
      message: "Enter a indian pincode.",
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
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
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

  return res.redirect("/checkout");
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { code } = req.body;

  if (req.session.appliedCoupon) {
    return res.json({
      success: false,
      message: "Coupon already applied",
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
      message: "Invalid coupon",
    });
  }

  if (coupon.expiry < new Date()) {
    return res.json({
      success: false,
      message: "Coupon is expired",
    });
  }
  if (coupon.useCount >= coupon.maxUsage) {
    return res.json({
      success: false,
      message: "Couponn usage limit exceeded",
    });
  }

  const cart = await Cart.findOne({ user: userId }).populate("items.variant");

  if (!cart || cart.items.length === 0) {
    return res.json({ success: false, message: "Your cart is empty" });
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

  const discountAmount = Math.round((subtotal * coupon.percentage) / 100);

  req.session.appliedCoupon = {
    couponId: coupon._id,
    code: coupon.code,
    discountAmount,
  };

  res.json({
    success: true,
    message: "Coupon applied",
    discountAmount,
  });
});

export const removeCoupon = asyncHandler(async (req, res) => {
  req.session.appliedCoupon = null;
  res.json({
    success: true,
    message: "Coupon removed",
  });
});

export const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { addressId, paymentMethod, orderId } = req.body;

  if (orderId) {
    const order = await Order.findById(orderId);

    if (
      !order ||
      order.paymentStatus !== "FAILED" ||
      order.paymentMethod !== "RAZORPAY"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid retry attempt",
      });
    }
    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100,
      currency: "INR",
      receipt: order.orderId,
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = "PENDING";
    await order.save();

    return res.json({
      success: true,
      razorpay: true,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  }

  const COD_LIMIT = 10000;

  if (!addressId) {
    return res.status(400).json({
      success: false,
      message: "Please select an address",
    });
  }
  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: "payment method required",
    });
  }

  const cart = await Cart.findOne({ user: userId })
    .populate("items.product")
    .populate("items.variant");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Your cart is empty",
    });
  }

  const address = await Address.findOne({
    _id: addressId,
    userId: userId,
  });

  if (!address) {
    return res.status(400).json({
      success: false,
      message: "Selected address is not available",
    });
  }

  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  let totalAmount = 0;

  const orderItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    const variant = await Variant.findById(item.variant);

    if (!product || !product.isActive) {
      return res.status(400).json({
        success: false,
        message: `${product.name} is unavailable`,
      });
    }
    if (!variant || !variant.isActive) {
      return res.status(400).json({
        success: false,
        message: `Selected variant of ${product.name} is unavailable.`,
      });
    }

    if (variant.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stock} left for ${product.name}. Please update quantity.`,
      });
    }

    const { finalPrice, appliedOffer } = calculateBestOffer({
      basePrice: variant.basePrice,
      product,
      category: await Category.findById(product.category),
    });

    const itemFinalTotal = finalPrice * item.quantity;

    subtotal += itemFinalTotal;

    orderItems.push({
      product: product._id,
      variant: variant._id,
      quantity: item.quantity,
      price: finalPrice,
    });
  }

  const genartedOrderId = `#ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  let couponDiscount = 0;
  let appliedCoupon = req.session.appliedCoupon;

  if (appliedCoupon) {
    const coupon = await Coupon.findById(appliedCoupon.couponId);

    if (
      !coupon ||
      coupon.expiry < new Date() ||
      coupon.useCount >= coupon.maxUsage ||
      subtotal < coupon.minPurchase
    ) {
      req.session.appliedCoupon = null;
      return res.status(400).json({
        success: false,
        message: "Applied coupoun is no longer valid",
      });
    }
    couponDiscount = appliedCoupon.discountAmount;
  }

  tax = Math.round((subtotal - discount) * 0.18);
  totalAmount = subtotal - discount - couponDiscount + tax;

  if (paymentMethod === "WALLET") {
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet || wallet.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }
  }

  if (paymentMethod === "COD" && totalAmount > COD_LIMIT) {
    return res.status(400).json({
      success: false,
      message: "Cash on Delivery not availble for this amount",
    });
  }

  const order = await Order.create({
    user: userId,
    orderId: genartedOrderId,
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
    paymentStatus: "PENDING",
  });

  if (appliedCoupon) {
    await Coupon.findByIdAndUpdate(appliedCoupon.couponId, {
      $inc: { useCount: 1 },
    });

    req.session.appliedCoupon = null;
  }

  if (paymentMethod === "WALLET") {
    await debitWallet({
      userId,
      amount: totalAmount,
      reason: "Order payment",
      orderId: order._id,
    });

    order.paymentStatus = "PAID";
    await order.save();

    for (const item of cart.items) {
      await Variant.findByIdAndUpdate(item.variant._id, {
        $inc: { stock: -item.quantity },
      });
    }
    cart.items = [];
    await cart.save();

    return res.json({
      success: true,
      message: "Order placed using wallet",
      orderId: order._id,
      redirectUrl: `/order-success/${order._id}`,
    });
  }

  if (paymentMethod === "COD") {
    for (const item of cart.items) {
      await Variant.findByIdAndUpdate(item.variant._id, {
        $inc: { stock: -item.quantity },
      });
    }

    cart.items = [];
    await cart.save();

    return res.json({
      success: true,
      message: "Order placed successfully",
      orderId: order._id,
      redirectUrl: `/order-success/${order._id}`,
    });
  }

  if (paymentMethod === "RAZORPAY") {
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: order.orderId,
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.json({
      success: true,
      razorpay: true,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  }
});

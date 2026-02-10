import asyncHandler from "../../utils/asyncHandler.js";
import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import Variant from "../../models/variant.model.js";
import { creditWallet } from "../../helpers/wallet.helper.js";

export const getOrdersPage = asyncHandler(async (req, res) => {
  const { search, orderStatus, paymentStatus, sort } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const filter = {};

  if (search && search.trim() !== "") {
    const users = await User.find({
      name: { $regex: search, $options: "i" },
    }).select("_id");

    filter.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { user: { $in: users.map((u) => u._id) } },
    ];
  }

  if (orderStatus && orderStatus !== "ALL") {
    filter.orderStatus = orderStatus;
  }

  if (paymentStatus && paymentStatus !== "ALL") {
    filter.paymentStatus = paymentStatus;
  }

  let sortQuery = { createdAt: -1 };

  if (sort === "oldest") {
    sortQuery = { createdAt: 1 };
  }
  if (sort === "amount_high") {
    sortQuery = { totalAmount: -1 };
  }
  if (sort === "amount_low") {
    sortQuery = { totalAmount: 1 };
  }

  const totalOrders = await Order.countDocuments(filter);
  const totalPages = Math.ceil(totalOrders / limit);

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .populate("items.product", "name")
    .populate("items.variant", "images")
    .sort(sortQuery)
    .skip(skip)
    .limit(limit);

  res.render("admin/order-managment", {
    layout: "layouts/admin",
    orders,
    currentPage: page,
    totalPages,
    query: {
      search: search || "",
      orderStatus: orderStatus || "ALL",
      paymentStatus: paymentStatus || "ALL",
      sort: sort || "newest",
    },
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "PENIDNG",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ success: false });
  }

  if (order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED") {
    return res.status(400).json({ success: false });
  }

  order.orderStatus = status;

  if (status == "DELIVERED") {
    order.deliveredAt = new Date();
    if (order.paymentMethod === "COD" && order.paymentStatus !== "PAID") {
      order.paymentStatus = "PAID";
    }
  }
  await order.save();

  res.json({ success: true });
});

export const getOrderDetailsPage = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate("user", "name email phone")
    .populate("items.product", "name")
    .populate("items.variant", "color images");

  if (!order) {
    return res.redirect("/admin/orders");
  }

  res.render("admin/order-details", {
    layout: "layouts/admin",
    order,
  });
});

export const updateReturnStatus = asyncHandler(async (req, res) => {
  const { orderId, itemId, action } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false });
  }
  const isApprove = action === "APPROVED";
  const newItemStatus = isApprove ? "RETURNED" : "RETURN_REJECTED";

  if (itemId) {
    const item = order.items.id(itemId);
    if (!item) {
      return res.status(400).json({ success: false });
    }
    item.itemStatus = newItemStatus;

    if (isApprove) {
      await Variant.findByIdAndUpdate(
        item.variant,
        {
          $inc: { stock: item.quantity },
        },
        { new: true },
      );

      const itemTotal = item.price * item.quantity;
      const itemTax = Math.round((itemTotal / order.subtotal) * order.tax);
      const refundAmount = itemTotal + itemTax;

      await creditWallet({
        userId: order.user,
        amount: refundAmount,
        reason: "Return approved refund",
        orderId: order._id,
      });
    }
  } else {
    for (const item of order.items) {
      if (item.itemStatus === "RETURN_REQUESTED") {
        item.itemStatus = newItemStatus;

        if (itemId && isApprove) {
          await Variant.findByIdAndUpdate(item.variant, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }
  }

  const activeReturns = order.items.some(
    (i) => i.itemStatus === "RETURN_REQUESTED",
  );
  const allReturned = order.items.every((i) => i.itemStatus === "RETURNED");

  if (!itemId && allReturned) {
    order.orderStatus = "RETURNED";

    const refundAmount = order.totalAmount;

    await creditWallet({
      userId: order.user,
      amount: refundAmount,
      reason: "Full order return refund",
      orderId: order._id,
    });
  } else if (!activeReturns) {
    order.orderStatus = "DELIVERED";
  }
  await order.save();

  res.json({ success: true });
});

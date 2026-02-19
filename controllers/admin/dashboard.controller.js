import asyncHandler from '../../utils/asyncHandler.js';
import Order from '../../models/order.model.js';
import mongoose from 'mongoose';

export const getDashboard = asyncHandler(async (req, res) => {
  const { range = 'daily', startDate, endDate, limit = 5 } = req.query;
  const page = parseInt(req.query.page) || 1;

  const skip = (page - 1) * limit;

  let from;
  let to = new Date();

  if (range === 'daily') {
    from = new Date();
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 9999);
  } else if (range === 'weekly') {
    from = new Date();
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
  } else if (range === 'yearly') {
    from = new Date(new Date().getFullYear(), 0, 1);
    from.setHours(0, 0, 0, 0);
  } else if (range === 'custom' && startDate && endDate) {
    from = new Date(startDate);
    from.setHours(0, 0, 0, 0);

    to = new Date(endDate);
    to.setHours(23, 59, 59, 999);
  }

  const matchStage = {
    createdAt: { $gte: from, $lte: to },
    paymentStatus: 'PAID',
  };

  const summary = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        grossAmount: { $sum: '$subtotal' },
        discountAmount: { $sum: '$discount' },
        netRevenue: { $sum: '$totalAmount' },
      },
    },
    {
      $addFields: {
        avgOrderValue: {
          $cond: [{ $eq: ['$totalOrders', 0] }, 0, { $divide: ['$netRevenue', '$totalOrders'] }],
        },
      },
    },
  ]);

  const salesByColor = await Order.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'variants',
        localField: 'items.variant',
        foreignField: '_id',
        as: 'variant',
      },
    },
    { $unwind: '$variant' },
    {
      $group: {
        _id: '$variant.color',
        units: { $sum: '$items.quantity' },
      },
    },
  ]);

  const ledger = await Order.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        orderId: 1,
        createdAt: 1,
        subtotal: 1,
        totalAmount: 1,
        discount: 1,
        paymentStatus: 1,
        'user.name': 1,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const revenueTrend = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topProducts = await Order.aggregate([
    { $match: matchStage },

    { $unwind: '$items' },

    {
      $group: {
        _id: '$items.product',
        totalUnitsSold: { $sum: '$items.quantity' },
        totalRevenue: {
          $sum: {
            $multiply: ['$items.price', '$items.quantity'],
          },
        },
      },
    },

    { $sort: { totalUnitsSold: -1 } },

    { $limit: 5 },

    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },

    { $unwind: '$product' },

    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$product.name',
        brand: '$product.brand',
        totalUnitsSold: 1,
        totalRevenue: 1,
      },
    },
  ]);

  const totalOrder = await Order.countDocuments(matchStage);

  res.render('admin/dashboard', {
    summary: summary[0] || {
      totalOrders: 0,
      grossAmount: 0,
      discountAmount: 0,
      netRevenue: 0,
      avgOrderValue: 0,
    },
    salesByColor,
    ledger,
    revenueTrend,
    topProducts,
    currentPage: Number(page),
    totalPages: Math.ceil(totalOrder / limit),
    query: req.query,
    layout: 'layouts/admin',
  });
});

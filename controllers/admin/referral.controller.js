import asyncHandler from '../../utils/asyncHandler.js';

import User from '../../models/user.model.js';
import Wallet from '../../models/wallet.model.js';

export const getReferralManagement = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const searchQuery = req.query.search || '';
  const statusFilter = req.query.status || '';

  let filter = {
    referredBy: { $ne: null },
    isVerified: true,
  };

  if (searchQuery) {
    filter.$or = [
      { name: { $regex: searchQuery, $options: 'i' } },
      { email: { $regex: searchQuery, $options: 'i' } },
    ];
  }

  const referredUsers = await User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });

  const totalCount = await User.countDocuments(filter);

  let referrals = [];
  let totalRewardAmount = 0;

  for (let user of referredUsers) {
    const referrer = await User.findOne({
      referralCode: user.referredBy,
    });

    if (!referrer) continue;

    const rewardAmount = 200;
    totalRewardAmount += rewardAmount;

    let status = 'Paid';

    referrals.push({
      referrerName: referrer.name,
      referrerEmail: referrer.email,
      referredUser: user.name,
      signupDate: user.createdAt,
      reward: rewardAmount,
      status,
    });
  }

  res.render('admin/referral', {
    layout: 'layouts/admin',
    referrals,
    totalReferrals: totalCount,
    totalRewardAmount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    searchQuery,
    statusFilter,
  });
});

import asyncHandler from '../../utils/asyncHandler.js';
import User from '../../models/user.model.js';
import Wallet from '../../models/wallet.model.js';

export const getReferralPage = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;

  const user = await User.findById(userId);
  const wallet = await Wallet.findOne({ user: userId });

  const referredUsers = await User.find({
    referredBy: user.referralCode,
    isVerified: true,
  });

  const totalEarnings = wallet?.balance || 0;

  res.render('user/referral', {
    totalEarnings,
    referredCount: referredUsers.length,
    referralCode: user.referralCode,
  });
});

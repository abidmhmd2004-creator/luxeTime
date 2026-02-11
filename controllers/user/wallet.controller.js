import asyncHandler from "../../utils/asyncHandler.js";
import Wallet from "../../models/wallet.model.js";

export const getWalletPage = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ user: req.session.user.id });

  res.render("user/wallet", {
    wallet,
    transactions: wallet?.transactions || [],
  });
});

import asyncHandler from "../../utils/asyncHandler.js";
import Wallet from "../../models/wallet.model.js";

export const getWalletPage = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 1;
  const skip = (page - 1) * limit;

  const wallet = await Wallet.findOne({
    user: req.session.user.id,
  });

  let transactions = wallet?.transactions || [];
  transactions = transactions.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const totalTransaction = transactions.length;
  const totalPages = Math.ceil(totalTransaction / limit);

  const paginatedTransactions = transactions.slice(skip, skip + limit);

  res.render("user/wallet", {
    wallet,
    transactions:paginatedTransactions,
    currentPage: page,
    totalPages,
  });
});

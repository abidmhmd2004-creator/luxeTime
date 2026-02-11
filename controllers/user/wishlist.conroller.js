import asyncHandler from "../../utils/asyncHandler.js";
import Wishlist from "../../models/wishlist.model.js";

export const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;

  const wishlist = await Wishlist.findOne({ user: userId })
    .populate("items.product")
    .populate("items.variant");

  const items = wishlist
    ? wishlist.items.filter((item) => item.product && item.variant)
    : [];

  res.render("user/wishlist", { items });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { productId, variantId } = req.body;

  if (!productId || !variantId) {
    return res.status(400).json({
      success: false,
      message: "Product or variant missing",
    });
  }

  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      items: [{ product: productId, variant: variantId }],
    });

    res.json({ success: true, alreadyAdded: false });
  }

  const exists = wishlist.items.some(
    (item) =>
      item.product.toString() === productId &&
      item.variant.toString() === variantId,
  );

  if (exists) {
    return res.json({ success: true, alreadyAdded: true });
  }

  wishlist.items.push({ product: productId, variant: variantId });
  await wishlist.save();

  res.json({ success: true, alreadyAdded: false });
});

export const removeWishlistItem = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { itemId } = req.params;

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    return res.status(404).json({
      success: false,
      message: "Wishlist not found",
    });
  }

  wishlist.items = wishlist.items.filter(
    (item) => item._id.toString() !== itemId,
  );

  await wishlist.save();

  return res.json({
    success: true,
    message: "Item removed successfully",
  });
});

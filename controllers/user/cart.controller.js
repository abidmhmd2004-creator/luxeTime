import asyncHandler from "../../utils/asyncHandler.js";
import Variant from "../../models/variant.model.js";
import Cart from "../../models/cart.model.js";
import Product from "../../models/product.model.js";
import Wishlist from "../../models/wishlist.model.js";

export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user.id })
    .populate({
      path: "items.product",
      populate: { path: "category" },
    })
    .populate("items.variant");

  let subtotal = 0;
  let removedItems = false;

  let cartIssues = [];

  if (cart && cart.items.length > 0) {
    for (const item of cart.items) {
      const product = item.product;
      const variant = item.variant;
      const category = product?.category;

      if (!product || !variant || !category) {
        cartIssues.push("Some items are no longer available");
        continue;
      }

      if (!product.isActive || product.isDeleted) {
        cartIssues.push(`${product.name} is unavailable`);
        continue;
      }

      if (!variant.isActive) {
        cartIssues.push(`Variant of ${product.name} is unavailable`);
        continue;
      }

      if (variant.stock < item.quantity) {
        cartIssues.push(`Only ${variant.stock} left for ${product.name}`);
      }
      subtotal += variant.finalPrice * item.quantity;
    }
  }

  const taxRate = 0.18;
  const tax = Math.round(subtotal * taxRate);
  const shipping = 0;
  const discount = 0;

  const total = subtotal + tax - discount;

  res.render("user/cart", {
    cart,
    cartIssues,
    summary: {
      subtotal,
      tax,
      shipping,
      discount,
      total,
    },
  });
});

export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.session?.user?.id;
  const { productId, variantId, quantity = 1 } = req.body;
  const variant = await Variant.findById(variantId);

  if (!userId) {
    return res.status(404).json({
      success: false,
      message: "Please login first",
    });
  }

  const product = await Product.findById(productId);
  const MAX_QTY = 10;

  if (!product || !product.isActive) {
    return res.json({
      success: false,
      message: "Product is unavailable",
    });
  }

  if (!variant) {
    return res.json({
      success: false,
      message: "Variant not found",
    });
  }
  if (quantity < 1) {
    return res.json({
      success: false,
      message: "Invalid quantity",
    });
  }
  if (quantity > MAX_QTY) {
    return res.json({
      success: false,
      message: `Maximum ${MAX_QTY} units allowed`,
    });
  }

  if (variant.stock < quantity) {
    return res.json({
      success: false,
      message: "Insufficiant stock",
    });
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [
        {
          product: productId,
          variant: variantId,
          quantity,
        },
      ],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) => item.variant.toString() === variantId,
    );
    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + quantity;
      if (newQty > MAX_QTY) {
        return res.json({
          success: false,
          message: `You can only buy ${MAX_QTY} units`,
        });
      }

      if (newQty > variant.stock) {
        return res.json({
          success: false,
          message: "Exceeds available stock",
        });
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        variant: variantId,
        quantity,
      });
    }
  }
  await cart.save();
  await Wishlist.updateOne(
    { user: userId },
    { $pull: { items: { variant: variantId } } },
  );

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  res.json({
    success: true,
    message: "Added to cart",
    cartCount: totalItems,
  });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { variantId } = req.params;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return res.json({
      success: false,
      message: "Cart not found",
    });
  }
  cart.items = cart.items.filter(
    (item) => item.variant.toString() !== variantId,
  );

  await cart.save();

  res.json({
    success: true,
    message: "Item removed",
  });
});

export const updateQty = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { variantId, change } = req.body;

  const cart = await Cart.findOne({ user: userId });
  const MAX_QTY = 10;

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
    });
  }

  const item = cart.items.find((i) => i.variant.toString() === variantId);

  if (!item) {
    return res.status(404).json({
      message: "Item not found",
    });
  }
  const variant = await Variant.findById(variantId);

  const newQty = item.quantity + change;

  if (newQty < 1) {
    return res.status(400).json({
      message: "Minimum qauntity is 1",
    });
  }
  if (newQty > MAX_QTY) {
    return res.json({
      success: false,
      message: `You can only buy ${MAX_QTY} units`,
    });
  }

  if (newQty > variant.stock) {
    return res.status(400).json({
      message: "Stock limit reached",
    });
  }

  item.quantity = newQty;
  await cart.save();

  res.json({ success: true });
});

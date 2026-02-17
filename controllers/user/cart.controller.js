import asyncHandler from '../../utils/asyncHandler.js';
import Variant from '../../models/variant.model.js';
import Cart from '../../models/cart.model.js';
import Product from '../../models/product.model.js';
import Wishlist from '../../models/wishlist.model.js';
import { calculateBestOffer } from '../../helpers/calculateOffer.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.session.user.id })
    .populate({
      path: 'items.product',
      populate: { path: 'category' },
    })
    .populate('items.variant');

  let basesubtotal = 0;
  let subtotal = 0;

  let cartIssues = [];

  if (cart && cart.items.length > 0) {
    const validItems = [];

    for (const item of cart.items) {
      const product = item.product;
      const variant = item.variant;
      const category = product?.category;

      if (!product || !variant || !category) {
        cartIssues.push('Some items are no longer available');
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

      const { finalPrice, appliedOffer } = calculateBestOffer({
        basePrice: variant.basePrice,
        product,
        category,
      });

      item.variant.finalPrice = finalPrice;
      item.variant.appliedOffer = appliedOffer;
      basesubtotal += variant.basePrice * item.quantity;
      subtotal += finalPrice * item.quantity;
      validItems.push(item);
    }
    cart.items = validItems;
    await cart.save();
  }
  const shipping = subtotal >= 5000 ? 0 : 50;
  const taxRate = 0.18;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax + shipping;
  const discount = basesubtotal - subtotal;

  res.render('user/cart', {
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

  if (!userId) {
    return res.status(404).json({
      success: false,
      message: 'Please login first',
    });
  }

  const { productId, variantId, quantity = 1 } = req.body;
  const variant = await Variant.findById(variantId);

  const product = await Product.findById(productId);
  const MAX_QTY = 10;

  if (!product || !product.isActive) {
    return res.json({
      success: false,
      message: 'Product is unavailable',
    });
  }

  if (!variant) {
    return res.json({
      success: false,
      message: 'Variant not found',
    });
  }
  if (quantity < 1) {
    return res.json({
      success: false,
      message: 'Invalid quantity',
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
      message: 'Insufficiant stock',
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
    const itemIndex = cart.items.findIndex((item) => item.variant.toString() === variantId);
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
          message: 'Exceeds available stock',
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
  await Wishlist.updateOne({ user: userId }, { $pull: { items: { variant: variantId } } });

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  res.json({
    success: true,
    message: 'Added to cart',
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
      message: 'Cart not found',
    });
  }
  cart.items = cart.items.filter((item) => item.variant.toString() !== variantId);

  await cart.save();

  res.json({
    success: true,
    message: 'Item removed',
  });
});

export const updateQty = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const { variantId, change } = req.body;
  const MAX_QTY = 10;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const item = cart.items.find((i) => i.variant.toString() === variantId);

  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  const variant = await Variant.findById(variantId);
  const product = await Product.findById(item.product).populate('category');

  if (!variant || !product) {
    return res.status(400).json({ message: 'Product unavailable' });
  }

  const newQty = item.quantity + change;

  if (newQty < 1) {
    return res.status(400).json({ message: 'Minimum quantity is 1' });
  }

  if (newQty > MAX_QTY) {
    return res.json({
      success: false,
      message: `You can only buy ${MAX_QTY} units`,
    });
  }

  if (newQty > variant.stock) {
    return res.status(400).json({ message: 'Stock limit reached' });
  }

  item.quantity = newQty;
  await cart.save();

  const { finalPrice } = calculateBestOffer({
    basePrice: variant.basePrice,
    product,
    category: product.category,
  });

  let subtotal = 0;

  const populatedCart = await Cart.findOne({ user: userId })
    .populate({
      path: 'items.product',
      populate: { path: 'category' },
    })
    .populate('items.variant');

  for (const cartItem of populatedCart.items) {
    const { finalPrice } = calculateBestOffer({
      basePrice: cartItem.variant.basePrice,
      product: cartItem.product,
      category: cartItem.product.category,
    });

    subtotal += finalPrice * cartItem.quantity;
  }

  const shipping = subtotal >= 5000 ? 0 : 50;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax + shipping;

  res.json({
    success: true,
    quantity: item.quantity,
    itemSubtotal: finalPrice * item.quantity,
    subtotal,
    shipping,
    tax,
    total,
    basePrice: variant.basePrice,
    finalPrice,
  });
});

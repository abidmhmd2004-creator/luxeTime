import asyncHandler from '../../utils/asyncHandler.js';
import Product from '../../models/product.model.js';
import Variant from '../../models/variant.model.js';
import Wishlist from '../../models/wishlist.model.js';
import Category from '../../models/category.model.js';
import { calculateBestOffer } from '../../helpers/calculateOffer.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, brand, price, sort = 'new', page = 1 } = req.query;

  const limit = 8;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  const categories = await Category.find({ isListed: true }).select('_id name');
  filter.category = { $in: categories };

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  if (category) {
    filter.category = category;
  }

  if (brand) {
    filter.brand = brand;
  }

  const products = await Product.find(filter).populate('category');

  const finalProducts = [];

  for (let product of products) {
    const variantfilter = {
      product: product._id,
      isActive: true,
    };

    if (price) {
      const [min, max] = price.split('-');
      variantfilter.finalPrice = {
        ...(min && { $gte: Number(min) }),
        ...(max && { $lte: Number(max) }),
      };
    }

    const variant = await Variant.findOne(variantfilter).sort({ finalPrice: 1 }).lean();

    if (!variant) continue;

    const { finalPrice, appliedOffer } = calculateBestOffer({
      basePrice: variant.basePrice,
      product,
      category: product.category,
    });

    variant.finalPrice = finalPrice;
    variant.appliedOffer = appliedOffer;

    product.variant = variant;
    finalProducts.push(product);
  }
  if (sort === 'new') {
    finalProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  if (sort === 'pricelow') {
    finalProducts.sort((a, b) => a.variant.basePrice - b.variant.basePrice);
  }
  if (sort === 'pricehigh') {
    finalProducts.sort((a, b) => b.variant.basePrice - a.variant.basePrice);
  }

  const totalProducts = finalProducts.length;
  const totalPages = Math.ceil(totalProducts / limit);
  const paginatedProducts = finalProducts.slice(skip, skip + limit);

  res.render('user/shop', {
    products: paginatedProducts,
    categories,
    currentPage: Number(page),
    totalPages,
    query: req.query,
  });
});

export const productDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { variantId } = req.query;

  const product = await Product.findOne({
    _id: id,
    isActive: true,
  }).populate({
    path: 'category',
    select: 'name offerValue offerExpiry',
    match: { isListed: true },
  });

  if (!product || !product.category) {
    return res.redirect('/shop');
  }

  let variants = await Variant.find({
    product: product._id,
    isActive: true,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  variants = variants.map((v) => {
    const { finalPrice, appliedOffer } = calculateBestOffer({
      basePrice: v.basePrice,
      product,
      category: product.category,
    });
    return {
      ...v,
      finalPrice,
      appliedOffer,
    };
  });

  if (!variants.length) {
    return res.status(404).render('user/404');
  }

  const defaultVariant = variantId
    ? variants.find((v) => v._id.toString() === variantId) || variants[0]
    : variants[0];

  const relatedProducts = await Product.find({
    category: product.category._id,
    _id: { $ne: id },
    isActive: true,
  })
    .limit(4)
    .lean();

  const recommendedWithData = await Promise.all(
    relatedProducts.map(async (p) => {
      const variant = await Variant.findOne({
        product: p._id,
        isActive: true,
      }).lean();

      if (!variant) return null;

      const { finalPrice, appliedOffer } = calculateBestOffer({
        basePrice: variant.basePrice,
        product: p,
        category: product.category,
      });

      return {
        ...p,
        variant: {
          ...variant,
          finalPrice,
          appliedOffer,
        },
      };
    })
  );

  res.render('user/product-details', {
    product,
    variants,
    defaultVariant,
    recommendations: recommendedWithData,
  });
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Please login first',
    });
  }

  const { productId, variantId } = req.body;

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    await Wishlist.create({
      user: userId,
      items: [{ product: productId, variant: variantId }],
    });
    return res.json({ added: true });
  }

  const index = wishlist.items.findIndex(
    (item) => item.product.toString() === productId && item.variant.toString() === variantId
  );
  if (index > -1) {
    wishlist.items.splice(index, 1);
    await wishlist.save();
    return res.json({ added: false });
  } else {
    wishlist.items.push({ product: productId, variant: variantId });
    await wishlist.save();
    return res.json({ added: true });
  }
});

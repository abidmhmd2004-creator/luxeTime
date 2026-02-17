import asyncHandler from '../../utils/asyncHandler.js';
import Product from '../../models/product.model.js';
import Variant from '../../models/variant.model.js';
import Category from '../../models/category.model.js';
import { calculateBestOffer } from '../../helpers/calculateOffer.js';

export const showhomePage = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(4)
    .populate('category');

  for (let product of products) {
    const variant = await Variant.findOne({
      product: product._id,
      isActive: true,
      isDeleted: false,
    }).lean();
    if (!variant) continue;

    const { finalPrice, appliedOffer } = calculateBestOffer({
      basePrice: variant.basePrice,
      product,
      category: product.category,
    });
    product.variant = {
      ...variant,
      finalPrice,
      appliedOffer,
    };
  }

  const categories = await Category.find({
    name: { $in: [/^men$/i, /^women$/i] },
    isListed: true,
  }).select('_id name');

  return res.render('user/home', {
    newArrivals: products,
    categories,
  });
});

export const getAboutPage = asyncHandler(async (req, res) => {
  res.render('user/about');
});

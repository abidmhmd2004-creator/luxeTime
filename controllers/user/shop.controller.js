import asyncHandler from "../../utils/asyncHandler.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Category from "../../models/category.model.js"

export const getProducts = asyncHandler(async (req, res) => {

    const {
        search,
        category,
        brand,
        price,
        sort = "new",
        page = 1
    } = req.query;

    const limit = 4;
    const skip = (page - 1) * limit;


    const filter = { isActive: true };

    const categories = await Category.find({ isListed: true }).select("_id name");
    filter.category = { $in: categories };


    if (search) {
        filter.name = { $regex: search, $options: "i" }
    }

    if (category) {
        filter.category = category;
    }

    if (brand) {
        filter.brand = brand;
    }

    const products = await Product.find(filter).populate("category")

    const finalProducts = [];

    for (let product of products) {
        const variantfilter = {
            product: product._id,
            isActive: true,
            stock: { $gt: 0 }
        }

        if (price) {
            const [min, max] = price.split("-");
            variantfilter.finalPrice = {
                ...(min && { $gte: Number(min) }),
                ...(max && { $lte: Number(max) })
            }
        }

        const variant = await Variant.findOne(variantfilter)
        .sort({finalPrice:1})
        .lean()
        

        if (!variant) continue;

        // console.log(variant)

        product.variant = variant;
        finalProducts.push(product);

    }
     if (sort === "new") {
            finalProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        }
        if (sort === "pricelow") {
            finalProducts.sort((a, b) => a.variant.basePrice - b.variant.basePrice)
        }
        if (sort === "pricehigh") {
            finalProducts.sort((a, b) => b.variant.basePrice - a.variant.basePrice)
        }



    const totalProducts = finalProducts.length;
    const totalPages = Math.ceil(totalProducts / limit)
    const paginatedProducts = finalProducts.slice(skip, skip + limit);


    res.render("user/shop", {
        products: paginatedProducts,
        categories,
        currentPage: Number(page),
        totalPages,
        query: req.query
    });
})



export const productDetails = asyncHandler(async (req, res) => {

    const { id } = req.params;
    const { variantId } = req.query;

    const product = await Product.findOne({
        _id: id,
        isActive: true
    })
        .populate("category")
        .lean()


    if (!product.category || !product.category.isListed) {
        return res.redirect("/shop");
    }

    const variants = await Variant.find({
        product: product._id,
        isActive: true
    })
        .sort({ createdAt: -1 })
        .lean()

    if (!variants.length) {
        return res.status(404).render("user/404");
    }

    const defaultVariant = variantId
        ? variants.find(v => v._id.toString() === variantId) || variants[0]
        : variants[0];

    const relatedProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: id },
        isActive: true
    }).limit(4).lean();

    const recommendedWithData = await Promise.all(relatedProducts.map(async (p) => {
        const variant = await Variant.findOne({ product: p._id, isActive: true }).lean();
        return { ...p, variant };
    }));

    res.render("user/product-details", { product, variants, defaultVariant, recommendations: recommendedWithData });
})
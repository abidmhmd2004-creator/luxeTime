import asyncHandler from "../../utils/asyncHandler.js";
import Category from "../../models/category.model.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";


export const getProductPage = asyncHandler(async (req, res) => {
    const products = await Product.find({ isDeleted: false})
    // .populate("category", "name")
    // .lean();
    for (let product of products) {
        const variants = await Variant.find({
            product: product._id,
            isActive: true,
        }).lean();
        product.variants = variants;

        product.bestOffer = 0;
        product.minPrice = null;

        if (variants.length > 0) {
            product.bestOffer = Math.max(...variants.map(v => v.offerPercentage || 0));
            product.minPrice = Math.min(
                ...variants.map(v => v.finalPrice ?? v.basePrice)
            );
        }
    }


    res.render("admin/products", { layout: "layouts/admin", products })

})

export const getaddProducts = asyncHandler(async (req, res) => {

    const categories = await Category.find({ isListed: true });

    res.render("admin/add-products", { categories, layout: "layouts/admin" })
})

export const postAddProducts = asyncHandler(async (req, res) => {

    const {
        name,
        brand,
        category,
        description,
        caseSize,
        strapType,
        movementType,
        isListed,
        variants
    } = req.body;

    // console.log(variants);



    const product = await Product.create({
        name,
        brand,
        category,
        description,
        specifications: {
            caseSize,
            strapType,
            movementType
        },
        isActive: isListed === "on"
    });

    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];

        const basePrice = Number(v.basePrice);
        const offer = Number(v.offerPercentage || 0);
        const finalPrice = basePrice - (basePrice * offer / 100);

        const files = req.files.filter(
            file => file.fieldname === `variantImages_${i}`
        );

        if (files.length < 3) {
            return res.status(400).json({
                success: false,
                message: `Variant ${i + 1} needs at least 3 images`
            });
        }
        // console.log(req.body.variants);

        await Variant.create({
            product: product._id,
            color: v.color,
            stock: Number(v.stock || 0),
            basePrice,
            offerPercentage: offer,
            finalPrice: Math.round(finalPrice),
            images: files.map((file, idx) => ({
                url: file.path,
                isPrimary: idx === 0
            }))
        });
    }

    return res.status(201).json({
        success: true,
        message: "Product added successfully"
    });
});

export const productDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const variants = await Variant.find({ product: id });

    res.json({
        success: true,
        product,
        variants
    })
})

export const geteditProduct = asyncHandler(async (req, res) => {


    const productId = req.params.id;

    const product = await Product.findById(productId);

    const categories = await Category.find({ isListed: true });
    const variants = await Variant.find({ product: productId });

    res.render("admin/edit-product", { product, categories, variants, layout: "layouts/admin" });

})

export const postEditProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { name, category, description, caseSize, strapType, movementType, isListed, variants } = req.body;
    // console.log(name);

    console.log(req.body)


    await Product.findByIdAndUpdate(id, {
        name,
        category,
        description,
        specifications: {
            caseSize,
            strapType,
            movementType
        },
        isActive: isListed === "on"
    })

    const submittedVariantIds = variants
    .map(v => v._id)
    .flat()               
    .filter(Boolean);     
    
    const uniqueVariantIds = [...new Set(submittedVariantIds)];



    await Variant.deleteMany({
        product: id,
        _id: { $nin: submittedVariantIds }
    });


    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];

        const basePrice = Number.isFinite(Number(v.basePrice))
    ? Number(v.basePrice)
    : 0;

const offer = Number.isFinite(Number(v.offerPercentage))
    ? Number(v.offerPercentage)
    : 0;

const stock = Number.isFinite(Number(v.stock))
    ? Number(v.stock)
    : 0;
        const finalPrice = basePrice - (basePrice * offer / 100);

        

        const files = req.files.filter(file => file.fieldname === `variantImages_${i}`);

        let keptImages = req.body[`existingImages_${i}`] || [];

        if (!Array.isArray(keptImages)) {
            keptImages = [keptImages];
        }

        const oldImages = keptImages.map(url => ({
            url,
            isPrimary: false
        }))
        const newImages = files.map(file => ({
            url: file.path,
            isPrimary: false
        }))

        let finalImages = [...oldImages, ...newImages];

        finalImages = finalImages.map((img, index) => ({
            ...img,
            isPrimary: index === 0
        }));

        if (v._id) {
            await Variant.findByIdAndUpdate(v._id, {
                color: v.color,
                stock,
                basePrice,
                offerPercentage: offer,
                finalPrice: Math.round(finalPrice),
                images: finalImages
            });
        } else {
            await Variant.create({
                product: id,
                color: v.color,
                stock,
                basePrice,
                offerPercentage: offer,
                finalPrice: Math.round(finalPrice),
                images: finalImages
            })
        }
        console.log(variants)
    }

    res.json({
        success: true,
        message: "Product updated successfully"
    })
})

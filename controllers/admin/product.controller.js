import asyncHandler from "../../utils/asyncHandler.js";
import Category from "../../models/category.model.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";


export const getProductPage = asyncHandler(async (req, res) => {

    const page = (req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const { search } = req.query;
    const filter = {
        isDeleted: false,
    }
    if (typeof search === "string" && search.trim() !== "") {
        filter.name = { $regex: search.trim(), $options: "i" };
    }

    const products = await Product.find(filter)
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    // .populate("category", "name")
    // .lean();

    for (let product of products) {
        const variants = await Variant.find({
            product: product._id,
            isActive: true,
            isDeleted: false
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


    const totalProducts = await Product.countDocuments(filter);

    const totalPages = Math.ceil(totalProducts / limit)


    res.render("admin/products", { layout: "layouts/admin", products, currentPage: Number(page), totalPages, search })

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

    if (!name || !name.trim()) {
        return res.status(400).json({
            success: false,
            message: "Product name is required"
        })
    }
    if (!variants || typeof variants !== "object") {
        return res.status(400).json({
            success: false,
            message: "At least one variant is required"
        });
    }

    const existing = await Product.findOne({
        name: name.trim(),
        isDeleted: false
    })

    if (existing) {
        return res.status(400).json({
            success: false,
            message: "Prodct already exists"
        })
    }
    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const files = req.files.filter(
            file => file.fieldname === `variantImages_${i}`
        );

        if (files.length < 3) {
            return res.status(400).json({
                success: false,
                message: `Variant ${i + 1} needs at least 3 images`
            });
        }
        if (files.length > 4) {
            return res.status(400).json({
                success: false,
                message: `Variant ${i + 1} needs at maximum 5 images`
            });
        }
    }

    const colorSet = new Set();

    for (const v of variants) {
        const color = v.color.trim().toLowerCase();

        if (!color) {
            return res.status(400).json({
                success: false,
                message: "Variant color is required"
            })
        }

        if (colorSet.has(color)) {
            return res.status(400).json({
                success: false,
                message: "Duplicate variant color :${v.color}"
            })
        }
        colorSet.add(color)
    }


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

        const files = req.files.filter(
            file => file.fieldname === `variantImages_${i}`
        );
        const basePrice = Number(v.basePrice);
        const offer = Number(v.offerPercentage || 0);

        const finalPrice = basePrice - (basePrice * offer / 100);

        await Variant.create({
            product: product._id,
            color: v.color,
            stock: Number(v.stock || 0),
            basePrice,
            strapType,
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

    const variants = await Variant.find({ product: id,isActive:true,isDeleted:false });


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
    const variants = await Variant.find({ product: productId,isActive:true,isDeleted:false});

    res.render("admin/edit-product", { product, categories, variants, layout: "layouts/admin" });

})

export const postEditProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { name, category, description, caseSize, strapType, movementType, isListed, variants } = req.body;
    // console.log(name);

    // console.log(variants);


    if (!name || !name.trim()) {
        return res.status(400).json({
            success: false,
            message: "Product name is required"
        })
    }
    if (!variants || typeof variants !== "object") {
        return res.status(400).json({
            success: false,
            message: "At least on variant is required"
        })
    }

    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];

        if (!v.color || !v.color.trim()) {
            return res.status(400).json({
                success: false,
                message: `Color is required for varinat ${i + 1}`
            })
        }

        const colorSet = new Set();

        for (let v of variants) {
            const color = v.color?.trim().toLowerCase();
            if (!color) {
                return res.status(400).json({
                    success: false,
                    message: "Variant color is required"
                });
            }

            if (colorSet.has(color)) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate variant color: ${v.color}`
                });
            }

            colorSet.add(color);
        }
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
        


    // await Variant.deleteMany({
    //     product: id,
    //     _id: { $nin: submittedVariantIds }
    // });
    await Variant.updateMany({
        product: id,
        _id: { $nin: submittedVariantIds }
    },
        { isActive: false, isDeleted: true });


        const basePrice = Number(v.basePrice);
        const offer = Number(v.offerPercentage || 0);
        const stock = Number(v.stock || 0);

        const finalPrice =Math.round(basePrice - (basePrice * offer / 100));


        const files = req.files.filter(file => file.fieldname === `variantImages_${i}`);

        let keptImages = req.body[`existingImages_${i}`] || [];

        if (!Array.isArray(keptImages)) {
            keptImages = [keptImages];
        }
        let totalImages = keptImages + files.length;

        if (keptImages.length + files.length < 3) {
            return res.status(400).json({
                success: false,
                message: `At least 3 images required for varinat ${i + 1}`
            })
        }
        if (keptImages.length + files.length > 4) {
            return res.status(400).json({
                success: false,
                message: `Maximum 4 images for varinat ${i + 1}`
            })
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
                finalPrice,
                images:finalImages,
                isDeleted: false,
                isActive: true
            });
            continue;
        }

        const existingDeletedVariant = await Variant.findOne({
            product: id,
            color: new RegExp(`^${v.color}$`, "i"),
            isDeleted: true
        });

        if (existingDeletedVariant) {
            await Variant.findByIdAndUpdate(existingDeletedVariant._id, {
                stock,
                basePrice,
                offerPercentage: offer,
                finalPrice,
                images:finalImages,
                isDeleted: false,
                isActive: true
            });
            continue;
        }

            await Variant.create({
                product: id,
                color: v.color,
                stock,
                basePrice,
                offerPercentage: offer,
                finalPrice,
                images: finalImages
            })
        // console.log(variants)
    }

    res.json({
        success: true,
        message: "Product updated successfully"
    })
})


export const softDeleteProduct = asyncHandler(async (req, res) => {

    // console.log("getting controller")
    const { id } = req.params;

    await Product.findByIdAndUpdate(id, {
        isDeleted: true,
        isListed: false
    })

    res.json({
        success: true,
        message: "Category soft deleted"
    })
})
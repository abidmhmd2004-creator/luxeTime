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

    if(!name || !name.trim()){
        return res.status(400).json({
            success:false,
            message:"Product name is required"
        })
    }
    if(!variants.color || !variants.color.trim()){
        return res.status(400).json({
            success:false,
            message:"Variant color is required"
        })
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
          if (files.length > 5) {
            return res.status(400).json({
                success: false,
                message: `Variant ${i + 1} needs at maximum 5 images`
            });
        }
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

    // console.log(variants);


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

    // const uniqueVariantIds = [...new Set(submittedVariantIds)];



    await Variant.deleteMany({
        product: id,
        _id: { $nin: submittedVariantIds }
    });


    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];

        const basePrice = Number(v.basePrice);
        const offer = Number(v.offerPercentage || 0);
        const stock = Number(v.stock || 0);

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
        // console.log(variants)
    }

    res.json({
        success: true,
        message: "Product updated successfully"
    })
})


export const softDeleteProduct = asyncHandler(async (req, res) => {

    console.log("getting controller")
    const { id } = req.params;

    await Product.findByIdAndUpdate(id, {
        isDeleted: true,
        isActive: false
    })

    res.json({
        success: true,
        message: "Product sft deleted"
    })
})
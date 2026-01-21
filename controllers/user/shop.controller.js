import asyncHandler from "../../utils/asyncHandler.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";

export const getProducts =asyncHandler (async(req,res)=>{

    const products =await Product.find({isActive:true});    

    for(let product of products){
        const variant =await Variant.findOne({
            product:product._id,
            isActive:true,
            stock:{$gt:0}
        })
        .sort({finalPrice:1});
        // console.log(variant)

         product.variant = variant||null;
    }   

    res.render("user/shop",{products});
})
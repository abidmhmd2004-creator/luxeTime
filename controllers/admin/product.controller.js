import asyncHandler from "../../utils/asyncHandler.js";


export const getProductPage=asyncHandler(async(req,res)=>{
    res.render("admin/products",{layout:"layouts/admin"});
})


export const addProducts =asyncHandler(async(req,res)=>{
    res.render("admin/add-products",{layout:"layouts/admin"});
})
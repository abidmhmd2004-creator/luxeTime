import asyncHandler from "../../utils/asyncHandler.js";
import Cart from "../../models/cart.model.js"
import Address from "../../models/address.model.js"

export const getCheckoutPage= asyncHandler(async(req,res)=>{
    const cart =await Cart.findOne({user:req.session.user.id})
    .populate("items.product")
    .populate("items.variant")

    if(!cart || cart.items.length ===0){
        return res.redirect("/cart")
    }

    const addresses=await Address.find({user:req.session.user.id});

    res.render("user/checkout",{
        cart,
        addresses
    })
})
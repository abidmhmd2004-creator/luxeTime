import asyncHandler from "../../utils/asyncHandler.js";
import Order from "../../models/order.modal.js";

export const getOrders =asyncHandler(async(req,res)=>{
    const userId =req.session.user.id;
    const {orderId}=req.params;

    const order=await Order.findOne({
        _id:orderId,
        user:userId
    })
    .populate({
    path: "items.product",
    select: "name  isActive"
  })
  .populate({
    path: "items.variant",
    select: "color images"
  })
  .sort({ createdAt: -1 });

    if(!order){
        return res.redirect("/cart")
    }
    res.render("user/orders",{order})
})
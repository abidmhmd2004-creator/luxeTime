import asyncHandler from "../../utils/asyncHandler.js";
import Order from "../../models/order.model.js";
import Variant from "../../models/variant.model.js"

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
    res.render("user/order-success",{order})
})

export const getOrderDetailsPage=asyncHandler(async(req,res)=>{

  const {orderId}=req.params;
  const userId=req.session.user.id;

  const order=await Order.findOne({
    _id:orderId,
    user:userId
  })
  .populate("items.product") 
  .populate("items.variant");

    if(!order){
      return res.redirect("/cart")
    }
    res.render("user/orderDetails",{order});
})


export const cancelOrderItem =asyncHandler(async(req,res)=>{
  const {orderId}=req.params;
  const userId=req.session.user.id;
  const {itemId}=req.body;

  const order=await Order.findOne({_id:orderId,user:userId});

  const item=order.items.id(itemId);

  if(!item || item.itemStatus!=="ACTIVE"){
    return res.status(400).json({
      success:false,
      message:"Invalid item"
    })
  }
  item.itemStatus="CANCELLED";

  await Variant.findByIdAndUpdate(item.variant,{
    $inc:{stock:item.quantity}
  })

  const allCancelled=order.items.every(i=>i.itemStatus==="CANCELLED");

  if(allCancelled){
    order.orderStatus="CANCELLED"
  }

  await order.save()

  res.json({
    success:true,
    message:"Order cancelled successfully"
  })

})


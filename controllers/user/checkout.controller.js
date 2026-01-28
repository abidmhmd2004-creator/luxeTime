import asyncHandler from "../../utils/asyncHandler.js";
import Cart from "../../models/cart.model.js"
import Address from "../../models/address.model.js"
import Variant from "../../models/variant.model.js"
import Order from "../../models/order.modal.js"

export const getCheckoutPage= asyncHandler(async(req,res)=>{
    const cart =await Cart.findOne({user:req.session.user.id})
    .populate("items.product")
    .populate("items.variant")

    if(!cart || cart.items.length ===0){
        return res.redirect("/cart")
    }

    const addresses=await Address.find({userId:req.session.user.id});

    res.render("user/checkout",{
        cart,
        addresses
    })
})

export const addAddressCheckout = asyncHandler(async(req,res)=>{

    const MAX_ADDRESSES = 5;

    const userId =req.session.user.id;

    const {
        fullName,
        phone,
        pincode,
        streetAddress,
        city,
        state,
        addressType,
        isDefault
    } = req.body;


    if(!fullName||!phone||!pincode||!streetAddress||!city||!state){
        return res.json({
            suucess:false,
            message:"All feilds required"
        })
    }
     if (!/^\d{6}$/.test(pincode)) {
      return res.json({
        success:false,
        message:"Enter a indian pincode."
      })
    }
    const addressCount = await Address.countDocuments({ user: userId });
    if (addressCount >= MAX_ADDRESSES) {
      return res.json({
        success:false,
        message:`Maximum limit is ${MAX_ADDRESSES}`
      })
    }

    if(isDefault){
        await Address.updateMany(
            {user:userId},
            {$set:{isDefault:false}}
        )
    }

    await Address.create({
        userId,
        fullName,
        phone,
        pincode,
        streetAddress,
        city,
        state,
        addressType,
        isDefault:isDefault?true:false
    })

    return res.redirect("/checkout")
})


export const placeOrder=asyncHandler(async(req,res)=>{
    const COD_LIMIT=10000;

    const userId=req.session.user.id;
    const {addressId,paymentMethod}=req.body

    if(!addressId){
        return res.status(400).json({
            success:false,
            message:"Please select a payment method"
        });
    }

    const cart =await Cart.findOne({user:userId})
    .populate("items.product")
    .populate("items.variant");

    if(!cart ||cart.items.length===0){
        return res.status(400).json({
            success:false,
            message:"Your cart is empty"
        })
    }

    const address= await Address.findOne({
        _id:addressId,
        userId:userId
    })

    if(!address){
        return res.status(400).json({
            success:false,
            message:"Selected address is not available"
        })
    }

    let subtotal=0;
    let discount=0;
    let tax=0;
    let totalAmount=0;

    const orderItems=[];

    for(const item of cart.items){
        const product = item.product;
        const variant = item.variant;

        if(!product.isActive){
            return res.status(400).json({
                success:false,
                message:`${product.name} is unavailable` 
            })
        }

        if(variant.stock<item.quantity){
            return res.status(400).json({
                success:false,
                message:`Insufficiant stock for ${product.name}`
            })
        }

        const itemBaseTotal=variant.basePrice*item.quantity;
        const itemFinalTotal=variant.finalPrice * item.quantity;

        subtotal+=itemBaseTotal;
        discount+=itemBaseTotal-itemFinalTotal;

        orderItems.push({
            product:product._id,
            variant:variant._id,
            quantity:item.quantity,
            price:variant.finalPrice
        })
    }

    tax=Math.round((subtotal-discount)*0.18);
    totalAmount=subtotal-discount+tax;
    console.log(totalAmount)

    if(paymentMethod==="COD"&&totalAmount>COD_LIMIT){
        return res.status(400).json({
            success:false,
            message:"Cash on Delivery not availble for this amount"
        })
    }

    const order =await Order.create({
        user:userId,
        items:orderItems,
        shippingAddress:{
            fullName:address.fullName,
            phone:address.phone,
            pincode:address.pincode,
            streetAddress:address.streetAddress,
            city:address.city,
            state:address.state,
            addressType:address.addressType
        },
        paymentMethod,
        subtotal,
        discount,
        tax,
        totalAmount,
        paymentStatus:paymentMethod==="COD"?"PENDING":"PENDING"
    })

    for(const item of cart.items){
        await Variant.findByIdAndUpdate(item.variant._id,{
            $inc:{stock :-item.quantity}
        })
    }

    cart.items=[];
    await cart.save();
    
    return res.json({
        success:true,
        message:"Order placed successfully",
        orderId:order._id,
        redirectUrl:paymentMethod==="COD"?`/orders/${order._id}`:`/payment/${order._id}`
    })
})
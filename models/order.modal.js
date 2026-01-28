import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        items:[
            {
                product:{type:mongoose.Schema.ObjectId,ref:"Product"},
                variant:{type:mongoose.Schema.ObjectId,ref:"Variant"},
                quantity:Number,
                price:Number
            }
        ],
        shippingAddress:{
            fullName:String,
            phone:String,
            pincode:String,
            streetAddress:String,
            city:String,
            state:String,
            addressType:String
        },
        paymentMethod:{
            type:String,
            enum:["RAZORPAY","WALLET","COD"],
            required:true
        },
        paymentStatus:{
            type:String,
            enum:["PENDING","PAID","FAILED"],
            default:"PENDING"
        },
        orderStatus:{
            type:String,
            enum:["PLACED","CONFIRM","SHIPPED","DELIVERED","CANCELLED"],
            default:"PLACED"
        },
        subtotal:Number,
        discount:Number,
        tax:Number,
        totalAmount:Number
    },{timestamps:true}
)

export default mongoose.model("Order",orderSchema);
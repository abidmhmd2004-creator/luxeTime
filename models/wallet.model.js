import mongoose, { Schema } from "mongoose";

const walletShema = new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        unique:true
    },
    balance:{
        type:Number,
        default:0,
        min:0
    },
    transactions:[
        {
            type:{
                type:String,
                enum:["CREDIT","DEBIT"],
                required:true
            },
            amount:{
                type:Number,
                required:true,
            },
            reason:String,
            orderId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Order"
            },
            razorpayPaymentId:String,
            createdAt:{
                type:Date,
                default:Date.now,
            }
        }
    ]
})

export default mongoose.model("Wallet",walletShema);
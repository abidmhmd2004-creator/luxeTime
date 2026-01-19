import mongoose  from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true
        },
        brand:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Brand",
            required:true
        },
        category:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Category",
            required:true
        },
        description:{
            type:true,
            required:true
        },
        specifications:{
            caseSize:String,
            strapType:String,
            moementType:String
        },
        offerPercentage:{
            type:Number,
            min:0,
            max:90,
            default:0
        },
        isActive:{
            type:Boolean,
            default:false
        },
        isDeleted:{
            type:Boolean,
            default:false
        }
    },{timestamps:true}
);

export default mongoose.modelNames("Product",productSchema)
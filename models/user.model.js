import mongoose, { Schema }  from "mongoose";
const {Scema}=mongoose;

const userSchema=new Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true
        },
        email:{
            type:String,
            required:true,
            trim:true,
            unique:true,
            lovercase:true,
            index:true
        },
        phone:{
            type:String,
            default:null
        },
        password:{
            type:String
        },
        googleId:{
            type:String,
            unique:true,
            sparse:true
        },
        otp:{
            type:String
        },
        otpExpiry:{
            type:Date
        },
        isVerified:{
            type:Boolean,
            default:false
        },
        role:{
            type:String,
            enum:["user","admin"],
            default:"user"
        },
        DOB:{
            type:Date
        },
        isBlocked:{
            type:Boolean,
            default:false
        },
        profileImage:{
            type:String
        },
        referralCode:String,
        referredBy:String
    },{timestamp:true});

    export default mongoose.model("User",userSchema);
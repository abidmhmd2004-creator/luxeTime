import nodemailer from "nodemailer";
import Otp from "../models/otp.model.js";
import crypto from "crypto";


const generateOtp=()=>{
    return Math.floor(100000+Math.random()*90000).toString();
};

const sendOtpMail = async (email,otp)=>{
    try{
    const transporter =nodemailer.createTransport({
        service:"gmail",
        auth:{
        user:process.env.NODEMAILER_EMAIL,
        pass:process.env.NODEMAILER_PASSWORD
        }
    })

    await transporter.sendMail({
        from:`LuxeTime <${process.env.NODEMAILER_EMAIL}>`,
        to:email,
        subject:"Verify your account",
        html:`<h2> Your OTP is ${otp} </h2> <p> valid for 5 minutes </p>`,
    });

    console.log("otp sented");
    return true;
}catch(err){
    console.log(err);
}
};



export const createAndSendOtp=async(user)=>{

    await Otp.deleteMany({ userId: user._id });
    
    const otpCode=generateOtp();

    const hashedOtp= crypto.createHash("sha256").update(otpCode).digest("hex");

    await Otp.create({
        userId:user._id,
        otp:hashedOtp,
    });


    await sendOtpMail(user.email,otpCode);
}
import express from "express";
import bcrypt from "bcrypt";
import User from "../../models/user.model.js";
import { createAndSendOtp } from "../../utils/otp.util.js";

export const showSignup=async(req,res)=>{
    try{
        res.render("user/signup");
    }catch(err){
        console.log("Error loading signup page");
        res.status(500).send("Server error")
    }
};


export const postSignup = async (req, res) => {
    try {
        const { name, email, phone, referralCode, password } = req.body;

        if (!name || !/^[A-Za-z ]+$/.test(name)) {
            return res.render("user/signup", {
                error: "Name can only contain letters"
            });
        }

        if (name.length > 30 || name.length < 3) {
            return res.render("user/signup", {
                error: "Name should be between 3-30 characters",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.render("user/signup", {
                error: "Please enter a valid email address",
            });
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.render("user/signup", {
                error: "Please enter a valid Phone Number",
            });
        }

        if (password.length < 6) {
            return res.render("user/signup", {
                error: "Password need minimum 6 characters",
            });
        }


        const existingUser = await User.findOne({ email });
        

        if (existingUser) {
            req.flash("error", "Email already registered,Please login!");
            return res.redirect("/signup");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user= await User.create({
            name,
            email,
            phone,
            referralCode,
            password: hashedPassword,
            isVerified: false
        });

        await createAndSendOtp(user);

        req.session.otp={
            userId:user._id.toString(),
            purpose: "signup"

        }
        res.redirect("/verify-otp");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error while sighning up");
    }
}

export const showVerifyOtp =async (req,res)=>{
    try{
        res.render("user/verify-otp");
    }catch(err){
        console.log("Errorloading verify-otp");
        res.status(500).send("Server Error");
    }
}



export const showLogin=async(req,res)=>{
    try{
        return res.render("user/login");
    }catch(err){
        console.log("Error loading login page");
        res.status(500).send("Server error");
    }
};
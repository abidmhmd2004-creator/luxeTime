import express from "express";
import bcrypt from "bcrypt";
import User from "../../models/user.model.js";

export const showSignup=async(req,res)=>{
    try{
        res.render("user/signup");
    }catch(err){
        console.log("Error loading signup page");
        res.status(500).send("Server error")
    }
};


export const postSignup = async (req,res) =>{
    try{
        const {name,email,phone,password} =req.body;
        const existingUser=await User.findOne ({ email });

        if(existingUser){
            req.flash("error","Email already registered,Please login!");
            return res.redirect("/signup");
        }

        const hashedPassword=await bcrypt.hash(password,10);

        await User.create({
            name,
            email,
            password:hashedPassword,
            isVerified:false
        });

        res.redirect("/login");
    }catch(err){
        console.log(err);
        res.status(500).send("Error while sighning up");
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
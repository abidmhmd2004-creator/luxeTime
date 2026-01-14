import express from "express";
import bcrypt from "bcrypt";
import User from "../../models/user.model.js";

export const loadAdminLogin=async (req,res)=>{
    try{
        if(req.session.admin){
            return res.redirect("/admin/dashboard");
        }
        res.render("admin/login",{layout:"layouts/admin"});
    }catch(err){
        next(err);
    }
}

export const postAdminLogin =async (req,res)=>{
    try {
        
        const {email,password}=req.body;

        const admin =await User.findOne({email,role:"admin"});

        if(!admin){
            req.flash("error","Unauthorized access");
            return res.redirect("/admin/login");
        }

        const isMatch =await bcrypt.compare(password,admin.password);

        if(!isMatch){
            req.flash("error","Invalid Credintials");
            return res.redirect("/admin/login");
        }

        req.session.admin={
            id:admin._id.toString(),
            email:admin.email,
            role:admin.role
        }
        return res.redirect("/admin/dashboard");

    } catch (error) {
        next(error)
        
    }
}




export const adminLogout=async(req,res)=>{
    req.session.destroy(()=>{

    res.clearCookie("luxetime.admin.sid");
   return res.redirect("/admin/login");
    })
    
}



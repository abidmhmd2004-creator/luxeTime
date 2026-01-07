import User from "../../models/user.model.js";

export const getAddress=async(req,res)=>{
    res.render("user/address");
}
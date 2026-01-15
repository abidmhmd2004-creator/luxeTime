
import asyncHandler from "../../utils/asyncHandler.js";
export const getDashboard =asyncHandler(async (req,res)=>{
    
        res.render("admin/dashboard",{layout:"layouts/admin"})
    
})
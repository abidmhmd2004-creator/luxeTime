

export const getDashboard =async (req,res)=>{
    if(!req.session.admin){
        return res.redirect("/admin/login");
    }
    res.render("admin/dashboard",{layout:"layouts/admin"})
}
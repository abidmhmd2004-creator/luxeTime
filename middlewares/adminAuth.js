export const adminAuth=(req,res,next){
    if(req.session.admin&&req.session.admin.role==="admin"){
        next();
    }else{
        res.redirect("/admin/login");
    }
};
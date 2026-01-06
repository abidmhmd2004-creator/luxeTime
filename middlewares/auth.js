export const checkUser=(req,res,next)=>{
    if(req.session.user){
        res.locals.user=req.session.user;
    }else{
        res.locals.user=null;
    }
    next();
}


export const requireAuth=(req,res,next)=>{
    if(!req.session.user){
        return res.redirect("/user/login")
    }
    next();
}

export const redirectIfAuthenticated = (req,res,next)=>{
    if(req.session.user){
        return res.redirect("/home");
    }
    next();
}

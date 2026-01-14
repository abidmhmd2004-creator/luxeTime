
export const showhomePage=async(req,res)=>{
    try{
        const user=req.session.user;
        return res.render("user/home");
    }catch(err){
        next(err)
    }
}


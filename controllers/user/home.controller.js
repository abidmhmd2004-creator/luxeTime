export const showhomePage=async(req,res)=>{
    try{
        return res.render("user/home");
    }catch(err){
        console.log("Error loading home page");
        res.status(500).send("Server Error");
    }
}


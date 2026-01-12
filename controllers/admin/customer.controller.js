
import User from "../../models/user.model.js"

export const getCustomers =async(req,res)=>{
    try {

        const page=parseInt(req.query.page)||1;

        const limit=3;
        const skip=(page-1)*limit;

        const {search,status}=req.query;

       

        const filter={role:"user"};

        if(search){
            filter.$or=[
                {name:{$regex:search,$options:"i"}},
                {email:{$regex:search,$options:"i"}}
            ]
        }

        if(status=="Active"){
            filter.isBlocked=false;
        }else if(status=="Blocked"){
            filter.isBlocked=true;
        }

        const totalUsers=await User.countDocuments(filter);

        const totalPages=Math.ceil(totalUsers/limit);

        const users=await User.find(filter)
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit);


            res.render("admin/customers",{layout:"layouts/admin",
                users,
                totalPages,
                currentPage:page,
                search,
                status,
                limit,
                totalUsers
            })
        } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
}


export const toggleCustomerStatus = async (req,res)=>{
    try {

           const {userId}=req.params;

        const user= await User.findById(userId);

        if(!user){
            req.flash("error","User not found");
            return res.redirect("/admin/customers");
        }


        

        user.isBlocked=!user.isBlocked;
        await user.save();

        req.flash("success",user.isBlocked ?"User blocked successfully":"User unblocked successfully");

        res.redirect("/admin/customers");


    } catch (err) {

        console.log(err);
        res.redirect("/admin/customers");
        
    }
}
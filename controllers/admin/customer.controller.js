import User from "../../models/user.model.js";


export const getCustomers=async (req,res)=>{
    try {
        if(!req.session.admin){
            return res.redirect("/admin/logout")
        }
       const page=parseInt(req.query.page)||1;
    const limit=5;
    const skip=(page-1)*limit;

    const {search,status}=req.query;

    let filter={role:"user"};

    if(search){
        filter.$or[
            {name:{$regix:search,$options:"i"}},
            {email:{$regex:search,$options:"i"}}
        ];
    }
if(status==="active"){
    filter.isBlocked=false;
}else if(status==="blocked"){
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
    cusrrentPage:page,
    totalPages,
    search,
    status
})

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error")
    }
    
}
    
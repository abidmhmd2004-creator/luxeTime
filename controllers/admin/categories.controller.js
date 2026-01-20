import asyncHandler from "../../utils/asyncHandler.js";
import Category from "../../models/category.model.js";

export const getCategory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };

  const totalCategories = await Category.countDocuments(filter);

  const categories = await Category.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.render("admin/categories", {
    categories,
    currentPage: page,
    totalPages: Math.ceil(totalCategories / limit),
    layout: "layouts/admin"
  });
});


export const getCategoryAjax = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const search = req.query.search || "";


  const filter = { isDeleted: false };

  if (search.trim()) {
    filter.name = { $regex: search, $options: "i" };
  }

  const totalCategories = await Category.countDocuments(filter);

  const categories = await Category.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    categories,
    currentPage: page,
    totalPages: Math.ceil(totalCategories / limit)
  });
});




export const addCategory =asyncHandler(async(req,res)=>{
    const {name ,description,offerValue,offerExpiry}=req.body;

    if(!name.trim()){
        return res.status(400).json({
            success:false,
            message:"Category name is requered"
        });
    }

    const exists=await Category.findOne({
        name:{$regex:`^${name}$`,$options:"i"},
        isDeleted:false
    });
    if(exists){
        return res.status(409).json({
            success:false,
            message:"Category already exists"
        })
    }
    
    if(offerValue < 0 || offerValue > 90){
        return res.status(400).json({message:"Offer should be between 0 and 90"});
    }

    if(offerValue > 1 && !offerExpiry){
        return res.status(400).json({message:"Offer expiry date needed when offer is applied"});
    } 

    if(new Date(offerExpiry) < new Date()){
        return res.status(400).json({message:"Please set a future expiry date"});
    }

    await Category.create({
        name,
        description,
        offerValue,
        offerExpiry
    })
    return res.status(201).json({
        success:true,
        message:"Category added successfully"
    })
})


export const editCategory=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    const {name,description,offerValue,offerExpiry}=req.body;

    if(!name ||name.trim()===""){
        return res.status(400).json({message:"Category name is required"});
    }

    const exists=await Category.findOne({
        _id:{$ne:id},
        name:{$regex:`${name.trim()}$`,$options:"i"}
    })

    if(exists){
        return res.status(409).json({message:"Category already exists"});
    }

    if(offerValue < 0 || offerValue > 90){
        return res.status(400).json({message:"Offer should be between 0 and 90"});
    }

    if(offerValue>1 && !offerExpiry){
        return res.status(400).json({message:"Offer expiry date required when offer is applied"})
    }

    if(offerExpiry && new Date(offerExpiry)<new Date()){
        return res.status(400).json({message:"Please set a future expiry date"});
    }

    await Category.findByIdAndUpdate(id,{
        name:name.trim(),
        description:description?.trim(),
        offerValue:offerValue||0,
        offerExpiry:offerValue>0?offerExpiry:null
    })

    return res.status(200).json({
        success:true,
        message:"Category updated successfully"});
})

export const toggleCategory =asyncHandler(async(req,res)=>{
    const {id} =req.params;

    const category =await Category.findById(id);

    if(!category){
        return res.json({
            success:false,
            message:"Category not found"
        })
    }

    category.isListed=!category.isListed;

    await category.save();

    res.json({
        success:true,
        message:category.isListed?"Category listed successfully":"Category unlisted Successfully"
    })
})
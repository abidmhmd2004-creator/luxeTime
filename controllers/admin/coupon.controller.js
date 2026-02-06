import asyncHandler from "../../utils/asyncHandler.js";
import Coupon from "../../models/coupon.model.js";

export const getCouponPage = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isDeleted: false }).sort({
    createdAt: -1,
  });
  res.render("admin/coupons", { layout: "layouts/admin", coupons });
});

export const addCoupon = asyncHandler(async (req, res) => {
  const { name, code, offer, minOrder, maxUsage, expiryDate, isActive } =
    req.body;

  if (!name || !code || !offer || !minOrder || !maxUsage || !expiryDate) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (offer <= 0 || offer > 100) {
    return res.status(400).json({
      success: false,
      message: "Offer percentage must be between 1 and 100",
    });
  }

  if (new Date(expiryDate) <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "Expiry date must be in the future",
    });
  }

  const existingCoupen = await Coupon.findOne({
    code: code.toUpperCase(),
    isDeleted: false,
  });

  if (existingCoupen) {
    return res.status(409).json({
      success: false,
      message: "Coupen code already exists",
    });
  }

  const coupon = await Coupon.create({
    name: name.trim(),
    code: code.toUpperCase(),
    percentage: offer,
    minPurchase: minOrder,
    maxUsage,
    expiry: expiryDate,
    isListed: true,
  });

  res.status(201).json({
    success: true,
    message: "coupen created successfully",
  });
});

export const editCoupon = asyncHandler(async (req, res) => {
  const { couponId } = req.params;
  const { name, code, offer, minOrder, maxUsage, expiryDate, isActive } =
    req.body;

  const coupon = await Coupon.findOne({ _id: couponId, isDeleted: false });

  if (!coupon) {
    return res.json({
      success: false,
      message: "Coupon not found",
    });
  }

  if (new Date(expiryDate) <= new Date()) {
    return res.json({
      success: false,
      message: "Expiry date must be in the future.",
    });
  }

  coupon.name = name;
  coupon.percentage = offer;
  coupon.minPurchase = minOrder;
  coupon.maxUsage = maxUsage;
  coupon.expiry = expiryDate;

  await coupon.save();

  res.json({
    success: true,
    message: "Coupon updated successfully",
  });
});

export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  const coupon = await Coupon.findById(couponId);

  if (!coupon || coupon.isDeleted) {
    return res.json({
      success: false,
      message: "Coupon not found",
    });
  }

  coupon.isListed = !coupon.isListed;
  await coupon.save();

  res.json({
    success: true,
    message: `Coupon ${coupon.isListed ? "Listed" : "Unlisted"} successfully`,
  });
});


export const deleteCoupon = asyncHandler(async(req,res)=>{

    const {couponId}=req.params;

    const coupon = await Coupon.findById(couponId);

    if(!coupon){
        return res.json({
            success:false,
            message:"Coupon not found."
        })
    }

    coupon.isDeleted = true;
    await coupon.save();

    res.json({
        success:true,
        message:"Coupon deleted successfully"
    })
})
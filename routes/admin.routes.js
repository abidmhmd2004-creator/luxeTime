import express from "express";
import { adminLogout, loadAdminLogin, postAdminLogin } from "../controllers/admin/auth.controller.js";
import { getDashboard } from "../controllers/admin/dashboard.controller.js";
import { getCustomers, toggleCustomerStatus } from "../controllers/admin/customer.controller.js";
import { adminAuth } from "../middlewares/adminAuth.js";
import { addCategory, editCategory, getCategory, getCategoryAjax, softDeleteCategory, toggleCategory } from "../controllers/admin/categories.controller.js";
import { getaddProducts, geteditProduct, getProductPage, postAddProducts, postEditProduct, productDetails, softDeleteProduct } from "../controllers/admin/product.controller.js";
import { uploadProfileImage } from "../controllers/user/profile.controller.js";
import createUploader from "../middlewares/upload.middleware.js";

const uploadProductImage=createUploader("products");

const router=express.Router();

//login
router.get("/login",loadAdminLogin);
router.post("/login",postAdminLogin);

//dashboard
router.get("/dashboard",adminAuth,getDashboard);

//cutomers
router.get("/customers",adminAuth,getCustomers);
router.patch("/customers/toggle/:userId",adminAuth,toggleCustomerStatus);

//category
router.get("/categories",adminAuth,getCategory);
router.post("/categories",addCategory)
router.put("/categories/:id",editCategory);
router.patch("/category/:id/delete",softDeleteCategory)
router.patch("/categories/toggle/:id",adminAuth,toggleCategory);
router.get("/categories/ajax",getCategoryAjax);

//products
router.get("/products",adminAuth,getProductPage);
router.get("/add-products",adminAuth,getaddProducts);
router.post("/add-products",uploadProductImage.any(),postAddProducts)
router.get("/products/:id",adminAuth,productDetails);
router.get("/edit-product/:id",adminAuth,geteditProduct);
router.post("/edit-product/:id",uploadProductImage.any(),postEditProduct)
router.patch("/products/:id/delete",softDeleteProduct)

//logout
router.get("/logout",adminLogout)




export default router;
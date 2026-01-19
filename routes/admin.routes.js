import express from "express";
import { adminLogout, loadAdminLogin, postAdminLogin } from "../controllers/admin/auth.controller.js";
import { getDashboard } from "../controllers/admin/dashboard.controller.js";
import { getCustomers, toggleCustomerStatus } from "../controllers/admin/customer.controller.js";
import { adminAuth } from "../middlewares/adminAuth.js";
import { addCategory, editCategory, getCategory, getCategoryAjax, toggleCategory } from "../controllers/admin/categories.controller.js";
import { addProducts, getProductPage } from "../controllers/admin/product.controller.js";
const router=express.Router();

router.get("/login",loadAdminLogin);
router.post("/login",postAdminLogin);


router.get("/dashboard",adminAuth,getDashboard);


router.get("/customers",adminAuth,getCustomers);
router.patch("/customers/toggle/:userId",adminAuth,toggleCustomerStatus);

router.get("/categories",adminAuth,getCategory);
router.post("/categories",addCategory)
router.put("/categories/:id",editCategory);

router.patch("/categories/toggle/:id",adminAuth,toggleCategory);
router.get("/categories/ajax",getCategoryAjax);

router.get("/products",getProductPage);
router.get("/add-products",addProducts)


router.get("/logout",adminLogout)




export default router;
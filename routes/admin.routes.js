import express from "express";
import { adminLogout, loadAdminLogin, postAdminLogin } from "../controllers/admin/auth.controller.js";
import { getDashboard } from "../controllers/admin/dashboard.controller.js";
import { getCustomers, toggleCustomerStatus } from "../controllers/admin/customer.controller.js";
import { adminAuth } from "../middlewares/adminAuth.js";
const router=express.Router();

router.get("/login",loadAdminLogin);
router.post("/login",postAdminLogin);


router.get("/dashboard",adminAuth,getDashboard);

router.get("/customers",adminAuth,getCustomers);
router.patch("/customers/toggle/:userId",adminAuth,toggleCustomerStatus)

router.get("/logout",adminLogout)




export default router;
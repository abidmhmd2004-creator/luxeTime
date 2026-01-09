import express from "express";
import { adminLogout, loadAdminLogin, postAdminLogin } from "../controllers/admin/auth.controller.js";
import { getDashboard } from "../controllers/admin/dashboard.controller.js";
import { getCustomers } from "../controllers/admin/customer.controller.js";
const router=express.Router();

router.get("/login",loadAdminLogin);
router.post("/login",postAdminLogin);


router.get("/dashboard",getDashboard);

router.get("/customers",getCustomers)

router.get("/logout",adminLogout)


export default router;
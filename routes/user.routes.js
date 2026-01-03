import express from "express";
import { showhomePage } from "../controllers/user/home.controller.js";
import { showSignup } from "../controllers/user/auth.controller.js";
import { showLogin } from "../controllers/user/auth.controller.js";
import { postSignup } from "../controllers/user/auth.controller.js";


const router=express.Router();

router.get("/home",showhomePage);

router.get("/signup",showSignup);
router.post("/signup",postSignup);

router.get("/login",showLogin);

export default router;
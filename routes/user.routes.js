import express from "express";
import { showhomePage } from "../controllers/user/home.controller.js";
import { showSignup } from "../controllers/user/auth.controller.js";
import { showLogin } from "../controllers/user/auth.controller.js";
import { postSignup } from "../controllers/user/auth.controller.js";
import { showVerifyOtp } from "../controllers/user/auth.controller.js";
// import { getOtpPage } from "../controllers/user/otp.controller.js";
import { verifyOtp } from "../controllers/user/otp.controller.js";
import { resentOtp } from "../controllers/user/otp.controller.js";
import passport from "passport";



const router=express.Router();

router.get("/home",showhomePage);

router.get("/signup",showSignup);
router.post("/signup",postSignup);

router.get("/verify-otp",showVerifyOtp);
router.post("/verify-otp",verifyOtp);

router.post("/resend-otp",resentOtp);

router.get("/login",showLogin);

router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));
router.get("/auth/google/callback",passport.authenticate("google",{failureRedirect:"/signup"}),
(req,res)=>{
    res.redirect("/home")
})

export default router;
import express from "express";
import { showhomePage } from "../controllers/user/home.controller.js";
import { getResetPassword, logout, postForgotPass, postResetPassword, showSignup } from "../controllers/user/auth.controller.js";
import { showLogin } from "../controllers/user/auth.controller.js";
import { postSignup } from "../controllers/user/auth.controller.js";
import { showVerifyOtp } from "../controllers/user/auth.controller.js";
// import { getOtpPage } from "../controllers/user/otp.controller.js";
import { verifyOtp } from "../controllers/user/otp.controller.js";
import { resentOtp } from "../controllers/user/otp.controller.js";
import { loadForgotPass } from "../controllers/user/auth.controller.js"
import { postLogin } from "../controllers/user/auth.controller.js";
import { redirectIfAuthenticated } from "../middlewares/auth.js";

import passport from "passport";
import { requireAuth } from "../middlewares/auth.js";
import { getChangePassword, getProfile, loadChangeEmail, loadEditProfile, postChangeEmail, postChangePassword, postEditProfile } from "../controllers/user/profile.controller.js";
import { getAddress } from "../controllers/user/address.controller.js";



const router = express.Router();

router.get("/home", showhomePage);

router.get("/signup", redirectIfAuthenticated, showSignup);
router.post("/signup", postSignup);

router.get("/verify-otp", showVerifyOtp);
router.post("/verify-otp", verifyOtp);

router.post("/resend-otp", resentOtp);

router.get("/login", redirectIfAuthenticated, showLogin);
router.post("/login", postLogin);

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/signup" }),
    (req, res) => {
        req.session.user = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email
        }
        console.log("callbackHit");

        res.redirect("/home")
    })

router.get("/forgot-password", loadForgotPass);
router.post("/forgot-password", postForgotPass)

router.get("/reset-password", getResetPassword);
router.post("/reset-password", postResetPassword);

router.get("/logout", logout);

// router.get("/profile", requireAuth, (req, res) => {
//     res.render("user/profile");
// })

router.get("/profile", getProfile);

router.get("/edit-profile", loadEditProfile);
router.post("/edit-profile", postEditProfile);

router.get("/change-password", getChangePassword);
router.post("/change-Password", postChangePassword);

router.get("/change-email", loadChangeEmail);
router.post("/change-email",postChangeEmail);

router.get("/address",getAddress);

export default router;
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
import { redirectIfAuthenticated, requireOtpSession } from "../middlewares/auth.js";
import passport from "passport";
import { requireAuth } from "../middlewares/auth.js";
import { deleteProfileImage, getChangePassword, getProfile, loadChangeEmail, loadEditProfile, postChangeEmail, postChangePassword, postEditProfile, uploadProfileImage } from "../controllers/user/profile.controller.js";
import { addAddress, deleteAddress, editAddress, getAddress } from "../controllers/user/address.controller.js";
import createUploader from "../middlewares/upload.middleware.js";
import { getProducts, productDetails } from "../controllers/user/shop.controller.js";


// const uploadProfile =createUploader("profile");


const router = express.Router();

router.get("/home", showhomePage);

router.get("/signup", redirectIfAuthenticated, showSignup);
router.post("/signup", postSignup);

router.get("/verify-otp",requireOtpSession ,showVerifyOtp);
router.post("/verify-otp", verifyOtp);

router.post("/resend-otp", resentOtp);
router.get("/login",redirectIfAuthenticated, showLogin);
router.post("/login", postLogin);

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/signup" }),
    (req, res) => {
        req.session.user = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email
        }
        res.redirect("/home")
    })

router.get("/forgot-password",loadForgotPass);
router.post("/forgot-password", postForgotPass)

router.get("/reset-password", getResetPassword);
router.patch("/reset-password", postResetPassword);

router.get("/profile", requireAuth,getProfile);

router.get("/edit-profile",requireAuth,loadEditProfile);
router.post("/edit-profile", postEditProfile);

router.get("/change-password", requireAuth,getChangePassword);
router.patch("/change-Password", postChangePassword);

router.get("/change-email",requireAuth,loadChangeEmail);
router.patch("/change-email",postChangeEmail);

router.get("/address",requireAuth,getAddress);
router.post("/add-address",addAddress);
router.patch("/edit-address/:id",editAddress);

router.delete("/delete-address/:id",deleteAddress);

router.post("/upload-photo",requireAuth,createUploader("profiles").single("profileImage"),uploadProfileImage);
router.delete("/delete-photo",requireAuth,deleteProfileImage)


router.get("/shop",getProducts);

router.get("/product-details",productDetails)
router.get("/product/:id",productDetails)


router.get("/logout", logout);


export default router;
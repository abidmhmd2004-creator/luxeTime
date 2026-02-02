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
import { addToCart, getCart, removeFromCart, updateQty } from "../controllers/user/cart.controller.js";
import { addAddressCheckout, getCheckoutPage, placeOrder } from "../controllers/user/checkout.controller.js";
import { cancellFullOrder, cancelOrderItem, downloadInvoice, getOrderDetailsPage, getOrders, getOrdersSucces, returnRequest } from "../controllers/user/order.controller.js";
import { updateOrderStatus } from "../controllers/admin/order.controller.js";


// const uploadProfile =createUploader("profile");


const router = express.Router();

router.get("/home", showhomePage);

//signup
router.get("/signup", redirectIfAuthenticated, showSignup);
router.post("/signup", postSignup);


//otp verify
router.get("/verify-otp",requireOtpSession ,showVerifyOtp);
router.post("/verify-otp", verifyOtp);

//resent-otp
router.post("/resend-otp", resentOtp);
router.get("/login",redirectIfAuthenticated, showLogin);
router.post("/login", postLogin);

//goggle auth
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

//forgot password
router.get("/forgot-password",loadForgotPass);
router.post("/forgot-password", postForgotPass)

//reset-password
router.get("/reset-password", getResetPassword);
router.patch("/reset-password", postResetPassword);


//profile
router.get("/profile", requireAuth,getProfile);


//edit profile
router.get("/edit-profile",requireAuth,loadEditProfile);
router.post("/edit-profile", postEditProfile);


//change password
router.get("/change-password", requireAuth,getChangePassword);
router.patch("/change-Password", postChangePassword);


//change email
router.get("/change-email",requireAuth,loadChangeEmail);
router.patch("/change-email",postChangeEmail);


//address
router.get("/address",requireAuth,getAddress);
router.post("/add-address",addAddress);
router.patch("/edit-address/:id",editAddress);
router.delete("/delete-address/:id",deleteAddress);

//profile photo
router.post("/upload-photo",requireAuth,createUploader("profiles").single("profileImage"),uploadProfileImage);
router.delete("/delete-photo",requireAuth,deleteProfileImage)

//shop page
router.get("/shop",getProducts);

//product details
router.get("/product-details",productDetails)
router.get("/product/:id",productDetails)

//cart
router.get("/cart",requireAuth,getCart);
router.post("/cart/add",addToCart);
router.delete("/cart/remove/:variantId",removeFromCart)
router.post("/cart/update-qty",updateQty)

router.get("/checkout",getCheckoutPage);
router.post("/address-checkout",addAddressCheckout)
router.post("/checkout",placeOrder);

router.get("/orders",getOrders);
router.get("/order-success/:orderId",getOrdersSucces)

router.get("/orderDetails/:orderId",getOrderDetailsPage)
router.post("/orders/:orderId/cancel-item",cancelOrderItem)

router.post("/orders/:orderId/cancel",cancellFullOrder);

router.post("/orders/:orderId/return",returnRequest)

router.get("/orders/:orderId/invoice",downloadInvoice)
router.patch("/admin/orders/:orderId/status",updateOrderStatus );


//logout
router.post("/logout", logout);


export default router;
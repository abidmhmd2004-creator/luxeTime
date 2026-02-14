import express from "express";
import {
  getAboutPage,
  showhomePage,
} from "../controllers/user/home.controller.js";
import {
  getResetPassword,
  logout,
  postForgotPass,
  postResetPassword,
  showSignup,
} from "../controllers/user/auth.controller.js";
import { showLogin } from "../controllers/user/auth.controller.js";
import { postSignup } from "../controllers/user/auth.controller.js";
import { showVerifyOtp } from "../controllers/user/auth.controller.js";
// import { getOtpPage } from "../controllers/user/otp.controller.js";
import { verifyOtp } from "../controllers/user/otp.controller.js";
import { resentOtp } from "../controllers/user/otp.controller.js";
import { loadForgotPass } from "../controllers/user/auth.controller.js";
import { postLogin } from "../controllers/user/auth.controller.js";
import {
  redirectIfAuthenticated,
  requireOtpSession,
} from "../middlewares/auth.js";
import passport from "passport";
import { requireAuth } from "../middlewares/auth.js";
import {
  deleteProfileImage,
  getChangePassword,
  getProfile,
  loadChangeEmail,
  loadEditProfile,
  postChangeEmail,
  postChangePassword,
  postEditProfile,
  uploadProfileImage,
} from "../controllers/user/profile.controller.js";
import {
  addAddress,
  deleteAddress,
  editAddress,
  getAddress,
} from "../controllers/user/address.controller.js";
import createUploader from "../middlewares/upload.middleware.js";
import {
  getProducts,
  productDetails,
  toggleWishlist,
} from "../controllers/user/shop.controller.js";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateQty,
} from "../controllers/user/cart.controller.js";
import {
  addAddressCheckout,
  applyCoupon,
  getCheckoutPage,
  placeOrder,
  removeCoupon,
} from "../controllers/user/checkout.controller.js";
import {
  cancellFullOrder,
  cancelOrderItem,
  downloadInvoice,
  getOrderDetailsPage,
  getOrders,
  getOrdersSucces,
  getPaymentFailurePage,
  returnRequest,
} from "../controllers/user/order.controller.js";
import { updateOrderStatus } from "../controllers/admin/order.controller.js";
import {
  markPaymentFailed,
  verifyRazorpayPayment,
} from "../controllers/user/payment.controller.js";
import {
  addToWishlist,
  getWishlist,
  removeWishlistItem,
} from "../controllers/user/wishlist.conroller.js";
import { getWalletPage } from "../controllers/user/wallet.controller.js";
import { getReferralPage } from "../controllers/user/referral.controller.js";

// const uploadProfile =createUploader("profile");

const router = express.Router();

router.get("/", showhomePage);

//signup
router
  .route("/signup")
  .get(redirectIfAuthenticated, showSignup)
  .post(postSignup);

//otp verify
router
  .route("/verify-otp")
  .get(requireOtpSession, showVerifyOtp)
  .post(verifyOtp);

//resent-otp
router.post("/resend-otp", resentOtp);

//login
router
  .route("/login")
  .get(redirectIfAuthenticated, showLogin)
  .post(postLogin);

//google auth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => {
    req.session.user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    };
    res.redirect("/");
  },
);

//forgot password
router
.route("forgot-password")
.get(loadForgotPass)
.post(postForgotPass)

//reset-password
router.route("/reset-password")
.get(getResetPassword)
.post(postResetPassword)

//profile
router.get("/profile", requireAuth, getProfile);

//edit profile
router
  .route("/edit-profile")
  .get(requireAuth,loadEditProfile)
  .post(postEditProfile)

//change password
router
  .route("/change-password")
  .get(requireAuth, getChangePassword)
  .patch( postChangePassword);

//change email
router
  .route("/change-email")
  .get(requireAuth, loadChangeEmail)
  .patch(postChangeEmail);

//address
router.get("/address", requireAuth, getAddress);
router.post("/add-address", addAddress);
router.patch("/edit-address/:id", editAddress);
router.delete("/delete-address/:id", deleteAddress);

//profile photo
router.post(
  "/upload-photo",
  requireAuth,
  createUploader("profiles").single("profileImage"),
  uploadProfileImage,
);
router.delete("/delete-photo", requireAuth, deleteProfileImage);

//shop page
router.get("/shop", getProducts);

//product details
router.get("/product-details", productDetails);
router.get("/product/:id", productDetails);

//cart
router.get("/cart", requireAuth, getCart);
router.post("/cart/add", requireAuth, addToCart);
router.delete("/cart/remove/:variantId", removeFromCart);
router.post("/cart/update-qty", requireAuth, updateQty);

router
  .route("/checkout") 
  .get(requireAuth, getCheckoutPage)
  .post(requireAuth,placeOrder)
router.post("/address-checkout", requireAuth, addAddressCheckout);

router.post("/checkout/verify-payment", verifyRazorpayPayment);
router.get("/payment-failed/:orderId", getPaymentFailurePage);
router.post("/checkout/mark-payment-failed", markPaymentFailed);
router.post("/checkout/apply-coupon", applyCoupon);
router.delete("/checkout/remove-coupon", removeCoupon);

router.get("/orders", requireAuth, getOrders);
router.get("/order-success/:orderId", getOrdersSucces);

router.get("/orderDetails/:orderId", getOrderDetailsPage);
router.post("/orders/:orderId/cancel-item", cancelOrderItem);

router.post("/orders/:orderId/cancel", cancellFullOrder);

router.post("/orders/:orderId/return", requireAuth, returnRequest);

router.get("/orders/:orderId/invoice", downloadInvoice);
router.patch("/admin/orders/:orderId/status", updateOrderStatus);

//wishlist
router.get("/wishlist", requireAuth, getWishlist);
router.post("/wishlist/add", addToWishlist);
router.delete("/wishlist/remove/:itemId", removeWishlistItem);
router.post("/wishlist/toggle", toggleWishlist);

router.get("/wallet", getWalletPage);

router.get("/referral", getReferralPage);

router.get("/about", getAboutPage);

//logout
router.post("/logout", logout);

export default router;

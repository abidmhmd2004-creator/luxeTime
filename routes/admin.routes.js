import express from 'express';
import {
  adminLogout,
  loadAdminLogin,
  postAdminLogin,
} from '../controllers/admin/auth.controller.js';
import { getDashboard } from '../controllers/admin/dashboard.controller.js';
import { getCustomers, toggleCustomerStatus } from '../controllers/admin/customer.controller.js';
import { adminAuth } from '../middlewares/adminAuth.js';
import {
  addCategory,
  editCategory,
  getCategory,
  getCategoryAjax,
  softDeleteCategory,
  toggleCategory,
} from '../controllers/admin/categories.controller.js';
import {
  getaddProducts,
  geteditProduct,
  getProductPage,
  postAddProducts,
  postEditProduct,
  productDetails,
  softDeleteProduct,
} from '../controllers/admin/product.controller.js';
import { uploadProfileImage } from '../controllers/user/profile.controller.js';
import createUploader from '../middlewares/upload.middleware.js';
import {
  getOrderDetailsPage,
  getOrdersPage,
  updateOrderStatus,
  updateReturnStatus,
} from '../controllers/admin/order.controller.js';
import {
  addCoupon,
  deleteCoupon,
  editCoupon,
  getCouponPage,
  toggleCouponStatus,
} from '../controllers/admin/coupon.controller.js';
import { exportSalesPDF } from '../controllers/admin/salesReport.controller.js';
import { exportSalesExcel } from '../controllers/admin/salesReport.controller.js';
import { getReferralManagement } from '../controllers/admin/referral.controller.js';

const uploadProductImage = createUploader('products');

const router = express.Router();

//login
router.route('/login').get(loadAdminLogin).post(postAdminLogin);

//dashboard
router.get('/dashboard', adminAuth, getDashboard);

//cutomers
router.get('/customers', adminAuth, getCustomers);
router.patch('/customers/toggle/:userId', adminAuth, toggleCustomerStatus);

//category
router.route('/categories').get(adminAuth, getCategory).post(adminAuth, addCategory);

router.put('/categories/:id', adminAuth, editCategory);
router.patch('/category/:id/delete', adminAuth, softDeleteCategory);
router.patch('/categories/toggle/:id', adminAuth, toggleCategory);
router.get('/categories/ajax', adminAuth, getCategoryAjax);

//products
router.get('/products', adminAuth, getProductPage);
router
  .route('/add-products')
  .get(adminAuth, getaddProducts)
  .post(adminAuth, uploadProductImage.any(), postAddProducts);

router.get('/products/:id', adminAuth, productDetails);

router
  .route('/edit-product/:id')
  .get(adminAuth, geteditProduct)
  .post(adminAuth, uploadProductImage.any(), postEditProduct);

router.patch('/products/:id/delete', adminAuth, softDeleteProduct);

//orders
router.get('/orders', adminAuth, getOrdersPage);
router.get('/orders/:orderId', adminAuth, getOrderDetailsPage);
router.patch('/admin/orders/:orderId/status', adminAuth, updateOrderStatus);
router.patch('/orders/return-update', adminAuth, updateReturnStatus);

//coupons
router.get('/coupons', adminAuth, getCouponPage);
router.post('/coupons/add', adminAuth, addCoupon);
router.put('/coupons/edit/:couponId', adminAuth, editCoupon);
router.patch('/coupons/toggle/:couponId', adminAuth, toggleCouponStatus);
router.delete('/coupons/delete/:couponId', adminAuth, deleteCoupon);

//report
router.get('/reports', adminAuth, getDashboard);
router.get('/reports/excel', adminAuth, exportSalesExcel);
router.get('/reports/pdf', adminAuth, exportSalesPDF);

router.get('/referral', adminAuth, getReferralManagement);

//logout
router.get('/logout', adminLogout);

export default router;

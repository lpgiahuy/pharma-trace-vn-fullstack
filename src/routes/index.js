import express from 'express';

// --- E-commerce (Ecom) Routes ---
import authRoutes from './ecom/authRoutes.js';
import productRoutes from './ecom/productRoutes.js';
import cartRoutes from './ecom/cartRoutes.js';
import orderRoutes from './ecom/orderRoutes.js';
import prescriptionRoutes from './ecom/prescriptionRoutes.js';
import reviewRoutes from './ecom/reviewRoutes.js';
import wishlistRoutes from './ecom/wishlistRoutes.js';
import ecomVoucherRoutes from './ecom/voucherRoutes.js';
import ecomRmaRoutes from './ecom/rmaRoutes.js';
import ecomBlogRoutes from './ecom/blogRoutes.js';

// --- Pharma & Logistics Routes ---
import traceRoutes from './pharma/traceRoutes.js';
import inventoryRoutes from './pharma/inventoryRoutes.js';
import dashboardRoutes from './pharma/dashboardRoutes.js';
import logisticsRoutes from './pharma/logisticsRoutes.js';
import kienHangRoutes from './pharma/kienHangRoutes.js';

// --- Admin Management Routes ---
import adminAuthRoutes from './admin/adminAuthRoutes.js';
import adminProductRoutes from './admin/adminProductRoutes.js';
import adminOrderRoutes from './admin/adminOrderRoutes.js';
import adminPrescriptionRoutes from './admin/adminPrescriptionRoutes.js';
import adminStaffRoutes from './admin/adminStaffRoutes.js';
import adminCustomerRoutes from './admin/adminCustomerRoutes.js';
import adminVoucherRoutes from './admin/adminVoucherRoutes.js';
import adminCategoryRoutes from './admin/adminCategoryRoutes.js';
import adminBlogRoutes from './admin/adminBlogRoutes.js';
import adminRmaRoutes from './admin/adminRmaRoutes.js';

const router = express.Router();

// ==========================================
// 1. E-commerce Routes (Customer Facing)
// ==========================================
router.use('/auth', authRoutes); // auth for customers (login, register, etc.)
router.use('/products', productRoutes); // public product routes (list, detail) - no auth required
router.use('/cart', cartRoutes); // cart routes (add to cart, view cart, update cart) - auth required
router.use('/orders', orderRoutes); // order routes (place order, view orders) - auth required
router.use('/prescriptions', prescriptionRoutes); // prescription routes (upload prescription, view prescriptions) - auth required for customers
router.use('/reviews', reviewRoutes); // review routes (submit review, view reviews) - auth required for customers
router.use('/wishlist', wishlistRoutes); // wishlist routes (add to wishlist, view wishlist) - auth required for customers
router.use('/vouchers', ecomVoucherRoutes); // voucher routes (redeem voucher, view available vouchers) - auth required for customers
router.use('/rma', ecomRmaRoutes); // RMA routes (submit RMA, view RMA status) - auth required for customers
router.use('/blogs', ecomBlogRoutes); // public blog routes (list articles, read detail) - no auth required

// ==========================================
// 2. Pharma & Logistics Routes (Staff/System)
// ==========================================
router.use('/trace', traceRoutes); // traceability routes (trace product by QR code) - public
router.use('/inventory', inventoryRoutes); // inventory management routes (view stock, update stock) - auth required for pharma staff
router.use('/dashboard', dashboardRoutes); // dashboard routes (sales stats, inventory stats) - auth required for pharma staff
router.use('/logistics', logisticsRoutes); // logistics routes (manage shipments, view delivery status) - auth required for pharma staff
router.use('/kien-hang', kienHangRoutes); // bundle/pallet management (create, transfer, inspect) - QuanLyKho & SuperAdmin

// ==========================================
// 3. Admin Routes (Internal Management)
// ==========================================
router.use('/admin/auth', adminAuthRoutes); // auth for admin
router.use('/admin/products', adminProductRoutes); // admin product management routes (CRUD products) - auth required for admin
router.use('/admin/orders', adminOrderRoutes); // admin order management routes (view all orders, update order status) - auth required for admin
router.use('/admin/prescriptions', adminPrescriptionRoutes); // admin prescription management routes (view all prescriptions, update prescription status) - auth required for admin
router.use('/admin/staff', adminStaffRoutes); // admin staff management routes (CRUD staff) - auth required for admin
router.use('/admin/customers', adminCustomerRoutes); // admin customer management (list, detail, lock/unlock) - SuperAdmin only
router.use('/admin/vouchers', adminVoucherRoutes); // admin voucher management routes (CRUD vouchers) - auth required for admin
router.use('/admin/categories', adminCategoryRoutes); // admin category management routes (CRUD categories) - auth required for admin
router.use('/admin/blogs', adminBlogRoutes); // admin blog management routes (CRUD blogs) - auth required for admin
router.use('/admin/rma', adminRmaRoutes); // admin RMA management routes (view all RMAs, update RMA status) - auth required for admin xong

export default router;
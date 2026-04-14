import * as cartService from '../../services/ecom/cartService.js';

const getCart = async (req, res, next) => {
    try {
        const userId = req.user.id; // get user ID from authenticated request
        const data = await cartService.fetchUserCart(userId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const addCartItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { duoc_pham_id, quy_cach_id, so_luong } = req.body;

        if (!duoc_pham_id || !quy_cach_id || !so_luong) {
            res.status(400);
            throw new Error('Missing product information or packaging details');
        }

        const data = await cartService.addToCart(userId, duoc_pham_id, quy_cach_id, so_luong);
        res.status(200).json({ success: true, message: 'Added to cart successfully', data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const updateCartItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { duoc_pham_id, quy_cach_id, so_luong } = req.body;

        if (!duoc_pham_id || !quy_cach_id || so_luong === undefined) {
          res.status(400);
          throw new Error('Missing required fields for update');
        }

        const data = await cartService.updateCartQuantity(userId, duoc_pham_id, quy_cach_id, so_luong);
        res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
};

const removeCartItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { duoc_pham_id } = req.params;
        const { quy_cach_id } = req.query;

        if (!duoc_pham_id) {
          res.status(400);
          throw new Error('Missing product ID');
        }

        await cartService.removeFromCart(userId, duoc_pham_id, quy_cach_id);
        res.status(200).json({ success: true, message: 'Removed from cart' });
    } catch (error) {
      next(error);
    }
};

export { getCart, addCartItem, updateCartItem, removeCartItem };
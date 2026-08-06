import * as cartModel from '../../models/ecom/cartModel.js';

const fetchUserCart = async (userId) => {
    const items = await cartModel.getCartItems(userId);
    
    // sum up total amount
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.thanh_tien), 0);
    
    return {
        items: items,
        total_items: items.length,
        total_amount: totalAmount
    };
};

const addToCart = async (userId, duoc_pham_id, quy_cach_id, so_luong) => {
    if (so_luong <= 0) {
        const error = new Error('Quantity must be greater than zero');
        error.statusCode = 400;
        throw error;
    }
    return await cartModel.upsertCartItem(userId, duoc_pham_id, quy_cach_id, so_luong);
};

const updateCartQuantity = async (userId, duoc_pham_id, quy_cach_id, so_luong) => {
    if (so_luong <= 0) {
        return await cartModel.removeCartItem(userId, duoc_pham_id, quy_cach_id);
    }
    return await cartModel.updateItemQuantity(userId, duoc_pham_id, quy_cach_id, so_luong);
};

const removeFromCart = async (userId, duoc_pham_id, quy_cach_id) => {
    return await cartModel.removeCartItem(userId, duoc_pham_id, quy_cach_id);
};

export { fetchUserCart, addToCart, updateCartQuantity, removeFromCart };
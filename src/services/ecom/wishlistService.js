import * as wishlistModel from '../../models/ecom/wishlistModel.js';

export const fetchWishlist = async (khach_hang_id) => {
    return await wishlistModel.getWishlist(khach_hang_id);
};

export const addProductToWishlist = async (khach_hang_id, duoc_pham_id) => {
    if (!duoc_pham_id) {
        const error = new Error('Please provide the product ID to add to favorites!');
        error.statusCode = 400;
        throw error;
    }
    return await wishlistModel.addToWishlist(khach_hang_id, duoc_pham_id);
};

export const removeProductFromWishlist = async (khach_hang_id, duoc_pham_id) => {
    const isRemoved = await wishlistModel.removeFromWishlist(khach_hang_id, duoc_pham_id);
    if (!isRemoved) {
        const error = new Error('Product is not in your favorites!');
        error.statusCode = 404;
        throw error;
    }
    return true;
};

export const isProductInWishlist = async (khach_hang_id, duoc_pham_id) => {
    return await wishlistModel.checkIfFavorited(khach_hang_id, duoc_pham_id);
};
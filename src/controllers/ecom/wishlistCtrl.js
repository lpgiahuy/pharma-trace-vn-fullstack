import * as wishlistService from '../../services/ecom/wishlistService.js';

const getMyWishlist = async (req, res, next) => {
    try {
        const data = await wishlistService.fetchWishlist(req.user.id);
        res.status(200).json({
            success: true,
            total_items: data.length,
            data
        });
    } catch (error) { next(error); }
};

const addWishlist = async (req, res, next) => {
    try {
        const { duoc_pham_id } = req.body;
        const isAdded = await wishlistService.addProductToWishlist(req.user.id, duoc_pham_id);
        
        if (isAdded) {
            res.status(201).json({ success: true, message: 'Product added to favorites' });
        } else {
            res.status(200).json({ success: true, message: 'Product is already in your favorites.' });
        }
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const removeWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;
        await wishlistService.removeProductFromWishlist(req.user.id, productId);
        
        res.status(200).json({ success: true, message: 'Product removed from favorites!' });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const toggleWishlist = async (req, res, next) => {
    try {
        const { duoc_pham_id } = req.body;
        const userId = req.user.id;
        
        const exists = await wishlistService.isProductInWishlist(userId, duoc_pham_id);
        
        if (exists) {
            await wishlistService.removeProductFromWishlist(userId, duoc_pham_id);
            res.status(200).json({ success: true, message: 'Removed from favorites', isFavorited: false });
        } else {
            await wishlistService.addProductToWishlist(userId, duoc_pham_id);
            res.status(200).json({ success: true, message: 'Added to favorites', isFavorited: true });
        }
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { getMyWishlist, addWishlist, removeWishlist, toggleWishlist };
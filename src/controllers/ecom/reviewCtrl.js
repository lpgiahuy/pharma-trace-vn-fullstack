import * as reviewService from '../../services/ecom/reviewService.js';

const createReview = async (req, res, next) => {
    try {
        // req.user.id getted from protect middleware (Customer's token)
        const data = await reviewService.addProductReview(req.user.id, req.body);
        
        res.status(201).json({
            success: true,
            message: 'Thank you for reviewing the product!',
            data
        });
    } catch (error) {
        // error code 23505 is unique violation error from PostgreSQL, which means the customer has already reviewed this product (unique constraint on khach_hang_id + duoc_pham_id in DanhGiaSanPham table)
        if (error.code === '23505') {
            res.status(400);
            return next(new Error('You have already reviewed this product!'));
        }
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const getReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const data = await reviewService.fetchProductReviews(productId);
        
        res.status(200).json({
            success: true,
            total_reviews: data.length,
            data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export {
    createReview,
    getReviews
};
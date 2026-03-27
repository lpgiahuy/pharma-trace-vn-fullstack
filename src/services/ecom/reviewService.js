import * as reviewModel from '../../models/ecom/reviewModel.js';

export const addProductReview = async (khach_hang_id, payload) => {
    const { duoc_pham_id, so_sao, noi_dung } = payload;

    if (!duoc_pham_id || !so_sao) {
        const error = new Error('Product ID and rating are required to submit a review!');
        error.statusCode = 400;
        throw error;
    }

    if (so_sao < 1 || so_sao > 5) {
        const error = new Error('Rating must be between 1 and 5 stars!');
        error.statusCode = 400;
        throw error;
    }

    return await reviewModel.createReview(khach_hang_id, duoc_pham_id, so_sao, noi_dung);
};

export const fetchProductReviews = async (duoc_pham_id) => {
    if (!duoc_pham_id) {
        const error = new Error('Please provide the product ID to view reviews!');
        error.statusCode = 400;
        throw error;
    }
    return await reviewModel.getReviewsByProductId(duoc_pham_id);
};
import * as productService from '../../services/ecom/productService.js';

const getCategories = async (req, res, next) => {
    try {
        const data = await productService.fetchCategories();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const getProducts = async (req, res, next) => {
    try {
        const userId = req.user?.id || null;
        const data = await productService.fetchProducts(req.query, userId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const getProductDetail = async (req, res, next) => {
    try {
        const userId = req.user?.id || null;
        const data = await productService.fetchProductDetail(req.params.id, userId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { getCategories, getProducts, getProductDetail };
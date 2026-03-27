import * as productModel from '../../models/ecom/productModel.js';

const fetchCategories = async () => {
    return await productModel.getAllCategories();
};

const fetchProducts = async (query) => {
    // process query parameters with defaults for pagination and filtering
    const categoryId = query.category || null;
    const search = query.search || null;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;

    const products = await productModel.getProducts(categoryId, search, limit, offset);
    
    return {
        current_page: page,
        limit_per_page: limit,
        items: products
    };
};

const fetchProductDetail = async (id) => {
    const product = await productModel.getProductById(id);
    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }
    return product;
};

export { fetchCategories, fetchProducts, fetchProductDetail };
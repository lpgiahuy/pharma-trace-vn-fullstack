import * as productModel from '../../models/ecom/productModel.js';

const fetchCategories = async () => {
    const flatCategories = await productModel.getAllCategories();
    
    const categoryMap = {};
    const tree = [];

    // Initialize map
    flatCategories.forEach(cat => {
        categoryMap[cat.id] = { ...cat, children: [] };
    });

    // Build tree
    flatCategories.forEach(cat => {
        if (cat.danh_muc_cha_id) {
            if (categoryMap[cat.danh_muc_cha_id]) {
                categoryMap[cat.danh_muc_cha_id].children.push(categoryMap[cat.id]);
            }
        } else {
            tree.push(categoryMap[cat.id]);
        }
    });

    return tree;
};

const fetchProducts = async (query, userId = null) => {
    // process query parameters with defaults
    const categoryId = query.category || null;
    const search = query.search || null;
    const sort = query.sort || 'newest';
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    const products = await productModel.getProducts(categoryId, search, sort, limit, offset, userId);
    
    return {
        current_page: page,
        limit_per_page: limit,
        items: products
    };
};

const fetchProductDetail = async (idOrSlug, userId = null) => {
    const product = await productModel.getProductByIdOrSlug(idOrSlug, userId);
    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }
    return product;
};

export { fetchCategories, fetchProducts, fetchProductDetail };
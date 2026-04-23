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
    const isFlashSale = query.is_flash_sale === 'true';

    const products = await productModel.getProducts(categoryId, search, sort, limit, offset, userId, isFlashSale);
    
    // Map DB fields to Frontend fields
    const mappedItems = products.map(p => ({
        id: p.id,
        name: p.ten_thuoc,
        slug: p.slug,
        image: p.hinh_anh_url,
        price: parseFloat(p.gia_ban),
        originalPrice: parseFloat(p.gia_goc),
        discount: p.phan_tram_giam,
        unit: p.don_vi_ban,
        inStock: p.total_stock > 0,
        totalStock: p.total_stock,
        isPrescription: p.la_thuoc_ke_don,
        rating: parseFloat(p.diem_danh_gia),
        isFavorited: p.is_favorited,
        soldCount: p.so_luong_da_ban
    }));

    return {
        current_page: page,
        limit_per_page: limit,
        items: mappedItems
    };
};

const fetchProductDetail = async (idOrSlug, userId = null) => {
    const p = await productModel.getProductByIdOrSlug(idOrSlug, userId);
    if (!p) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }
    
    // Map main product to frontend expectations
    const mappedProduct = {
        id: p.id,
        name: p.ten_thuoc,
        slug: p.slug,
        registrationNumber: p.so_dang_ky,
        image: p.hinh_anh_url,
        isPrescription: p.la_thuoc_ke_don,
        shortDescription: p.mo_ta_ngan,
        chi_tiet_thuoc: p.chi_tiet_thuoc, // KEEP THIS AS IS FOR THE TABS
        soldCount: p.so_luong_da_ban,
        rating: parseFloat(p.diem_danh_gia),
        category: p.ten_danh_muc,
        manufacturer: p.nha_san_xuat,
        totalStock: p.total_stock,
        inStock: p.total_stock > 0,
        isFavorited: p.is_favorited,
        variants: p.quy_cach_dong_goi.map(v => ({
            id: v.quy_cach_id,
            unit: v.ten_don_vi,
            price: parseFloat(v.gia_ban),
            originalPrice: parseFloat(v.gia_goc),
            discount: v.phan_tram_giam
        }))
    };

    return mappedProduct;
};

const fetchUniqueBrands = async () => {
    return await productModel.getUniqueBrands();
};

export { fetchCategories, fetchProducts, fetchProductDetail, fetchUniqueBrands };
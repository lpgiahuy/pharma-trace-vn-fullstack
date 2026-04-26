import * as adminProductService from '../../services/admin/adminProductService.js';

const createProduct = async (req, res, next) => {
    try {
        const newId = await adminProductService.addProduct(req.body);
        res.status(201).json({
            success: true,
            message: 'Product and packaging configurations created successfully.',
            data: { duoc_pham_id: newId }
        });
    } catch (error) {
        if (error.code === '23505') {
            res.status(400);
            return next(new Error('Failed! The drug registration number already exists in the system.'));
        }
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        await adminProductService.removeProduct(id);
        res.status(200).json({
            success: true,
            message: `Successfully permanently deleted the product with ID ${id}.`
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const toggleProductStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await adminProductService.changeStatus(id);
        res.status(200).json({
            success: true,
            message: `Product status toggled to ${product.trang_thai ? 'Active' : 'Hidden'}`,
            data: product
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const getAllProductsAdmin = async (req, res, next) => {
    try {
        const data = await adminProductService.fetchAdminProducts(req.query) || [];
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const getProductDetailAdmin = async (req, res, next) => {
    try {
        const data = await adminProductService.fetchAdminProductById(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        await adminProductService.editProduct(id, req.body);
        
        res.status(200).json({
            success: true,
            message: `Successfully updated the product with ID ${id}`
        });
    } catch (error) {
        if (error.code === '23505') {
            res.status(400);
            return next(new Error('Failed! The drug registration number already exists in the system.'));
        }
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { 
    createProduct, 
    deleteProduct, 
    toggleProductStatus, 
    getAllProductsAdmin, 
    getProductDetailAdmin, 
    updateProduct 
};
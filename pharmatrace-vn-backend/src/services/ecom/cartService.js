import * as cartModel from '../../models/ecom/cartModel.js';
import prisma from '../../config/prisma.js';

const resolveValidQuyCach = async (duoc_pham_id, quy_cach_id) => {
    if (duoc_pham_id && quy_cach_id) {
        const match = await prisma.quycachdonggoi.findFirst({
            where: { id: Number(quy_cach_id), duoc_pham_id: Number(duoc_pham_id) },
            select: { id: true }
        });
        if (match) return match.id;
    }
    const defaultUnit = await prisma.quycachdonggoi.findFirst({
        where: { duoc_pham_id: Number(duoc_pham_id) },
        orderBy: { id: 'asc' },
        select: { id: true }
    });
    return defaultUnit ? defaultUnit.id : Number(quy_cach_id);
};

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
    const validUnitId = await resolveValidQuyCach(duoc_pham_id, quy_cach_id);
    return await cartModel.upsertCartItem(userId, duoc_pham_id, validUnitId, so_luong);
};

const updateCartQuantity = async (userId, duoc_pham_id, quy_cach_id, so_luong) => {
    const validUnitId = await resolveValidQuyCach(duoc_pham_id, quy_cach_id);
    if (so_luong <= 0) {
        return await cartModel.removeCartItem(userId, duoc_pham_id, validUnitId);
    }
    return await cartModel.updateItemQuantity(userId, duoc_pham_id, validUnitId, so_luong);
};

const removeFromCart = async (userId, duoc_pham_id, quy_cach_id) => {
    const validUnitId = await resolveValidQuyCach(duoc_pham_id, quy_cach_id);
    return await cartModel.removeCartItem(userId, duoc_pham_id, validUnitId);
};

export { fetchUserCart, addToCart, updateCartQuantity, removeFromCart };
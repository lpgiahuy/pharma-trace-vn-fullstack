import * as orderModel from '../../models/ecom/orderModel.js';
import * as cartModel from '../../models/ecom/cartModel.js';

const processCheckout = async (userId, payload) => {
    const { dia_chi_giao_hang, phuong_thuc_thanh_toan, ma_giam_gia, diem_su_dung } = payload;

    // check if cart is empty before checkout
    const cartItems = await cartModel.getCartItems(userId);
    if (cartItems.length === 0) {
        const error = new Error('Your cart is empty!');
        error.statusCode = 400;
        throw error;
    }

    const voucher = ma_giam_gia ? ma_giam_gia : null;
    const points = diem_su_dung ? parseInt(diem_su_dung) : 0;

    // call procedure to create order from cart
    const newOrder = await orderModel.callCheckoutProcedure(
        userId, 
        dia_chi_giao_hang, 
        phuong_thuc_thanh_toan, 
        voucher, 
        points
    );

    return newOrder;
};

export { processCheckout };
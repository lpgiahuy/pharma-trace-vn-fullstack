import * as orderService from '../../services/ecom/orderService.js';

const checkoutOrder = async (req, res, next) => {
    try {
        const userId = req.user.id; 
        
        if (!req.body.dia_chi_giao_hang) {
            res.status(400);
            throw new Error('Shipping address is required');
        }

        const order = await orderService.processCheckout(userId, req.body);

        res.status(201).json({ 
            success: true, 
            message: 'Order placed successfully! The order is pending confirmation.', 
            data: order 
        });
    } catch (error) {
        res.status(400); 
        next(error);
    }
};

export { checkoutOrder };
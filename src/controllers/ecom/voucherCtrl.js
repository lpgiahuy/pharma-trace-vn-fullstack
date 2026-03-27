import * as voucherService from '../../services/ecom/voucherService.js';

const applyVoucher = async (req, res, next) => {
    try {
        const { ma_code, tong_tien_don_hang } = req.body;
        const data = await voucherService.validateVoucher(ma_code, tong_tien_don_hang);
        
        res.status(200).json({
            success: true,
            message: 'Voucher applied successfully!',
            data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { applyVoucher }
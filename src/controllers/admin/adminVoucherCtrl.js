import * as adminVoucherService from '../../services/admin/adminVoucherService.js';

const getVouchers = async (req, res, next) => {
    try {
        const data = await adminVoucherService.fetchVouchers();
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const createVoucher = async (req, res, next) => {
    try {
        const data = await adminVoucherService.addVoucher(req.body);
        res.status(201).json({ success: true, message: 'Create voucher successfully!', data });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            res.status(400);
            return next(new Error('This voucher code already exists. Please choose a different code.'));
        }
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const deleteVoucher = async (req, res, next) => {
    try {
        await adminVoucherService.removeVoucher(req.params.id);
        res.status(200).json({ success: true, message: 'Voucher deleted successfully!' });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { getVouchers, createVoucher, deleteVoucher };

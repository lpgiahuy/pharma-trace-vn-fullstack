import * as adminCustomerService from '../../services/admin/adminCustomerService.js';

const getCustomers = async (req, res, next) => {
    try {
        const data = await adminCustomerService.fetchAllCustomers();
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

const getCustomerById = async (req, res, next) => {
    try {
        const data = await adminCustomerService.fetchCustomerDetail(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

// PATCH /admin/customers/:id/status  body: { action: "lock" | "unlock" }
const updateCustomerStatus = async (req, res, next) => {
    try {
        const { action } = req.body;
        if (!action) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp action: "lock" hoặc "unlock".' });
        }
        const data = await adminCustomerService.toggleCustomerStatus(req.params.id, action);
        const message = action === 'lock' ? 'Đã khóa tài khoản khách hàng.' : 'Đã mở khóa tài khoản khách hàng.';
        res.status(200).json({ success: true, message, data });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { getCustomers, getCustomerById, updateCustomerStatus };

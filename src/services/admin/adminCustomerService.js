import * as adminCustomerModel from '../../models/admin/adminCustomerModel.js';

const fetchAllCustomers = async () => {
    return await adminCustomerModel.getAllCustomers();
};

const fetchCustomerDetail = async (id) => {
    const customer = await adminCustomerModel.getCustomerDetail(id);
    if (!customer) {
        const error = new Error('Không tìm thấy khách hàng!');
        error.statusCode = 404;
        throw error;
    }
    return customer;
};

// Lock or unlock a customer account
const toggleCustomerStatus = async (id, action) => {
    if (!['lock', 'unlock'].includes(action)) {
        const error = new Error('Hành động không hợp lệ. Chỉ chấp nhận "lock" hoặc "unlock".');
        error.statusCode = 400;
        throw error;
    }

    const newStatus = action === 'unlock'; // unlock → true, lock → false
    const updated = await adminCustomerModel.setCustomerStatus(id, newStatus);

    if (!updated) {
        const error = new Error('Không tìm thấy khách hàng!');
        error.statusCode = 404;
        throw error;
    }

    return updated;
};

export { fetchAllCustomers, fetchCustomerDetail, toggleCustomerStatus };

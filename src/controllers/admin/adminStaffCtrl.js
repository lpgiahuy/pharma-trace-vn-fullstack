import * as adminStaffService from '../../services/admin/adminStaffService.js';

const getStaffList = async (req, res, next) => {
    try {
        const data = await adminStaffService.fetchStaffList();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const createStaffAccount = async (req, res, next) => {
    try {
        const data = await adminStaffService.addStaff(req.body);
        res.status(201).json({
            success: true,
            message: 'Employee account created successfully!',
            data
        });
    } catch (error) {
        if (error.code === '23505') { // error code for unique violation in PostgreSQL
            res.status(400);
            return next(new Error('Failed! This email is already in use for another account.'));
        }
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const updateStaffInfo = async (req, res, next) => {
    try {
        const data = await adminStaffService.editStaff(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: 'Employee information updated successfully!',
            data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const disableStaffAccount = async (req, res, next) => {
    try {
        const targetId = parseInt(req.params.id)
        if (req.user?.id === targetId) {
            res.status(400)
            return next(new Error('Không thể xóa tài khoản của chính mình.'))
        }
        await adminStaffService.removeStaff(targetId);
        res.status(200).json({ success: true, message: 'Employee account disabled successfully!' });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { getStaffList, createStaffAccount, updateStaffInfo, disableStaffAccount };
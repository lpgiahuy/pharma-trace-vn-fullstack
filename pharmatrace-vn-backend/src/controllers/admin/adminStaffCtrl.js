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
        if (error.code === 'P2002' || error.code === '23505') { 
            res.status(400);
            return next(new Error('Email này đã được sử dụng cho một tài khoản khác trong hệ thống.'));
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
        res.status(200).json({ success: true, message: 'Đã xóa vĩnh viễn tài khoản nhân viên thành công!' });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { getStaffList, createStaffAccount, updateStaffInfo, disableStaffAccount };
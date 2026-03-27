import bcrypt from 'bcryptjs';
import * as adminStaffModel from '../../models/admin/adminStaffModel.js';

const fetchStaffList = async () => {
    return await adminStaffModel.getAllStaff();
};

const addStaff = async (payload) => {
    const { don_vi_id, ho_ten, email, password, vai_tro } = payload;

    // Validate role 
    const validRoles = ['SuperAdmin', 'QuanLyKho', 'BanHang', 'KeToan', 'DuocSi'];
    if (!validRoles.includes(vai_tro)) {
        const error = new Error(`Invalid role! Please choose one of: ${validRoles.join(', ')}`);
        error.statusCode = 400;
        throw error;
    }

    // Hash the password before saving to database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return await adminStaffModel.createStaff(don_vi_id, ho_ten, email, hashedPassword, vai_tro);
};

const editStaff = async (id, payload) => {
    const { don_vi_id, ho_ten, vai_tro, trang_thai } = payload;
    
    const updated = await adminStaffModel.updateStaff(id, don_vi_id, ho_ten, vai_tro, trang_thai);
    if (!updated) {
        const error = new Error('Employee not found!');
        error.statusCode = 404;
        throw error;
    }
    return updated;
};

const removeStaff = async (id) => {
    const isDeleted = await adminStaffModel.softDeleteStaff(id);
    if (!isDeleted) {
        const error = new Error('Employee not found!');
        error.statusCode = 404;
        throw error;
    }
    return true;
};

export { fetchStaffList, addStaff, editStaff, removeStaff };
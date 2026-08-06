import bcrypt from 'bcryptjs';
import * as adminAuthModel from '../../models/admin/adminAuthModel.js';
import { generateToken } from '../../utils/jwtHelper.js';

const loginAdmin = async (email, password) => {
    // find employee by email
    const employee = await adminAuthModel.getEmployeeByEmail(email);
    if (!employee) {
        const error = new Error('Account not found or has been disabled!');
        error.statusCode = 401;
        throw error;
    }

    // check password
    const isMatch = await bcrypt.compare(password, employee.mat_khau_hash);
    if (!isMatch) {
        const error = new Error('Incorrect password!');
        error.statusCode = 401;
        throw error;
    }

    // generate JWT token
    const token = generateToken(employee.id, employee.vai_tro);

    return {
        nhan_vien: {
            id: employee.id,
            ho_ten: employee.ho_ten,
            email: employee.email,
            vai_tro: employee.vai_tro,
            don_vi_id: employee.don_vi_id
        },
        token: token
    };
};

export { loginAdmin };
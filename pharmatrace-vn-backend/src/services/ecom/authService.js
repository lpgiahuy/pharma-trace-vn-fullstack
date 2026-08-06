import * as authModel from '../../models/ecom/authModel.js';
import { hashPassword, comparePassword } from '../../utils/hashHelper.js';
import { generateToken } from '../../utils/jwtHelper.js';

const registerUser = async (ho_ten, so_dien_thoai, mat_khau) => {
    // Check if user already exists
    const userExists = await authModel.findUserByPhone(so_dien_thoai);
    if (userExists) {
        const error = new Error('This phone number is already registered');
        error.statusCode = 400;
        throw error;
    }

    const hashedPass = await hashPassword(mat_khau);
    
    const newUser = await authModel.createUser(ho_ten, so_dien_thoai, hashedPass);
    
    // Gererate token for the new user
    const token = generateToken(newUser.id);

    return { user: newUser, token };
};

const loginUser = async (so_dien_thoai, mat_khau) => {
    // find user by phone number
    const user = await authModel.findUserByPhone(so_dien_thoai);
    if (!user) {
        const error = new Error('Account does not exist');
        error.statusCode = 401;
        throw error;
    }

    // compare password
    const isMatch = await comparePassword(mat_khau, user.mat_khau_hash);
    if (!isMatch) {
        const error = new Error('Incorrect password');
        error.statusCode = 401;
        throw error;
    }

    // generate token and return user info
    const token = generateToken(user.id);
    delete user.mat_khau_hash; 

    return { user, token };
};

const getUserProfile = async (id) => {
    const user = await authModel.findUserById(id);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};
const getLoyaltyProgress = async (id) => {
    const progress = await authModel.getLoyaltyUpgradeProgress(id);
    if (!progress) {
        const error = new Error('Could not retrieve loyalty progress');
        error.statusCode = 404;
        throw error;
    }
    return progress;
};

// Update profile info: ho_ten, email, dia_chi_mac_dinh
const updateProfile = async (id, payload) => {
    const { ho_ten, email, dia_chi_mac_dinh } = payload;
    if (!ho_ten && !email && !dia_chi_mac_dinh) {
        const error = new Error('Vui lòng cung cấp ít nhất một thông tin cần cập nhật (ho_ten, email, dia_chi_mac_dinh).');
        error.statusCode = 400;
        throw error;
    }
    const updated = await authModel.updateUserProfile(id, { ho_ten, email, dia_chi_mac_dinh });
    return updated;
};

// Change password: requires current password verification
const changePassword = async (id, mat_khau_cu, mat_khau_moi) => {
    if (!mat_khau_cu || !mat_khau_moi) {
        const error = new Error('Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.');
        error.statusCode = 400;
        throw error;
    }
    if (mat_khau_moi.length < 6) {
        const error = new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
        error.statusCode = 400;
        throw error;
    }

    // Verify old password
    const user = await authModel.findFullUserById(id);
    const isMatch = await comparePassword(mat_khau_cu, user.mat_khau_hash);
    if (!isMatch) {
        const error = new Error('Mật khẩu hiện tại không đúng.');
        error.statusCode = 401;
        throw error;
    }

    const newHash = await hashPassword(mat_khau_moi);
    await authModel.updateUserPassword(id, newHash);
    return true;
};

export { registerUser, loginUser, getUserProfile, getLoyaltyProgress, updateProfile, changePassword };
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

export { registerUser, loginUser };
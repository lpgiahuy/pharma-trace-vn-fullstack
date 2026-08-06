import * as authService from '../../services/ecom/authService.js';

const register = async (req, res, next) => {
    try {
        let { ho_ten, so_dien_thoai, mat_khau } = req.body;

        // Optimization: sanitize and validate phone number
        if (so_dien_thoai) so_dien_thoai = so_dien_thoai.trim();

        if (!ho_ten || !so_dien_thoai || !mat_khau) {
            res.status(400);
            throw new Error('Please fill in all required fields');
        }

        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(so_dien_thoai)) {
            res.status(400);
            throw new Error('Invalid phone number format (must be 10-11 digits)');
        }

        const data = await authService.registerUser(ho_ten, so_dien_thoai, mat_khau);



        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: data.user,
                token: data.token // Restored for Swagger/Postman compatibility
            }
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        let { so_dien_thoai, mat_khau } = req.body;

        // Optimization: sanitize phone number
        if (so_dien_thoai) so_dien_thoai = so_dien_thoai.trim();

        if (!so_dien_thoai || !mat_khau) {
            res.status(400);
            throw new Error('Please enter phone number and password');
        }

        const data = await authService.loginUser(so_dien_thoai, mat_khau);



        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: data.user,
                token: data.token // Restored for Swagger/Postman compatibility
            }
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await authService.getUserProfile(userId);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};
const getLoyaltyProgress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const progress = await authService.getLoyaltyProgress(userId);
        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const updateMe = async (req, res, next) => {
    try {
        const updated = await authService.updateProfile(req.user.id, req.body);
        res.status(200).json({ success: true, message: 'Cập nhật thông tin thành công.', data: updated });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const changeMyPassword = async (req, res, next) => {
    try {
        const { mat_khau_cu, mat_khau_moi } = req.body;
        await authService.changePassword(req.user.id, mat_khau_cu, mat_khau_moi);
        res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const logout = async (req, res, next) => {
    // Clear the JWT token cookie
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

export { register, login, logout, getMe, getLoyaltyProgress, updateMe, changeMyPassword };
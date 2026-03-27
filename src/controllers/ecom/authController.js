import * as authService from '../../services/ecom/authService.js';

const register = async (req, res, next) => {
    try {
        const { ho_ten, so_dien_thoai, mat_khau } = req.body;

        if (!ho_ten || !so_dien_thoai || !mat_khau) {
            res.status(400);
            throw new Error('Please fill in all required fields');
        }

        const data = await authService.registerUser(ho_ten, so_dien_thoai, mat_khau);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { so_dien_thoai, mat_khau } = req.body;

        if (!so_dien_thoai || !mat_khau) {
            res.status(400);
            throw new Error('Please enter phone number and password');
        }

        const data = await authService.loginUser(so_dien_thoai, mat_khau);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

export { register, login };
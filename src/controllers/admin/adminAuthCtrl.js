import bcrypt from 'bcryptjs';
import * as adminAuthService from '../../services/admin/adminAuthService.js';
import * as adminAuthModel from '../../models/admin/adminAuthModel.js';

// API login for both Admin and Staff (will check role inside service)
const login = async (req, res, next) => {
    try {
        let { email, password } = req.body;

        // Optimization: sanitize and validate email
        if (email) email = email.trim().toLowerCase();

        if (!email || !password) {
            res.status(400);
            throw new Error('Email and password are required!');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400);
            throw new Error('Invalid email format!');
        }

        const data = await adminAuthService.loginAdmin(email, password);

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            data: data
        });
    } catch (error) {
        if (error.statusCode) res.status(error.statusCode);
        next(error);
    }
};

// hidden api to create the first SuperAdmin account (only used once when setting up the system for the first time)
const setupAdmin = async (req, res, next) => {
    try {
        const { ho_ten, email, password, don_vi_id } = req.body;

        // hash password before saving to database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = await adminAuthModel.createFirstAdmin(
            don_vi_id || 1, // Default to Unit 1 (Head Office)
            ho_ten, 
            email, 
            hashedPassword, 
            'SuperAdmin'
        );

        res.status(201).json({
            success: true,
            message: 'First SuperAdmin account created successfully!',
            data: newAdmin
        });
    } catch (error) {
        // error code 23505 is unique violation in PostgreSQL, which means the email already exists
        if (error.code === '23505') {
            res.status(400);
            return next(new Error('This email has already been registered!'));
        }
        next(error);
    }
};

export { login, setupAdmin };


import jwt from 'jsonwebtoken';

const protect = async (req, res, next) => {
    let token;

    // Read token from Authorization header only
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (error) {
            const err = new Error('Invalid or expired token! Please login again.');
            err.statusCode = 401;
            return next(err);
        }
    }

    const err = new Error('Not authorized! Token is missing.');
    err.statusCode = 401;
    return next(err);
};

const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            req.user = null;
        }
    }
    next();
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            const err = new Error('You do not have permission to perform this action.');
            err.statusCode = 403;
            return next(err);
        }
        next();
    };
};

export { protect, optionalProtect, restrictTo };
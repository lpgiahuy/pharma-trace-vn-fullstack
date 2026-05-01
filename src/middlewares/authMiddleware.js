import jwt from 'jsonwebtoken';

const protect = async (req, res, next) => {
    let token;

    // Check for token in cookies (Preferred & more secure)
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } 
    // Check for token in Authorization header (Fallback for mobile/external clients)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            // decode the token to get user information
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            return next();
        } catch (error) {
            const err = new Error('Invalid or expired token! Please login again.');
            err.statusCode = 401;
            return next(err);
        }
    }

    if (!token) {
        const err = new Error('Not authorized! Token is missing.');
        err.statusCode = 401;
        return next(err);
    }
};

const optionalProtect = async (req, res, next) => {
    let token;

    // Check cookies first, then header
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Invalid or expired token => treat as guest
            req.user = null;
        }
    }
    next();
};

export { protect, optionalProtect };
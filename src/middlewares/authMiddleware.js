import jwt from 'jsonwebtoken';

const protect = async (req, res, next) => {
    let token;

    // check if the Authorization header exists and starts with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // split the header to get the token part
            token = req.headers.authorization.split(' ')[1];

            // decode the token to get user information (id, role, etc.)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // attach the decoded user information to the request object for use in later middleware or route handlers
            req.user = decoded; 
            
            next();
        } catch (error) {
            res.status(401);
            next(new Error('Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.'));
        }
    }

    if (!token) {
        res.status(401);
        next(new Error('Không có quyền truy cập! Vui lòng cung cấp Token.'));
    }
};

export { protect };
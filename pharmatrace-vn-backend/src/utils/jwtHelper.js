import jwt from 'jsonwebtoken';

const generateToken = (userId, role = 'customer', extraData = {}) => {
    const type = extraData.type || (role === 'customer' ? 'customer' : 'staff');
    return jwt.sign({ id: userId, role, vai_tro: role, type, ...extraData }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

export { generateToken };
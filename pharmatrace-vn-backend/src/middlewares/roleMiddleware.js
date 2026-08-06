const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // check if user is authenticated and has a role
        if (!req.user) {
            res.status(401);
            return next(new Error('Vui lòng đăng nhập!'));
        }

        // check if user's role is in the allowedRoles array
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403); // 403 Forbidden: already authenticated but does not have permission
            return next(
                new Error(`Quyền truy cập bị từ chối! Role của bạn là '${req.user.role}', tính năng này yêu cầu: ${allowedRoles.join(' hoặc ')}`)
            );
        }

        next();
    };
};

export { authorizeRoles };

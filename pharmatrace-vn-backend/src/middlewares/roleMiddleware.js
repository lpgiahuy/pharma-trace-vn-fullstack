const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // check if user is authenticated and has a role
        if (!req.user) {
            res.status(401);
            return next(new Error('Vui lòng đăng nhập!'));
        }

        const userRole = (req.user.role || req.user.vai_tro || '').toString().trim();
        const allowedLower = allowedRoles.map(r => r.toLowerCase());

        // check if user's role is in the allowedRoles array (case-insensitive)
        if (!userRole || !allowedLower.includes(userRole.toLowerCase())) {
            res.status(403); // 403 Forbidden: already authenticated but does not have permission
            return next(
                new Error(`Quyền truy cập bị từ chối! Vai trò của bạn là '${userRole}', tính năng này yêu cầu: ${allowedRoles.join(' hoặc ')}`)
            );
        }

        next();
    };
};

export { authorizeRoles };

import jwt from 'jsonwebtoken';
export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    }
    catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
export const requireAdmin = (req, res, next) => {
    if (req.userRole !== 'ADMIN')
        return res.status(403).json({ message: 'Forbidden' });
    next();
};
//# sourceMappingURL=auth.middleware.js.map
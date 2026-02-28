"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireAdmin = exports.authenticate = exports.ADMIN_ROLE_PERMISSIONS = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.ADMIN_ROLE_PERMISSIONS = {
    SUPER_ADMIN: ['*'],
    MODERATOR: [
        'users.view',
        'users.delete',
        'users.mass',
        'users.abuse',
        'universities.manage',
        'verification.manage',
        'verification.view',
        'logos.review',
        'broadcast.manage',
        'analytics.view',
        'alerts.manage',
        'tickets.manage',
        'flags.view',
        'audit.view',
    ],
    SUPPORT: [
        'users.view',
        'tickets.manage',
        'alerts.manage',
        'analytics.view',
        'verification.view',
        'flags.view',
        'audit.view',
    ],
};
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true, status: true, adminRole: true },
        });
        if (!user)
            return res.status(401).json({ message: 'Unauthorized' });
        if (user.status === 'SUSPENDED')
            return res.status(403).json({ message: 'Your account has been suspended.' });
        req.userRole = user.role;
        req.userStatus = user.status;
        req.adminRole = user.adminRole ?? undefined;
        next();
    }
    catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.userId },
            select: { role: true, adminRole: true, status: true },
        });
        if (user?.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        if (user.status === 'SUSPENDED')
            return res.status(403).json({ message: 'Your account has been suspended.' });
        const effectiveAdminRole = user.adminRole ?? 'SUPER_ADMIN';
        req.adminRole = effectiveAdminRole;
        req.userStatus = user.status;
        req.permissions = exports.ADMIN_ROLE_PERMISSIONS[effectiveAdminRole] || [];
        next();
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.requireAdmin = requireAdmin;
const requirePermission = (permission) => (req, res, next) => {
    const permissions = req.permissions || [];
    if (permissions.includes('*') || permissions.includes(permission)) {
        return next();
    }
    return res.status(403).json({ message: `Missing permission: ${permission}` });
};
exports.requirePermission = requirePermission;

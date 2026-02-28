import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AdminRole, UserStatus } from '@prisma/client';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userStatus?: UserStatus;
  adminRole?: AdminRole;
  permissions?: string[];
}

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
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

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    req.userId = decoded.userId;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, status: true, adminRole: true },
    });

    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.status === 'SUSPENDED') return res.status(403).json({ message: 'Your account has been suspended.' });

    req.userRole = user.role;
    req.userStatus = user.status;
    req.adminRole = user.adminRole ?? undefined;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, adminRole: true, status: true },
    });

    if (user?.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
    if (user.status === 'SUSPENDED') return res.status(403).json({ message: 'Your account has been suspended.' });

    const effectiveAdminRole: AdminRole = user.adminRole ?? 'SUPER_ADMIN';
    req.adminRole = effectiveAdminRole;
    req.userStatus = user.status;
    req.permissions = ADMIN_ROLE_PERMISSIONS[effectiveAdminRole] || [];

    next();
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const requirePermission = (permission: string) => (req: AuthRequest, res: Response, next: NextFunction) => {
  const permissions = req.permissions || [];
  if (permissions.includes('*') || permissions.includes(permission)) {
    return next();
  }
  return res.status(403).json({ message: `Missing permission: ${permission}` });
};

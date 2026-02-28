import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

// Short-lived cache to reduce database pressure on repeated revoked-token checks.
const BLACKLIST_CACHE = new Map<string, number>();
const CACHE_TTL_MS = 60 * 1000;

const getBearerToken = (authorizationHeader?: string): string => {
  if (!authorizationHeader) return '';
  const [scheme, value] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !value) return '';
  return value.trim();
};

export const checkTokenBlacklist = async (req: Request, res: Response, next: NextFunction) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return next();

  const now = Date.now();
  const cachedUntil = BLACKLIST_CACHE.get(token);
  if (cachedUntil && cachedUntil > now) {
    return res.status(401).json({ message: 'Token has been revoked. Please login again.' });
  }
  if (cachedUntil && cachedUntil <= now) {
    BLACKLIST_CACHE.delete(token);
  }

  try {
    const isBlacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    if (isBlacklisted) {
      BLACKLIST_CACHE.set(token, now + CACHE_TTL_MS);
      return res.status(401).json({ message: 'Token has been revoked. Please login again.' });
    }
  } catch (err) {
    console.error('Blacklist check failed:', err);
  }

  return next();
};

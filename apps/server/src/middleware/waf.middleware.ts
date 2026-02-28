import type { Request, Response, NextFunction } from 'express';
import axios from 'axios';

/**
 * Simple in-memory rate limiter
 * Map: "ip:endpoint" -> { count, resetTime }
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware for auth endpoints
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests per window
 */
export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (record && now < record.resetTime) {
      record.count++;
      if (record.count > maxRequests) {
        return res.status(429).json({
          message: 'Too many attempts. Please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
      }
    } else {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    }

    next();
  };
};

/**
 * Verify reCAPTCHA token
 */
export const verifyRecaptcha = async (req: Request, res: Response, next: NextFunction) => {
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ message: 'Captcha token is required' });
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      }
    );

    const { success, score } = response.data;

    // For v3, score should be > 0.5
    if (!success || (score && score < 0.5)) {
      return res.status(400).json({ message: 'Captcha verification failed' });
    }

    next();
  } catch (err: any) {
    console.error('Captcha verification error:', err.message);
    return res.status(500).json({ message: 'Captcha verification error' });
  }
};

/**
 * Hcaptcha verification
 */
export const verifyHcaptcha = async (req: Request, res: Response, next: NextFunction) => {
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ message: 'Captcha token is required' });
  }

  try {
    const response = await axios.post(`https://hcaptcha.com/siteverify`, null, {
      params: {
        secret: process.env.HCAPTCHA_SECRET,
        response: captchaToken,
      },
    });

    const { success } = response.data;

    if (!success) {
      return res.status(400).json({ message: 'Captcha verification failed' });
    }

    next();
  } catch (err: any) {
    console.error('Hcaptcha verification error:', err.message);
    return res.status(500).json({ message: 'Captcha verification error' });
  }
};

/**
 * WAF - Web Application Firewall simple checks
 * Detects common attack patterns
 */
export const wafProtection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /<[^>]+>/i, // HTML tag injection
    /(\.\.\/|\.\.\\|\.\/|\.\\)/, // Directory traversal
    /\b(script|onload|onerror|eval|javascript:)\b/i, // XSS patterns
    /\b(union\s+select|drop\s+table|insert\s+into|delete\s+from|alter\s+table)\b/i, // SQL injection
  ];

  const collectStringValues = (value: unknown, bag: string[] = []): string[] => {
    if (typeof value === 'string') {
      bag.push(value);
      return bag;
    }

    if (Array.isArray(value)) {
      for (const item of value) collectStringValues(item, bag);
      return bag;
    }

    if (value && typeof value === 'object') {
      for (const item of Object.values(value as Record<string, unknown>)) {
        collectStringValues(item, bag);
      }
    }

    return bag;
  };

  // Check string values in request body without matching JSON syntax characters.
  if (req.body && typeof req.body === 'object') {
    const valuesToCheck = collectStringValues(req.body);
    for (const value of valuesToCheck) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          console.warn(`WAF: Suspicious pattern detected in request from ${req.ip}`);
          return res.status(400).json({ message: 'Invalid request' });
        }
      }
    }
  }

  next();
};

/**
 * Cleanup rate limit store (run periodically)
 */
export const cleanupRateLimiter = () => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupRateLimiter, 10 * 60 * 1000);

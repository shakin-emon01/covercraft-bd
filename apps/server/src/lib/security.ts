import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Generate a random OTP (One-Time Password)
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a random token (for password reset, email verification)
 */
export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token using SHA-256
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a refresh token (JWT-style but different secret)
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '30d',
  });
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string; type: string } | null => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as {
      userId: string;
      type: string;
    };
  } catch {
    return null;
  }
};

/**
 * Generate a signed URL with expiry
 */
export const generateSignedUrl = (filePath: string, expiryInMinutes: number = 30): string => {
  const signature = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + expiryInMinutes * 60 * 1000;
  const payload = `${filePath}|${expiresAt}|${signature}`;
  return Buffer.from(payload).toString('base64');
};

/**
 * Verify a signed URL
 */
export const verifySignedUrl = (signedUrl: string): { filePath: string; expiresAt: number } | null => {
  try {
    const payload = Buffer.from(signedUrl, 'base64').toString('utf-8');
    const [filePath, expiresAt] = payload.split('|');
    const expiryTime = parseInt(expiresAt, 10);

    if (Date.now() > expiryTime) {
      return null; // URL expired
    }

    return { filePath, expiresAt: expiryTime };
  } catch {
    return null;
  }
};

/**
 * Extract device name from User-Agent
 */
export const extractDeviceName = (userAgent: string): string => {
  if (!userAgent) return 'Unknown Device';

  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Linux')) return 'Linux';

  return 'Unknown Device';
};

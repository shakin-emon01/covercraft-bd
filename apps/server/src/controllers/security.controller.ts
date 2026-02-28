import type { Request, Response } from 'express';
import { AUTH_SERVICE } from '../lib/auth.service';
import type { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import path from 'path';
import fs from 'fs';

/**
 * Email Verification Controller
 */
export const sendEmailVerificationCode = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await AUTH_SERVICE.sendEmailVerification(user.email, user.name);
    return res.json({ message: 'Verification code sent to your email' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Verify Email
 */
export const verifyEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) return res.status(400).json({ message: 'Verification code is required' });
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const success = await AUTH_SERVICE.verifyEmail(req.userId, code);
    if (!success) return res.status(400).json({ message: 'Invalid or expired verification code' });

    return res.json({ message: 'Email verified successfully' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Request Password Reset
 */
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
      await AUTH_SERVICE.initiatePasswordReset(email);
      return res.json({ message: 'Password reset link sent to your email' });
    } catch {
      // Don't reveal if email exists
      return res.json({ message: 'If an account with that email exists, a reset link has been sent' });
    }
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Reset Password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const success = await AUTH_SERVICE.resetPassword(email, resetToken, newPassword);
    if (!success) return res.status(400).json({ message: 'Invalid or expired reset token' });

    return res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Refresh Access Token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) return res.status(400).json({ message: 'Refresh token is required' });

    const result = await AUTH_SERVICE.refreshAccessToken(token);
    if (!result) return res.status(401).json({ message: 'Invalid or expired refresh token' });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Logout (Blacklist Access Token + Revoke Refresh Token)
 */
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const refreshToken = String(req.body?.refreshToken || '').trim();
    const authHeader = String(req.headers.authorization || '');
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (accessToken) {
      await AUTH_SERVICE.blacklistToken(accessToken);
    }

    if (refreshToken) {
      await AUTH_SERVICE.revokeRefreshToken(refreshToken);
    } else {
      // Fallback for current frontend which may not yet send refreshToken.
      await AUTH_SERVICE.revokeAllUserTokens(req.userId);
    }

    return res.json({ message: 'Logged out successfully and safely.' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Get All Active Sessions
 */
export const getActiveSessions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const sessions = await AUTH_SERVICE.getActiveSessions(req.userId);
    return res.json(sessions);
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Revoke Specific Session
 */
export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    // Verify the session belongs to the user
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await AUTH_SERVICE.revokeSession(sessionId);
    return res.json({ message: 'Session revoked successfully' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Revoke All Other Sessions
 */
export const revokeAllOtherSessions = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!req.userId || !sessionId) return res.status(400).json({ message: 'Missing required fields' });

    await AUTH_SERVICE.revokeAllOtherSessions(req.userId, sessionId);
    return res.json({ message: 'All other sessions have been revoked' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Generate Signed Download URL
 */
export const generateSignedDownloadUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { filePath, fileType } = req.body;

    if (!filePath || !fileType) {
      return res.status(400).json({ message: 'File path and type are required' });
    }

    const signedUrl = await AUTH_SERVICE.generateSignedDownloadUrl(filePath, fileType, 30);
    return res.json({ signedUrl });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Validate and Download with Signed URL
 */
export const downloadWithSignedUrl = async (req: Request, res: Response) => {
  try {
    const rawSignature = req.query.signature ?? req.params.signature;
    const signature = typeof rawSignature === 'string' ? rawSignature.trim() : '';

    if (!signature) {
      return res.status(400).json({ message: 'Invalid download link' });
    }

    const fileData = await AUTH_SERVICE.validateSignedUrl(signature);
    if (!fileData) {
      return res.status(403).json({ message: 'This download link has expired or is invalid.' });
    }

    const absolutePath = path.resolve(fileData.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'File no longer exists on the server.' });
    }

    const extension = fileData.fileType.startsWith('.') ? fileData.fileType : `.${fileData.fileType}`;
    const downloadName = `CoverCraft_${Date.now()}${extension}`;

    return res.download(absolutePath, downloadName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to process download' });
    }
  }
};

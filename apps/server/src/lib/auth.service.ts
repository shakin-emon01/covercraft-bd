import prisma from './prisma';
import { sendOTPEmail, sendPasswordResetEmail, sendEmailVerificationCode } from './email';
import {
  generateOTP,
  generateRandomToken,
  hashToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateSignedUrl,
  extractDeviceName,
} from './security';
import jwt from 'jsonwebtoken';

export const AUTH_SERVICE = {
  // ==================== EMAIL VERIFICATION ====================
  
  /**
   * Send email verification code to user
   */
  async sendEmailVerification(email: string, name: string): Promise<void> {
    const code = generateOTP();
    
    await prisma.user.update({
      where: { email },
      data: {
        emailVerificationCode: hashToken(code),
      },
    });

    await sendEmailVerificationCode(email, name, code);
  },

  /**
   * Verify email with code
   */
  async verifyEmail(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.emailVerificationCode) return false;

    const codeHash = hashToken(code);
    if (codeHash !== user.emailVerificationCode) return false;

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
      },
    });

    return true;
  },

  // ==================== PASSWORD RESET ====================

  /**
   * Initiate password reset
   */
  async initiatePasswordReset(email: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const resetToken = generateRandomToken();
    const resetTokenHash = hashToken(resetToken);
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash,
        resetTokenExpiry,
      },
    });

    await sendPasswordResetEmail(email, user.name, resetToken);
    return resetToken; // Return for testing purposes only
  },

  /**
   * Reset password with token
   */
  async resetPassword(email: string, resetToken: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return false;

    if (!user.resetTokenHash || !user.resetTokenExpiry) return false;
    if (new Date() > user.resetTokenExpiry) return false;

    const resetTokenHash = hashToken(resetToken);
    if (resetTokenHash !== user.resetTokenHash) return false;

    // Hash the new password
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
    });

    // Revoke all tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    return true;
  },

  // ==================== REFRESH TOKEN ====================

  /**
   * Create a new refresh token
   */
  async createRefreshToken(userId: string): Promise<string> {
    const refreshToken = generateRefreshToken(userId);
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) throw new Error('Failed to generate refresh token');

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return refreshToken;
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) return null;

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revoked || new Date() > storedToken.expiresAt) {
      return null;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return null;

    // Rotate refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const newRefreshToken = await this.createRefreshToken(user.id);
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    const token = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!token) return false;

    await prisma.refreshToken.update({
      where: { id: token.id },
      data: { revoked: true },
    });

    return true;
  },

  /**
   * Revoke all tokens for a user (logout all sessions)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  },

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Create or update a session
   */
  async upsertSession(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    const deviceName = extractDeviceName(userAgent);
    
    const session = await prisma.session.create({
      data: {
        userId,
        deviceName,
        ipAddress,
        userAgent,
      },
    });

    return session.id;
  },

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: string) {
    return await prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        ipAddress: true,
        createdAt: true,
        lastActivity: true,
      },
      orderBy: { lastActivity: 'desc' },
    });
  },

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return false;

    await prisma.session.delete({ where: { id: sessionId } });
    return true;
  },

  /**
   * Revoke all sessions except current
   */
  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });
  },

  // ==================== SIGNED URLS ====================

  /**
   * Generate a signed URL for file download
   */
  async generateSignedDownloadUrl(filePath: string, fileType: string, expiryMinutes: number = 30): Promise<string> {
    const signature = generateSignedUrl(filePath, expiryMinutes);

    await prisma.signedUrl.create({
      data: {
        signature,
        fileType,
        filePath,
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      },
    });

    return signature;
  },

  /**
   * Validate a signed URL
   */
  async validateSignedUrl(signature: string): Promise<{ filePath: string; fileType: string } | null> {
    const signedUrl = await prisma.signedUrl.findUnique({ where: { signature } });
    
    if (!signedUrl || new Date() > signedUrl.expiresAt) {
      return null;
    }

    return {
      filePath: signedUrl.filePath,
      fileType: signedUrl.fileType,
    };
  },

  /**
   * Cleanup expired signed URLs
   */
  async cleanupExpiredUrls(): Promise<void> {
    await prisma.signedUrl.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },

  /**
   * Blacklist a token (for logout)
   */
  async blacklistToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded || !decoded.exp) return;
    try {
      await prisma.tokenBlacklist.create({
        data: {
          token,
          expiresAt: new Date(decoded.exp * 1000),
        },
      });
    } catch (error: any) {
      // Ignore duplicate inserts when token was already blacklisted.
      if (error?.code !== 'P2002') {
        throw error;
      }
    }
  },
};

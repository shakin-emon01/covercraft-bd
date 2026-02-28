"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_SERVICE = void 0;
const prisma_1 = __importDefault(require("./prisma"));
const email_1 = require("./email");
const security_1 = require("./security");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.AUTH_SERVICE = {
    // ==================== EMAIL VERIFICATION ====================
    /**
     * Send email verification code to user
     */
    async sendEmailVerification(email, name) {
        const code = (0, security_1.generateOTP)();
        await prisma_1.default.user.update({
            where: { email },
            data: {
                emailVerificationCode: (0, security_1.hashToken)(code),
            },
        });
        await (0, email_1.sendEmailVerificationCode)(email, name, code);
    },
    /**
     * Verify email with code
     */
    async verifyEmail(userId, code) {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !user.emailVerificationCode)
            return false;
        const codeHash = (0, security_1.hashToken)(code);
        if (codeHash !== user.emailVerificationCode)
            return false;
        await prisma_1.default.user.update({
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
    async initiatePasswordReset(email) {
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw new Error('User not found');
        const resetToken = (0, security_1.generateRandomToken)();
        const resetTokenHash = (0, security_1.hashToken)(resetToken);
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                resetTokenHash,
                resetTokenExpiry,
            },
        });
        await (0, email_1.sendPasswordResetEmail)(email, user.name, resetToken);
        return resetToken; // Return for testing purposes only
    },
    /**
     * Reset password with token
     */
    async resetPassword(email, resetToken, newPassword) {
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user)
            return false;
        if (!user.resetTokenHash || !user.resetTokenExpiry)
            return false;
        if (new Date() > user.resetTokenExpiry)
            return false;
        const resetTokenHash = (0, security_1.hashToken)(resetToken);
        if (resetTokenHash !== user.resetTokenHash)
            return false;
        // Hash the new password
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetTokenHash: null,
                resetTokenExpiry: null,
            },
        });
        // Revoke all tokens for security
        await prisma_1.default.refreshToken.updateMany({
            where: { userId: user.id },
            data: { revoked: true },
        });
        return true;
    },
    // ==================== REFRESH TOKEN ====================
    /**
     * Create a new refresh token
     */
    async createRefreshToken(userId) {
        const refreshToken = (0, security_1.generateRefreshToken)(userId);
        const decoded = (0, security_1.verifyRefreshToken)(refreshToken);
        if (!decoded)
            throw new Error('Failed to generate refresh token');
        await prisma_1.default.refreshToken.create({
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
    async refreshAccessToken(refreshToken) {
        const decoded = (0, security_1.verifyRefreshToken)(refreshToken);
        if (!decoded)
            return null;
        const storedToken = await prisma_1.default.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!storedToken || storedToken.revoked || new Date() > storedToken.expiresAt) {
            return null;
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: decoded.userId } });
        if (!user)
            return null;
        // Rotate refresh token
        await prisma_1.default.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true },
        });
        const newRefreshToken = await this.createRefreshToken(user.id);
        const newAccessToken = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    },
    /**
     * Revoke a refresh token
     */
    async revokeRefreshToken(refreshToken) {
        const token = await prisma_1.default.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!token)
            return false;
        await prisma_1.default.refreshToken.update({
            where: { id: token.id },
            data: { revoked: true },
        });
        return true;
    },
    /**
     * Revoke all tokens for a user (logout all sessions)
     */
    async revokeAllUserTokens(userId) {
        await prisma_1.default.refreshToken.updateMany({
            where: { userId },
            data: { revoked: true },
        });
    },
    // ==================== SESSION MANAGEMENT ====================
    /**
     * Create or update a session
     */
    async upsertSession(userId, ipAddress, userAgent) {
        const deviceName = (0, security_1.extractDeviceName)(userAgent);
        const session = await prisma_1.default.session.create({
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
    async getActiveSessions(userId) {
        return await prisma_1.default.session.findMany({
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
    async updateSessionActivity(sessionId) {
        await prisma_1.default.session.update({
            where: { id: sessionId },
            data: { lastActivity: new Date() },
        });
    },
    /**
     * Revoke a specific session
     */
    async revokeSession(sessionId) {
        const session = await prisma_1.default.session.findUnique({ where: { id: sessionId } });
        if (!session)
            return false;
        await prisma_1.default.session.delete({ where: { id: sessionId } });
        return true;
    },
    /**
     * Revoke all sessions except current
     */
    async revokeAllOtherSessions(userId, currentSessionId) {
        await prisma_1.default.session.deleteMany({
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
    async generateSignedDownloadUrl(filePath, fileType, expiryMinutes = 30) {
        const signature = (0, security_1.generateSignedUrl)(filePath, expiryMinutes);
        await prisma_1.default.signedUrl.create({
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
    async validateSignedUrl(signature) {
        const signedUrl = await prisma_1.default.signedUrl.findUnique({ where: { signature } });
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
    async cleanupExpiredUrls() {
        await prisma_1.default.signedUrl.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
    },
    /**
     * Blacklist a token (for logout)
     */
    async blacklistToken(token) {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp)
            return;
        try {
            await prisma_1.default.tokenBlacklist.create({
                data: {
                    token,
                    expiresAt: new Date(decoded.exp * 1000),
                },
            });
        }
        catch (error) {
            // Ignore duplicate inserts when token was already blacklisted.
            if (error?.code !== 'P2002') {
                throw error;
            }
        }
    },
};

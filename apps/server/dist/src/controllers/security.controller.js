"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadWithSignedUrl = exports.generateSignedDownloadUrl = exports.revokeAllOtherSessions = exports.revokeSession = exports.getActiveSessions = exports.logout = exports.refreshToken = exports.resetPassword = exports.requestPasswordReset = exports.verifyEmail = exports.sendEmailVerificationCode = void 0;
const auth_service_1 = require("../lib/auth.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Email Verification Controller
 */
const sendEmailVerificationCode = async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id: req.userId } });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        await auth_service_1.AUTH_SERVICE.sendEmailVerification(user.email, user.name);
        return res.json({ message: 'Verification code sent to your email' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.sendEmailVerificationCode = sendEmailVerificationCode;
/**
 * Verify Email
 */
const verifyEmail = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code)
            return res.status(400).json({ message: 'Verification code is required' });
        if (!req.userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const success = await auth_service_1.AUTH_SERVICE.verifyEmail(req.userId, code);
        if (!success)
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        return res.json({ message: 'Email verified successfully' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.verifyEmail = verifyEmail;
/**
 * Request Password Reset
 */
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: 'Email is required' });
        try {
            await auth_service_1.AUTH_SERVICE.initiatePasswordReset(email);
            return res.json({ message: 'Password reset link sent to your email' });
        }
        catch {
            // Don't reveal if email exists
            return res.json({ message: 'If an account with that email exists, a reset link has been sent' });
        }
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.requestPasswordReset = requestPasswordReset;
/**
 * Reset Password
 */
const resetPassword = async (req, res) => {
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
        const success = await auth_service_1.AUTH_SERVICE.resetPassword(email, resetToken, newPassword);
        if (!success)
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        return res.json({ message: 'Password reset successfully. Please login with your new password.' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.resetPassword = resetPassword;
/**
 * Refresh Access Token
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;
        if (!token)
            return res.status(400).json({ message: 'Refresh token is required' });
        const result = await auth_service_1.AUTH_SERVICE.refreshAccessToken(token);
        if (!result)
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.refreshToken = refreshToken;
/**
 * Logout (Blacklist Access Token + Revoke Refresh Token)
 */
const logout = async (req, res) => {
    try {
        if (!req.userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const refreshToken = String(req.body?.refreshToken || '').trim();
        const authHeader = String(req.headers.authorization || '');
        const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
        if (accessToken) {
            await auth_service_1.AUTH_SERVICE.blacklistToken(accessToken);
        }
        if (refreshToken) {
            await auth_service_1.AUTH_SERVICE.revokeRefreshToken(refreshToken);
        }
        else {
            // Fallback for current frontend which may not yet send refreshToken.
            await auth_service_1.AUTH_SERVICE.revokeAllUserTokens(req.userId);
        }
        return res.json({ message: 'Logged out successfully and safely.' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.logout = logout;
/**
 * Get All Active Sessions
 */
const getActiveSessions = async (req, res) => {
    try {
        if (!req.userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const sessions = await auth_service_1.AUTH_SERVICE.getActiveSessions(req.userId);
        return res.json(sessions);
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.getActiveSessions = getActiveSessions;
/**
 * Revoke Specific Session
 */
const revokeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!req.userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Verify the session belongs to the user
        const session = await prisma_1.default.session.findUnique({ where: { id: sessionId } });
        if (!session || session.userId !== req.userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        await auth_service_1.AUTH_SERVICE.revokeSession(sessionId);
        return res.json({ message: 'Session revoked successfully' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.revokeSession = revokeSession;
/**
 * Revoke All Other Sessions
 */
const revokeAllOtherSessions = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!req.userId || !sessionId)
            return res.status(400).json({ message: 'Missing required fields' });
        await auth_service_1.AUTH_SERVICE.revokeAllOtherSessions(req.userId, sessionId);
        return res.json({ message: 'All other sessions have been revoked' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.revokeAllOtherSessions = revokeAllOtherSessions;
/**
 * Generate Signed Download URL
 */
const generateSignedDownloadUrl = async (req, res) => {
    try {
        const { filePath, fileType } = req.body;
        if (!filePath || !fileType) {
            return res.status(400).json({ message: 'File path and type are required' });
        }
        const signedUrl = await auth_service_1.AUTH_SERVICE.generateSignedDownloadUrl(filePath, fileType, 30);
        return res.json({ signedUrl });
    }
    catch (err) {
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
exports.generateSignedDownloadUrl = generateSignedDownloadUrl;
/**
 * Validate and Download with Signed URL
 */
const downloadWithSignedUrl = async (req, res) => {
    try {
        const rawSignature = req.query.signature ?? req.params.signature;
        const signature = typeof rawSignature === 'string' ? rawSignature.trim() : '';
        if (!signature) {
            return res.status(400).json({ message: 'Invalid download link' });
        }
        const fileData = await auth_service_1.AUTH_SERVICE.validateSignedUrl(signature);
        if (!fileData) {
            return res.status(403).json({ message: 'This download link has expired or is invalid.' });
        }
        const absolutePath = path_1.default.resolve(fileData.filePath);
        if (!fs_1.default.existsSync(absolutePath)) {
            return res.status(404).json({ message: 'File no longer exists on the server.' });
        }
        const extension = fileData.fileType.startsWith('.') ? fileData.fileType : `.${fileData.fileType}`;
        const downloadName = `CoverCraft_${Date.now()}${extension}`;
        return res.download(absolutePath, downloadName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
        });
    }
    catch (error) {
        console.error('Signed URL error:', error);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Failed to process download' });
        }
    }
};
exports.downloadWithSignedUrl = downloadWithSignedUrl;

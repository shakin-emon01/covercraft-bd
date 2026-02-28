"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadUniversityLogo = exports.upload = exports.updateSupportTicket = exports.createSupportTicket = exports.getSupportTicketStats = exports.getSupportTickets = exports.deleteFeatureFlag = exports.upsertFeatureFlag = exports.getPublicFeatureFlags = exports.getFeatureFlags = exports.resolveOperationalAlert = exports.createOperationalAlert = exports.getOperationalAlerts = exports.getActiveBroadcast = exports.updateBroadcast = exports.getTemplatePerformanceAnalytics = exports.getTemplateAnalytics = exports.massUserAction = exports.deleteUser = exports.reviewLogoRequest = exports.getPendingLogoRequests = exports.reviewUniversityVerification = exports.getUniversityVerifications = exports.createUniversityVerificationRequest = exports.syncUniversitiesByAdmin = exports.deleteUniversity = exports.updateUniversity = exports.addUniversity = exports.getAllUniversitiesAdmin = exports.markAbuseSignalReviewed = exports.createAbuseSignal = exports.getAbuseRiskUsers = exports.updateUserRoleAndStatus = exports.getRoleMatrix = exports.getAuditLogs = exports.getAdminCovers = exports.getAdminUsers = exports.getAdminStats = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const DEFAULT_TAKE = 200;
const toCleanString = (value) => String(value ?? '').trim();
const logAudit = async (adminId, action, entityType, entityId, details) => {
    if (!adminId)
        return;
    try {
        await prisma_1.default.auditLog.create({
            data: {
                adminId,
                action,
                entityType,
                entityId,
                details: details,
            },
        });
    }
    catch (error) {
        console.error('Audit log write failed:', error);
    }
};
const deriveRiskLevel = (score) => {
    if (score >= 70)
        return 'HIGH';
    if (score >= 40)
        return 'MEDIUM';
    return 'LOW';
};
// ==================== DASHBOARD ====================
const getAdminStats = async (_req, res) => {
    try {
        const [users, profiles, universities, covers, pendingLogos, openTickets, openAlerts, enabledFlags, pendingVerifications,] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.profile.count(),
            prisma_1.default.university.count(),
            prisma_1.default.cover.count(),
            prisma_1.default.university.count({ where: { pendingLogoUrl: { not: null } } }),
            prisma_1.default.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            prisma_1.default.operationalAlert.count({ where: { isResolved: false } }),
            prisma_1.default.featureFlag.count({ where: { enabled: true } }),
            prisma_1.default.universityVerification.count({ where: { status: 'PENDING' } }),
        ]);
        const recentCovers = await prisma_1.default.cover.findMany({
            take: 7,
            orderBy: { createdAt: 'desc' },
            select: { id: true, createdAt: true, templateId: true, userId: true },
        });
        return res.json({
            users,
            profiles,
            universities,
            covers,
            totalUsers: users,
            totalCovers: covers,
            totalUnis: universities,
            pendingLogos,
            openTickets,
            openAlerts,
            enabledFlags,
            pendingVerifications,
            profileCompletionRate: users > 0 ? Math.round((profiles / users) * 100) : 0,
            recentCovers,
        });
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getAdminStats = getAdminStats;
const getAdminUsers = async (_req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: DEFAULT_TAKE,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                adminRole: true,
                status: true,
                createdAt: true,
                profile: {
                    select: {
                        studentId: true,
                        department: true,
                        semester: true,
                        university: {
                            select: {
                                id: true,
                                name: true,
                                shortName: true,
                                type: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        covers: true,
                        abuseSignals: true,
                    },
                },
            },
        });
        return res.json(users);
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getAdminUsers = getAdminUsers;
const getAdminCovers = async (_req, res) => {
    try {
        const covers = await prisma_1.default.cover.findMany({
            orderBy: { createdAt: 'desc' },
            take: DEFAULT_TAKE,
            select: {
                id: true,
                templateId: true,
                pngUrl: true,
                pdfUrl: true,
                createdAt: true,
                user: {
                    select: { id: true, name: true, email: true, role: true, adminRole: true, status: true },
                },
            },
        });
        return res.json(covers);
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getAdminCovers = getAdminCovers;
// ==================== AUDIT TRAIL ====================
const getAuditLogs = async (req, res) => {
    try {
        const take = Math.min(Math.max(Number(req.query.take || 50), 1), 200);
        const logs = await prisma_1.default.auditLog.findMany({
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                admin: {
                    select: { id: true, name: true, email: true, adminRole: true },
                },
            },
        });
        return res.json(logs);
    }
    catch {
        return res.status(500).json({ message: 'Error fetching audit logs.' });
    }
};
exports.getAuditLogs = getAuditLogs;
// ==================== ROLE PERMISSION MATRIX ====================
const getRoleMatrix = async (_req, res) => {
    return res.json(auth_middleware_1.ADMIN_ROLE_PERMISSIONS);
};
exports.getRoleMatrix = getRoleMatrix;
const updateUserRoleAndStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, adminRole, status } = req.body;
        if (id === req.userId && status === 'SUSPENDED') {
            return res.status(400).json({ message: 'You cannot suspend yourself.' });
        }
        if (id === req.userId && role === 'USER') {
            return res.status(400).json({ message: 'You cannot remove your own admin role.' });
        }
        const data = {};
        if (role && ['USER', 'ADMIN'].includes(role))
            data.role = role;
        if (status && ['ACTIVE', 'SUSPENDED'].includes(status))
            data.status = status;
        if (adminRole && ['SUPER_ADMIN', 'MODERATOR', 'SUPPORT'].includes(adminRole))
            data.adminRole = adminRole;
        if (role === 'USER')
            data.adminRole = null;
        if (role === 'ADMIN' && !data.adminRole)
            data.adminRole = 'MODERATOR';
        const user = await prisma_1.default.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                adminRole: true,
                status: true,
            },
        });
        await logAudit(req.userId, 'USER_ROLE_STATUS_UPDATED', 'USER', id, data);
        return res.json(user);
    }
    catch (error) {
        if (error?.code === 'P2025') {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.status(500).json({ message: 'Failed to update role/status.' });
    }
};
exports.updateUserRoleAndStatus = updateUserRoleAndStatus;
// ==================== ABUSE & SPAM RISK ====================
const getAbuseRiskUsers = async (_req, res) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [users, weeklyCoverAgg, signalAgg] = await Promise.all([
            prisma_1.default.user.findMany({
                where: { role: 'USER' },
                take: DEFAULT_TAKE,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                    createdAt: true,
                    _count: { select: { covers: true, abuseSignals: true } },
                },
            }),
            prisma_1.default.cover.groupBy({
                by: ['userId'],
                where: { createdAt: { gte: sevenDaysAgo } },
                _count: { _all: true },
            }),
            prisma_1.default.abuseSignal.groupBy({
                by: ['userId'],
                where: { reviewed: false },
                _sum: { score: true },
            }),
        ]);
        const weeklyMap = new Map(weeklyCoverAgg.map((row) => [row.userId, row._count._all || 0]));
        const signalMap = new Map(signalAgg.map((row) => [row.userId, row._sum.score || 0]));
        const ranked = users
            .map((user) => {
            const weeklyCovers = weeklyMap.get(user.id) || 0;
            const baseScore = Math.min(weeklyCovers * 8, 60) + Math.min(user._count.covers * 2, 25);
            const score = baseScore + (signalMap.get(user.id) || 0) + (user.status === 'SUSPENDED' ? 15 : 0);
            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                status: user.status,
                createdAt: user.createdAt,
                totalCovers: user._count.covers,
                weeklyCovers,
                unresolvedSignals: user._count.abuseSignals,
                score,
                riskLevel: deriveRiskLevel(score),
            };
        })
            .sort((a, b) => b.score - a.score);
        return res.json(ranked);
    }
    catch {
        return res.status(500).json({ message: 'Error fetching abuse risk data.' });
    }
};
exports.getAbuseRiskUsers = getAbuseRiskUsers;
const createAbuseSignal = async (req, res) => {
    try {
        const { userId, type, score, reason } = req.body;
        if (!userId || !type || !reason) {
            return res.status(400).json({ message: 'userId, type and reason are required.' });
        }
        const signal = await prisma_1.default.abuseSignal.create({
            data: {
                userId,
                type: toCleanString(type),
                score: Number(score || 10),
                reason: toCleanString(reason),
            },
        });
        await logAudit(req.userId, 'ABUSE_SIGNAL_CREATED', 'ABUSE_SIGNAL', signal.id, { userId, type, score, reason });
        return res.json(signal);
    }
    catch {
        return res.status(500).json({ message: 'Failed to create abuse signal.' });
    }
};
exports.createAbuseSignal = createAbuseSignal;
const markAbuseSignalReviewed = async (req, res) => {
    try {
        const { id } = req.params;
        const signal = await prisma_1.default.abuseSignal.update({
            where: { id },
            data: { reviewed: true, reviewedAt: new Date(), reviewedById: req.userId },
        });
        await logAudit(req.userId, 'ABUSE_SIGNAL_REVIEWED', 'ABUSE_SIGNAL', signal.id);
        return res.json(signal);
    }
    catch (error) {
        if (error?.code === 'P2025')
            return res.status(404).json({ message: 'Signal not found.' });
        return res.status(500).json({ message: 'Failed to update abuse signal.' });
    }
};
exports.markAbuseSignalReviewed = markAbuseSignalReviewed;
// ==================== UNIVERSITY MANAGEMENT ====================
const getAllUniversitiesAdmin = async (_req, res) => {
    try {
        const universities = await prisma_1.default.university.findMany({ orderBy: { name: 'asc' } });
        return res.json(universities);
    }
    catch {
        return res.status(500).json({ message: 'Error fetching universities.' });
    }
};
exports.getAllUniversitiesAdmin = getAllUniversitiesAdmin;
const addUniversity = async (req, res) => {
    try {
        const { name, shortName, logoUrl, type } = req.body;
        if (!name || !shortName || !type) {
            return res.status(400).json({ message: 'name, shortName and type are required.' });
        }
        if (!['PUBLIC', 'PRIVATE'].includes(type)) {
            return res.status(400).json({ message: 'type must be PUBLIC or PRIVATE.' });
        }
        const university = await prisma_1.default.university.create({
            data: {
                name: name.trim(),
                shortName: shortName.trim(),
                logoUrl: (logoUrl ?? '').trim(),
                type,
            },
        });
        await logAudit(req.userId, 'UNIVERSITY_CREATED', 'UNIVERSITY', university.id, { name, shortName, type });
        return res.json(university);
    }
    catch {
        return res.status(500).json({ message: 'Error adding university. Name or Short Name might already exist.' });
    }
};
exports.addUniversity = addUniversity;
const updateUniversity = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, shortName, logoUrl, type } = req.body;
        if (!name || !shortName || !type) {
            return res.status(400).json({ message: 'name, shortName and type are required.' });
        }
        if (!['PUBLIC', 'PRIVATE'].includes(type)) {
            return res.status(400).json({ message: 'type must be PUBLIC or PRIVATE.' });
        }
        const university = await prisma_1.default.university.update({
            where: { id },
            data: {
                name: name.trim(),
                shortName: shortName.trim(),
                logoUrl: (logoUrl ?? '').trim(),
                type,
            },
        });
        await logAudit(req.userId, 'UNIVERSITY_UPDATED', 'UNIVERSITY', university.id, { name, shortName, type });
        return res.json(university);
    }
    catch (error) {
        if (error?.code === 'P2025') {
            return res.status(404).json({ message: 'University not found.' });
        }
        return res.status(500).json({ message: 'Error updating university.' });
    }
};
exports.updateUniversity = updateUniversity;
const deleteUniversity = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.university.delete({ where: { id } });
        await logAudit(req.userId, 'UNIVERSITY_DELETED', 'UNIVERSITY', id);
        return res.json({ message: 'University deleted successfully.' });
    }
    catch (error) {
        if (error?.code === 'P2003') {
            return res.status(400).json({ message: 'Cannot delete university. It is currently being used by active users.' });
        }
        if (error?.code === 'P2025') {
            return res.status(404).json({ message: 'University not found.' });
        }
        return res.status(400).json({ message: 'Cannot delete university. It is currently being used by active users.' });
    }
};
exports.deleteUniversity = deleteUniversity;
const syncUniversitiesByAdmin = async (req, res) => {
    try {
        const payload = Array.isArray(req.body?.universities) ? req.body.universities : [];
        if (!payload.length) {
            return res.status(400).json({ message: 'universities array is required' });
        }
        let updated = 0;
        let created = 0;
        for (const item of payload) {
            const name = toCleanString(item?.name);
            const shortName = toCleanString(item?.shortName);
            const logoUrl = toCleanString(item?.logoUrl);
            const type = item?.type === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
            if (!name || !shortName || !logoUrl)
                continue;
            const existing = await prisma_1.default.university.findUnique({ where: { shortName } });
            if (existing) {
                await prisma_1.default.university.update({
                    where: { id: existing.id },
                    data: { name, logoUrl, type },
                });
                updated += 1;
            }
            else {
                await prisma_1.default.university.create({
                    data: { name, shortName, logoUrl, type },
                });
                created += 1;
            }
        }
        await logAudit(req.userId, 'UNIVERSITY_SYNC', 'UNIVERSITY', undefined, { created, updated, totalInput: payload.length });
        return res.json({ message: 'University sync completed', created, updated, totalInput: payload.length });
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.syncUniversitiesByAdmin = syncUniversitiesByAdmin;
// ==================== UNIVERSITY VERIFICATION WORKFLOW ====================
const createUniversityVerificationRequest = async (req, res) => {
    try {
        const { universityId, requestType, note, metadata, proposedLogoUrl } = req.body;
        if (!universityId)
            return res.status(400).json({ message: 'universityId is required.' });
        const university = await prisma_1.default.university.findUnique({ where: { id: universityId } });
        if (!university)
            return res.status(404).json({ message: 'University not found.' });
        const verification = await prisma_1.default.universityVerification.create({
            data: {
                universityId,
                requesterId: req.userId,
                requestType: requestType || 'METADATA',
                note: toCleanString(note) || null,
                metadata: metadata || null,
                currentLogoUrl: university.logoUrl || null,
                proposedLogoUrl: toCleanString(proposedLogoUrl) || null,
            },
            include: {
                university: { select: { id: true, name: true, shortName: true } },
            },
        });
        await logAudit(req.userId, 'UNIVERSITY_VERIFICATION_CREATED', 'UNIVERSITY_VERIFICATION', verification.id, { universityId, requestType });
        return res.json(verification);
    }
    catch {
        return res.status(500).json({ message: 'Failed to create verification request.' });
    }
};
exports.createUniversityVerificationRequest = createUniversityVerificationRequest;
const getUniversityVerifications = async (_req, res) => {
    try {
        const requests = await prisma_1.default.universityVerification.findMany({
            take: DEFAULT_TAKE,
            orderBy: { createdAt: 'desc' },
            include: {
                university: { select: { id: true, name: true, shortName: true, logoUrl: true, pendingLogoUrl: true } },
                requester: { select: { id: true, name: true, email: true } },
                reviewedBy: { select: { id: true, name: true, email: true, adminRole: true } },
            },
        });
        return res.json(requests);
    }
    catch {
        return res.status(500).json({ message: 'Failed to fetch verification requests.' });
    }
};
exports.getUniversityVerifications = getUniversityVerifications;
const reviewUniversityVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, note } = req.body;
        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return res.status(400).json({ message: 'action must be APPROVE or REJECT.' });
        }
        const verification = await prisma_1.default.universityVerification.findUnique({ where: { id } });
        if (!verification)
            return res.status(404).json({ message: 'Verification request not found.' });
        if (verification.status !== 'PENDING')
            return res.status(400).json({ message: 'This request is already reviewed.' });
        if (action === 'APPROVE' && verification.requestType === 'LOGO' && verification.proposedLogoUrl) {
            await prisma_1.default.university.update({
                where: { id: verification.universityId },
                data: {
                    logoUrl: verification.proposedLogoUrl,
                    pendingLogoUrl: null,
                },
            });
        }
        const updated = await prisma_1.default.universityVerification.update({
            where: { id },
            data: {
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                reviewedById: req.userId,
                reviewedAt: new Date(),
                note: toCleanString(note) || verification.note,
            },
        });
        await logAudit(req.userId, `UNIVERSITY_VERIFICATION_${action}`, 'UNIVERSITY_VERIFICATION', id, { note });
        return res.json(updated);
    }
    catch {
        return res.status(500).json({ message: 'Failed to review verification request.' });
    }
};
exports.reviewUniversityVerification = reviewUniversityVerification;
// ==================== LOGO REVIEW (COMPAT) ====================
const getPendingLogoRequests = async (_req, res) => {
    try {
        const requests = await prisma_1.default.university.findMany({
            where: { pendingLogoUrl: { not: null } },
            select: { id: true, name: true, shortName: true, logoUrl: true, pendingLogoUrl: true },
            orderBy: { name: 'asc' },
        });
        return res.json(requests);
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getPendingLogoRequests = getPendingLogoRequests;
const reviewLogoRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }
        const university = await prisma_1.default.university.findUnique({ where: { id } });
        if (!university || !university.pendingLogoUrl) {
            return res.status(404).json({ message: 'No pending logo found' });
        }
        if (action === 'APPROVE') {
            await prisma_1.default.university.update({
                where: { id },
                data: { logoUrl: university.pendingLogoUrl, pendingLogoUrl: null },
            });
        }
        else {
            await prisma_1.default.university.update({
                where: { id },
                data: { pendingLogoUrl: null },
            });
        }
        const latestPendingVerification = await prisma_1.default.universityVerification.findFirst({
            where: { universityId: id, requestType: 'LOGO', status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
        });
        if (latestPendingVerification) {
            await prisma_1.default.universityVerification.update({
                where: { id: latestPendingVerification.id },
                data: {
                    status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                    reviewedById: req.userId,
                    reviewedAt: new Date(),
                },
            });
        }
        await logAudit(req.userId, `LOGO_REQUEST_${action}`, 'UNIVERSITY', id);
        return res.json({ message: `Logo ${action}D successfully` });
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.reviewLogoRequest = reviewLogoRequest;
// ==================== USER MANAGEMENT ====================
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.userId) {
            return res.status(400).json({ message: 'You cannot delete your own admin account!' });
        }
        await prisma_1.default.$transaction([
            prisma_1.default.cover.deleteMany({ where: { userId: id } }),
            prisma_1.default.profile.deleteMany({ where: { userId: id } }),
            prisma_1.default.abuseSignal.deleteMany({ where: { userId: id } }),
            prisma_1.default.supportTicket.updateMany({ where: { userId: id }, data: { userId: null } }),
            prisma_1.default.user.delete({ where: { id } }),
        ]);
        await logAudit(req.userId, 'USER_DELETED', 'USER', id);
        return res.json({ message: 'User deleted successfully.' });
    }
    catch (error) {
        if (error?.code === 'P2025') {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.status(500).json({ message: 'Error deleting user.' });
    }
};
exports.deleteUser = deleteUser;
const massUserAction = async (req, res) => {
    try {
        const { userIds, action } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'userIds array is required.' });
        }
        const sanitizedUserIds = [...new Set(userIds)].filter(Boolean).filter((id) => id !== req.userId);
        if (!sanitizedUserIds.length) {
            return res.status(400).json({ message: 'No valid target users found.' });
        }
        let result = {};
        if (action === 'SUSPEND') {
            const updated = await prisma_1.default.user.updateMany({
                where: { id: { in: sanitizedUserIds }, role: 'USER' },
                data: { status: 'SUSPENDED' },
            });
            result = { updated: updated.count };
        }
        else if (action === 'RESTORE') {
            const updated = await prisma_1.default.user.updateMany({
                where: { id: { in: sanitizedUserIds }, role: 'USER' },
                data: { status: 'ACTIVE' },
            });
            result = { updated: updated.count };
        }
        else if (action === 'DELETE') {
            const students = await prisma_1.default.user.findMany({
                where: { id: { in: sanitizedUserIds }, role: 'USER' },
                select: { id: true },
            });
            const targetIds = students.map((u) => u.id);
            await prisma_1.default.$transaction([
                prisma_1.default.cover.deleteMany({ where: { userId: { in: targetIds } } }),
                prisma_1.default.profile.deleteMany({ where: { userId: { in: targetIds } } }),
                prisma_1.default.abuseSignal.deleteMany({ where: { userId: { in: targetIds } } }),
                prisma_1.default.supportTicket.updateMany({ where: { userId: { in: targetIds } }, data: { userId: null } }),
                prisma_1.default.user.deleteMany({ where: { id: { in: targetIds } } }),
            ]);
            result = { deleted: targetIds.length };
        }
        else {
            return res.status(400).json({ message: 'Invalid action. Use SUSPEND, RESTORE, or DELETE.' });
        }
        await logAudit(req.userId, `MASS_USER_${action}`, 'USER', undefined, { userIds: sanitizedUserIds, result });
        return res.json({ message: `Mass action ${action} completed.`, ...result });
    }
    catch {
        return res.status(500).json({ message: 'Failed to perform mass action.' });
    }
};
exports.massUserAction = massUserAction;
// ==================== TEMPLATE ANALYTICS ====================
const getTemplateAnalytics = async (_req, res) => {
    try {
        const usage = await prisma_1.default.cover.groupBy({
            by: ['templateId'],
            _count: { templateId: true },
            orderBy: { _count: { templateId: 'desc' } },
        });
        return res.json(usage);
    }
    catch {
        return res.status(500).json({ message: 'Error fetching analytics' });
    }
};
exports.getTemplateAnalytics = getTemplateAnalytics;
const getTemplatePerformanceAnalytics = async (_req, res) => {
    try {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const covers = await prisma_1.default.cover.findMany({
            where: { createdAt: { gte: ninetyDaysAgo } },
            select: {
                templateId: true,
                createdAt: true,
                userId: true,
                user: {
                    select: {
                        profile: {
                            select: {
                                semester: true,
                                university: { select: { shortName: true } },
                            },
                        },
                    },
                },
            },
        });
        const byTemplate = new Map();
        const total = covers.length;
        for (const cover of covers) {
            const key = cover.templateId;
            if (!byTemplate.has(key)) {
                byTemplate.set(key, {
                    templateId: key,
                    totalUses: 0,
                    uniqueUsers: new Set(),
                    universities: new Map(),
                    semesters: new Map(),
                    lastUsedAt: cover.createdAt,
                });
            }
            const entry = byTemplate.get(key);
            const uni = cover.user?.profile?.university?.shortName || 'Unknown';
            const semester = cover.user?.profile?.semester || 'Unknown';
            entry.totalUses += 1;
            entry.uniqueUsers.add(cover.userId);
            entry.universities.set(uni, (entry.universities.get(uni) || 0) + 1);
            entry.semesters.set(semester, (entry.semesters.get(semester) || 0) + 1);
            if (cover.createdAt > entry.lastUsedAt)
                entry.lastUsedAt = cover.createdAt;
        }
        const leaderboard = [...byTemplate.values()]
            .map((entry) => {
            const universities = [...entry.universities.entries()].sort((a, b) => b[1] - a[1]);
            const semesters = [...entry.semesters.entries()].sort((a, b) => b[1] - a[1]);
            return {
                templateId: entry.templateId,
                totalUses: entry.totalUses,
                uniqueUsers: entry.uniqueUsers.size,
                marketShare: total > 0 ? Number(((entry.totalUses / total) * 100).toFixed(2)) : 0,
                topUniversity: universities[0]?.[0] || 'Unknown',
                topSemester: semesters[0]?.[0] || 'Unknown',
                universityBreakdown: universities.map(([name, count]) => ({ name, count })),
                semesterBreakdown: semesters.map(([name, count]) => ({ name, count })),
                lastUsedAt: entry.lastUsedAt,
            };
        })
            .sort((a, b) => b.totalUses - a.totalUses);
        return res.json({ windowDays: 90, totalCovers: total, leaderboard });
    }
    catch {
        return res.status(500).json({ message: 'Error fetching template performance analytics.' });
    }
};
exports.getTemplatePerformanceAnalytics = getTemplatePerformanceAnalytics;
// ==================== SYSTEM BROADCAST ====================
const updateBroadcast = async (req, res) => {
    try {
        const { message, isActive, type } = req.body;
        const broadcast = await prisma_1.default.broadcast.upsert({
            where: { id: 'global' },
            update: {
                message: message ?? '',
                isActive: Boolean(isActive),
                type: type || 'info',
            },
            create: {
                id: 'global',
                message: message ?? '',
                isActive: Boolean(isActive),
                type: type || 'info',
            },
        });
        await logAudit(req.userId, 'BROADCAST_UPDATED', 'BROADCAST', 'global', { message, isActive, type });
        return res.json(broadcast);
    }
    catch {
        return res.status(500).json({ message: 'Error updating broadcast' });
    }
};
exports.updateBroadcast = updateBroadcast;
const getActiveBroadcast = async (_req, res) => {
    try {
        const broadcast = await prisma_1.default.broadcast.findUnique({ where: { id: 'global' } });
        return res.json(broadcast || { isActive: false });
    }
    catch {
        return res.status(500).json({ message: 'Error fetching broadcast' });
    }
};
exports.getActiveBroadcast = getActiveBroadcast;
// ==================== OPERATIONAL ALERTS ====================
const getOperationalAlerts = async (_req, res) => {
    try {
        const alerts = await prisma_1.default.operationalAlert.findMany({
            take: DEFAULT_TAKE,
            orderBy: { createdAt: 'desc' },
            include: {
                resolvedBy: { select: { id: true, name: true, email: true, adminRole: true } },
            },
        });
        return res.json(alerts);
    }
    catch {
        return res.status(500).json({ message: 'Failed to fetch operational alerts.' });
    }
};
exports.getOperationalAlerts = getOperationalAlerts;
const createOperationalAlert = async (req, res) => {
    try {
        const { severity, source, message, metadata } = req.body;
        if (!source || !message) {
            return res.status(400).json({ message: 'source and message are required.' });
        }
        const alert = await prisma_1.default.operationalAlert.create({
            data: {
                severity: severity || 'INFO',
                source: toCleanString(source),
                message: toCleanString(message),
                metadata: metadata || null,
            },
        });
        await logAudit(req.userId, 'ALERT_CREATED', 'OPERATIONAL_ALERT', alert.id, { severity, source, message });
        return res.json(alert);
    }
    catch {
        return res.status(500).json({ message: 'Failed to create alert.' });
    }
};
exports.createOperationalAlert = createOperationalAlert;
const resolveOperationalAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await prisma_1.default.operationalAlert.update({
            where: { id },
            data: {
                isResolved: true,
                resolvedAt: new Date(),
                resolvedById: req.userId,
            },
        });
        await logAudit(req.userId, 'ALERT_RESOLVED', 'OPERATIONAL_ALERT', id);
        return res.json(alert);
    }
    catch (error) {
        if (error?.code === 'P2025')
            return res.status(404).json({ message: 'Alert not found.' });
        return res.status(500).json({ message: 'Failed to resolve alert.' });
    }
};
exports.resolveOperationalAlert = resolveOperationalAlert;
// ==================== FEATURE FLAGS ====================
const getFeatureFlags = async (_req, res) => {
    try {
        const flags = await prisma_1.default.featureFlag.findMany({ orderBy: { key: 'asc' } });
        return res.json(flags);
    }
    catch {
        return res.status(500).json({ message: 'Failed to fetch feature flags.' });
    }
};
exports.getFeatureFlags = getFeatureFlags;
const getPublicFeatureFlags = async (_req, res) => {
    try {
        const flags = await prisma_1.default.featureFlag.findMany({
            where: { enabled: true },
            orderBy: { key: 'asc' },
            select: {
                key: true,
                enabled: true,
                rollout: true,
                targets: true,
                updatedAt: true,
            },
        });
        return res.json(flags);
    }
    catch {
        return res.status(500).json({ message: 'Failed to fetch public feature flags.' });
    }
};
exports.getPublicFeatureFlags = getPublicFeatureFlags;
const upsertFeatureFlag = async (req, res) => {
    try {
        const { key, name, description, enabled, rollout, targets } = req.body;
        if (!key || !name) {
            return res.status(400).json({ message: 'key and name are required.' });
        }
        const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
        const safeRollout = Math.max(0, Math.min(100, Number(rollout ?? 100)));
        const flag = await prisma_1.default.featureFlag.upsert({
            where: { key: normalizedKey },
            update: {
                name: toCleanString(name),
                description: toCleanString(description) || null,
                enabled: Boolean(enabled),
                rollout: safeRollout,
                targets: targets || null,
            },
            create: {
                key: normalizedKey,
                name: toCleanString(name),
                description: toCleanString(description) || null,
                enabled: Boolean(enabled),
                rollout: safeRollout,
                targets: targets || null,
            },
        });
        await logAudit(req.userId, 'FEATURE_FLAG_UPSERTED', 'FEATURE_FLAG', normalizedKey, { enabled, rollout: safeRollout });
        return res.json(flag);
    }
    catch {
        return res.status(500).json({ message: 'Failed to upsert feature flag.' });
    }
};
exports.upsertFeatureFlag = upsertFeatureFlag;
const deleteFeatureFlag = async (req, res) => {
    try {
        const { key } = req.params;
        await prisma_1.default.featureFlag.delete({ where: { key } });
        await logAudit(req.userId, 'FEATURE_FLAG_DELETED', 'FEATURE_FLAG', key);
        return res.json({ message: 'Feature flag deleted.' });
    }
    catch (error) {
        if (error?.code === 'P2025')
            return res.status(404).json({ message: 'Feature flag not found.' });
        return res.status(500).json({ message: 'Failed to delete feature flag.' });
    }
};
exports.deleteFeatureFlag = deleteFeatureFlag;
// ==================== SUPPORT DESK ====================
const getSupportTickets = async (_req, res) => {
    try {
        const tickets = await prisma_1.default.supportTicket.findMany({
            take: DEFAULT_TAKE,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true, adminRole: true } },
            },
        });
        return res.json(tickets);
    }
    catch {
        return res.status(500).json({ message: 'Failed to fetch support tickets.' });
    }
};
exports.getSupportTickets = getSupportTickets;
const getSupportTicketStats = async (_req, res) => {
    try {
        const [open, inProgress, resolved, urgent] = await Promise.all([
            prisma_1.default.supportTicket.count({ where: { status: 'OPEN' } }),
            prisma_1.default.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
            prisma_1.default.supportTicket.count({ where: { status: 'RESOLVED' } }),
            prisma_1.default.supportTicket.count({ where: { priority: 'URGENT', status: { not: 'CLOSED' } } }),
        ]);
        return res.json({ open, inProgress, resolved, urgent });
    }
    catch {
        return res.status(500).json({ message: 'Failed to fetch ticket stats.' });
    }
};
exports.getSupportTicketStats = getSupportTicketStats;
const createSupportTicket = async (req, res) => {
    try {
        const { email, subject, message, category, priority } = req.body;
        if (!subject || !message)
            return res.status(400).json({ message: 'subject and message are required.' });
        let effectiveEmail = toCleanString(email);
        if (req.userId) {
            const requester = await prisma_1.default.user.findUnique({ where: { id: req.userId }, select: { email: true } });
            if (requester?.email)
                effectiveEmail = requester.email;
        }
        if (!effectiveEmail)
            return res.status(400).json({ message: 'email is required.' });
        const ticket = await prisma_1.default.supportTicket.create({
            data: {
                userId: req.userId || null,
                email: effectiveEmail,
                subject: toCleanString(subject),
                message: toCleanString(message),
                category: toCleanString(category) || null,
                priority: priority || 'NORMAL',
            },
        });
        if (req.userId) {
            await logAudit(req.userId, 'SUPPORT_TICKET_CREATED', 'SUPPORT_TICKET', ticket.id, { subject, priority });
        }
        return res.status(201).json(ticket);
    }
    catch {
        return res.status(500).json({ message: 'Failed to create support ticket.' });
    }
};
exports.createSupportTicket = createSupportTicket;
const updateSupportTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, assignedToId } = req.body;
        const data = {};
        if (status && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
            data.status = status;
            if (status === 'RESOLVED' || status === 'CLOSED')
                data.resolvedAt = new Date();
        }
        if (priority && ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority))
            data.priority = priority;
        if (assignedToId !== undefined)
            data.assignedToId = assignedToId || null;
        const ticket = await prisma_1.default.supportTicket.update({
            where: { id },
            data,
            include: {
                user: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true, adminRole: true } },
            },
        });
        await logAudit(req.userId, 'SUPPORT_TICKET_UPDATED', 'SUPPORT_TICKET', id, data);
        return res.json(ticket);
    }
    catch (error) {
        if (error?.code === 'P2025')
            return res.status(404).json({ message: 'Ticket not found.' });
        return res.status(500).json({ message: 'Failed to update support ticket.' });
    }
};
exports.updateSupportTicket = updateSupportTicket;
// ==================== UNIVERSITY LOGO UPLOAD ====================
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads/logos');
        if (!fs_1.default.existsSync(uploadDir))
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `logo-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg')
            cb(null, true);
        else
            cb(new Error('Only PNG and JPG files are allowed!'));
    },
});
const uploadUniversityLogo = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file)
            return res.status(400).json({ message: 'No image file provided' });
        const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
        const logoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;
        const university = await prisma_1.default.university.update({
            where: { id },
            data: { logoUrl },
        });
        await logAudit(req.userId, 'UNIVERSITY_LOGO_UPLOADED', 'UNIVERSITY', id, { logoUrl });
        return res.json({ message: 'Logo uploaded successfully', university });
    }
    catch (error) {
        console.error('Upload Error:', error);
        return res.status(500).json({ message: 'Server error during upload' });
    }
};
exports.uploadUniversityLogo = uploadUniversityLogo;

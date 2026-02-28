"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertProfile = exports.getProfile = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const logo_service_1 = require("../services/logo.service");
const getProfile = async (req, res) => {
    try {
        const profile = await prisma_1.default.profile.findUnique({
            where: { userId: req.userId },
            include: {
                university: true,
                // Never expose sensitive auth fields like passwordHash/reset tokens.
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        emailVerified: true,
                        adminRole: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });
        if (!profile)
            return res.status(404).json({ message: 'Profile not found' });
        return res.json(profile);
    }
    catch {
        return res.status(500).json({ message: 'Error fetching profile' });
    }
};
exports.getProfile = getProfile;
const upsertProfile = async (req, res) => {
    try {
        const studentName = String(req.body?.studentName ?? '').trim();
        const studentId = String(req.body?.studentId ?? '').trim();
        const department = String(req.body?.department ?? '').trim();
        const semester = String(req.body?.semester ?? '').trim();
        const universityId = String(req.body?.universityId ?? '').trim();
        if (!studentName || !studentId || !department || !universityId) {
            return res.status(400).json({ message: 'Name, Student ID, Department and University are required' });
        }
        const university = await prisma_1.default.university.findUnique({ where: { id: universityId } });
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }
        // Try to sync logo but don't fail if external API is down
        let syncedLogoUrl = null;
        try {
            syncedLogoUrl = await (0, logo_service_1.syncUniversityLogo)(university.id, university.name, university.logoUrl);
        }
        catch (error) {
            console.warn('[Logo Sync Skipped - External API unavailable]');
        }
        await prisma_1.default.user.update({
            where: { id: req.userId },
            data: { name: studentName },
        });
        const profile = await prisma_1.default.profile.upsert({
            where: { userId: req.userId },
            update: { studentId, department, semester, universityId },
            create: { userId: req.userId, studentId, department, semester, universityId },
            include: {
                university: true,
                // Keep response consistent with getProfile and avoid leaking secrets.
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        emailVerified: true,
                        adminRole: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });
        if (syncedLogoUrl && profile.university) {
            profile.university.logoUrl = syncedLogoUrl;
        }
        return res.json(profile);
    }
    catch (error) {
        console.error('[Profile Upsert Failed]:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.upsertProfile = upsertProfile;

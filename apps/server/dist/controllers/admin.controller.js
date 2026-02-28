"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadUniversityLogo = exports.upload = exports.syncUniversitiesByAdmin = exports.updateUniversityByAdmin = exports.getAdminCovers = exports.getAdminUsers = exports.getAdminStats = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAdminStats = async (_req, res) => {
    try {
        const [users, profiles, universities, covers] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.profile.count(),
            prisma_1.default.university.count(),
            prisma_1.default.cover.count(),
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
            take: 200,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
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
            take: 200,
            select: {
                id: true,
                templateId: true,
                pngUrl: true,
                pdfUrl: true,
                createdAt: true,
                user: {
                    select: { id: true, name: true, email: true, role: true },
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
const updateUniversityByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, shortName, logoUrl, type } = req.body;
        if (!name || !shortName || !logoUrl || !type) {
            return res.status(400).json({ message: 'name, shortName, logoUrl and type are required' });
        }
        if (!['PUBLIC', 'PRIVATE'].includes(type)) {
            return res.status(400).json({ message: 'type must be PUBLIC or PRIVATE' });
        }
        const university = await prisma_1.default.university.update({
            where: { id },
            data: { name: name.trim(), shortName: shortName.trim(), logoUrl: logoUrl.trim(), type },
        });
        return res.json(university);
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUniversityByAdmin = updateUniversityByAdmin;
const syncUniversitiesByAdmin = async (req, res) => {
    try {
        const payload = Array.isArray(req.body?.universities) ? req.body.universities : [];
        if (!payload.length) {
            return res.status(400).json({ message: 'universities array is required' });
        }
        let updated = 0;
        let created = 0;
        for (const item of payload) {
            const name = String(item?.name ?? '').trim();
            const shortName = String(item?.shortName ?? '').trim();
            const logoUrl = String(item?.logoUrl ?? '').trim();
            const type = item?.type === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
            if (!name || !shortName || !logoUrl) {
                continue;
            }
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
        return res.json({ message: 'University sync completed', created, updated, totalInput: payload.length });
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.syncUniversitiesByAdmin = syncUniversitiesByAdmin;
// --- Multer Storage Configuration ---
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads/logos');
        // Automatically create target folder if it does not exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        // Attach a timestamp so filenames remain unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `logo-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PNG and JPG files are allowed!'));
        }
    },
});
// --- Upload Controller ---
const uploadUniversityLogo = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        // Create a public URL for the uploaded file
        const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
        const logoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;
        const university = await prisma_1.default.university.update({
            where: { id },
            data: { logoUrl },
        });
        return res.json({ message: 'Logo uploaded successfully', university });
    }
    catch (error) {
        console.error('Upload Error:', error);
        return res.status(500).json({ message: 'Server error during upload' });
    }
};
exports.uploadUniversityLogo = uploadUniversityLogo;

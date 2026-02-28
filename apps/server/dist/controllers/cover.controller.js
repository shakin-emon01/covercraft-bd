"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCover = exports.getCoverDownloadInfo = exports.generateCover = exports.createCover = exports.getUserCovers = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const template_catalog_1 = require("../constants/template-catalog");
const pdf_service_1 = require("../services/pdf.service");
const zod_1 = require("zod");
const coverSchema = zod_1.z.object({
    templateId: zod_1.z
        .string()
        .min(1, 'Template ID is required')
        .refine((val) => template_catalog_1.ALLOWED_TEMPLATE_IDS.has(val), 'Invalid template selected'),
    paletteId: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || template_catalog_1.ALLOWED_PALETTE_IDS.has(val), 'Invalid color palette selected'),
    coverData: zod_1.z
        .record(zod_1.z.string(), zod_1.z.any())
        .refine((data) => Object.keys(data).length > 0, 'Cover data cannot be empty'),
});
const validateCoverPayload = (payload) => {
    const result = coverSchema.safeParse(payload);
    if (!result.success) {
        return result.error.issues[0]?.message ?? 'Invalid request payload';
    }
    return null;
};
const createCoverRecord = async (req) => {
    const templateId = String(req.body.templateId).trim();
    const paletteId = String(req.body.paletteId ?? '').trim();
    const cover = await prisma_1.default.cover.create({
        data: {
            userId: req.userId,
            templateId,
            coverData: {
                ...req.body.coverData,
                paletteId: paletteId || null,
            },
        },
    });
    const base = process.env.API_PUBLIC_URL ?? '';
    const pngUrl = `${base}/api/covers/${cover.id}/download?format=png`;
    const pdfUrl = `${base}/api/covers/${cover.id}/download?format=pdf`;
    return prisma_1.default.cover.update({
        where: { id: cover.id },
        data: { pngUrl, pdfUrl },
    });
};
const getUserCovers = async (req, res) => {
    try {
        const covers = await prisma_1.default.cover.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return res.json(covers);
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserCovers = getUserCovers;
const createCover = async (req, res) => {
    try {
        const validationError = validateCoverPayload(req.body);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        const cover = await createCoverRecord(req);
        return res.status(201).json(cover);
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.createCover = createCover;
const generateCover = async (req, res) => {
    try {
        const validationError = validateCoverPayload(req.body);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        const cover = await createCoverRecord(req);
        return res.status(201).json({
            message: 'Cover data saved. Use client export flow for final PNG/PDF generation.',
            cover,
            export: {
                pngUrl: cover.pngUrl,
                pdfUrl: cover.pdfUrl,
            },
        });
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.generateCover = generateCover;
const getCoverDownloadInfo = async (req, res) => {
    try {
        const format = String(req.query.format ?? '').toLowerCase();
        // format empty থাকলেও JSON রিটার্ন করবে যেন PrintView.jsx ডেটা পায়
        if (format && format !== 'png' && format !== 'pdf') {
            return res.status(400).json({ message: 'format must be png or pdf' });
        }
        // FIX: select-এর ভেতরে coverData এবং templateId যোগ করা হয়েছে
        const cover = await prisma_1.default.cover.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                userId: true,
                templateId: true, // Added
                coverData: true // Added
            },
        });
        if (!cover)
            return res.status(404).json({ message: 'Cover not found' });
        const isOwner = cover.userId === req.userId;
        const isAdmin = req.userRole === 'ADMIN';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        // Server-side PDF Generation Logic
        if (format === 'pdf') {
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            // Extract current user's bearer token and pass it to print view URL
            const authHeader = req.headers.authorization || '';
            const token = authHeader.split(' ')[1] || '';
            const targetUrl = `${clientUrl}/print/${cover.id}?token=${token}`;
            try {
                const pdfBuffer = await (0, pdf_service_1.generatePdfBuffer)(targetUrl);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=cover-${cover.id}.pdf`);
                return res.send(pdfBuffer);
            }
            catch (error) {
                console.error('Puppeteer generation error:', error);
                return res.status(500).json({ message: 'Failed to generate PDF on server' });
            }
        }
        // PrintView.jsx-এর জন্য JSON ডেটা রিটার্ন করবে
        return res.json({
            message: 'Cover data fetched successfully.',
            format,
            cover
        });
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getCoverDownloadInfo = getCoverDownloadInfo;
const deleteCover = async (req, res) => {
    try {
        const cover = await prisma_1.default.cover.findUnique({
            where: { id: req.params.id },
            select: { id: true, userId: true },
        });
        if (!cover)
            return res.status(404).json({ message: 'Cover not found' });
        const isOwner = cover.userId === req.userId;
        const isAdmin = req.userRole === 'ADMIN';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        await prisma_1.default.cover.delete({ where: { id: cover.id } });
        return res.json({ message: 'Deleted' });
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteCover = deleteCover;

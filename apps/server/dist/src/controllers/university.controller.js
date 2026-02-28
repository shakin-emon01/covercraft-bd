"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitLogoRequest = exports.getUniversityById = exports.getAllUniversities = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAllUniversities = async (req, res) => {
    try {
        const universities = await prisma_1.default.university.findMany({
            orderBy: [{ type: 'asc' }, { name: 'asc' }],
        });
        return res.json(universities);
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllUniversities = getAllUniversities;
const getUniversityById = async (req, res) => {
    try {
        const university = await prisma_1.default.university.findUnique({
            where: { id: req.params.id },
        });
        if (!university)
            return res.status(404).json({ message: 'University not found' });
        return res.json(university);
    }
    catch {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getUniversityById = getUniversityById;
const submitLogoRequest = async (req, res) => {
    try {
        const { fileBase64 } = req.body;
        if (!fileBase64) {
            return res.status(400).json({ message: 'No file received by server' });
        }
        // Accept only PNG/JPEG data URLs and ignore any user-provided filename.
        const matches = String(fileBase64).match(/^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)$/);
        if (!matches || matches.length !== 3) {
            return res
                .status(400)
                .json({ message: 'Invalid file format. Only PNG and JPEG images are allowed.' });
        }
        const mimeSubtype = matches[1].toLowerCase();
        const buffer = Buffer.from(matches[2], 'base64');
        if (!buffer.length) {
            return res.status(400).json({ message: 'Invalid file payload' });
        }
        // Maximum size: 5MB
        if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
        }
        const currentUniversity = await prisma_1.default.university.findUnique({
            where: { id: req.params.id },
            select: { id: true, logoUrl: true },
        });
        if (!currentUniversity) {
            return res.status(404).json({ message: 'University not found' });
        }
        const ext = mimeSubtype === 'png' ? '.png' : '.jpg';
        const newFileName = `req-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        // Create folder if not exists
        const uploadDir = path_1.default.join(process.cwd(), 'uploads/requests');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        // Save strictly validated file to disk.
        const filePath = path_1.default.join(uploadDir, newFileName);
        fs_1.default.writeFileSync(filePath, buffer);
        // Update database
        const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
        const pendingLogoUrl = `${baseUrl}/uploads/requests/${newFileName}`;
        await prisma_1.default.university.update({
            where: { id: req.params.id },
            data: { pendingLogoUrl },
        });
        // Premium workflow: create verification queue record for admin review.
        await prisma_1.default.universityVerification.create({
            data: {
                universityId: req.params.id,
                requesterId: req.userId,
                requestType: 'LOGO',
                status: 'PENDING',
                currentLogoUrl: currentUniversity.logoUrl,
                proposedLogoUrl: pendingLogoUrl,
                note: 'Logo submitted by user from profile setup.',
            },
        });
        return res.json({ message: 'Logo submitted successfully and safely!' });
    }
    catch (error) {
        console.error('Secure Upload Error:', error);
        return res.status(500).json({ message: 'Server error during secure upload' });
    }
};
exports.submitLogoRequest = submitLogoRequest;

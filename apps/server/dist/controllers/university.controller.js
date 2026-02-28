"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniversityById = exports.getAllUniversities = void 0;
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

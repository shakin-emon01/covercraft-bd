"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.googleCallback = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const generateToken = (userId, role) => jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
// REGISTER
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'All fields are required' });
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing)
            return res.status(409).json({ message: 'Email already in use' });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.default.user.create({
            data: { name, email, passwordHash },
        });
        const token = generateToken(user.id, user.role);
        return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.register = register;
// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash)
            return res.status(401).json({ message: 'Invalid credentials' });
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid credentials' });
        const token = generateToken(user.id, user.role);
        return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
// GOOGLE OAUTH CALLBACK
const googleCallback = async (req, res) => {
    try {
        const { googleId, email, name, avatar } = req.body;
        let user = await prisma_1.default.user.findFirst({ where: { OR: [{ googleId }, { email }] } });
        if (!user) {
            user = await prisma_1.default.user.create({
                data: { googleId, email, name },
            });
        }
        else if (!user.googleId) {
            user = await prisma_1.default.user.update({ where: { id: user.id }, data: { googleId } });
        }
        const token = generateToken(user.id, user.role);
        return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.googleCallback = googleCallback;
// GET ME
const getMe = async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.userId },
            include: { profile: { include: { university: true } } },
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        return res.json(user);
    }
    catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getMe = getMe;

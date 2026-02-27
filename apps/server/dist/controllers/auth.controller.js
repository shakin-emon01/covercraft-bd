import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
const generateToken = (userId, role) => jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
// REGISTER
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'All fields are required' });
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing)
            return res.status(409).json({ message: 'Email already in use' });
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { name, email, passwordHash },
        });
        const token = generateToken(user.id, user.role);
        return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};
// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash)
            return res.status(401).json({ message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid credentials' });
        const token = generateToken(user.id, user.role);
        return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};
// GOOGLE OAUTH CALLBACK
export const googleCallback = async (req, res) => {
    try {
        const { googleId, email, name, avatar } = req.body;
        let user = await prisma.user.findFirst({ where: { OR: [{ googleId }, { email }] } });
        if (!user) {
            user = await prisma.user.create({
                data: { googleId, email, name },
            });
        }
        else if (!user.googleId) {
            user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
        }
        const token = generateToken(user.id, user.role);
        return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};
// GET ME
export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
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
//# sourceMappingURL=auth.controller.js.map
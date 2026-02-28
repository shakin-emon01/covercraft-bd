import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import prisma from '../lib/prisma';
import { sendWelcomeEmail } from '../lib/email';
import { AUTH_SERVICE } from '../lib/auth.service';

const generateToken = (userId: string, role: string) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

type GoogleTokenInfoPayload = {
  aud?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
  sub?: string;
};

const verifyGoogleCredential = async (credential: string) => {
  const response = await axios.get<GoogleTokenInfoPayload>(
    'https://oauth2.googleapis.com/tokeninfo',
    {
      params: { id_token: credential },
      timeout: 10000,
    }
  );

  const payload = response.data;
  const googleId = payload.sub?.trim();
  const email = payload.email?.trim().toLowerCase();
  const name = payload.name?.trim() || email?.split('@')[0] || 'Google User';
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

  if (!googleId || !email) {
    throw new Error('Invalid Google token payload');
  }

  if (!emailVerified) {
    throw new Error('Google email is not verified');
  }

  const configuredClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  if (configuredClientId && payload.aud !== configuredClientId) {
    throw new Error('Google client ID mismatch');
  }

  return {
    googleId,
    email,
    name,
    avatar: payload.picture,
  };
};

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'USER' },
    });

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Welcome email failed:', error);
    }

    const token = generateToken(user.id, user.role);
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminRole: user.adminRole,
        status: user.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
      return res.status(401).json({ message: 'Invalid credentials' });
    if (user.status === 'SUSPENDED')
      return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
    const userAgent = String(req.headers['user-agent'] || 'Unknown Device');
    try {
      await AUTH_SERVICE.upsertSession(user.id, ipAddress, userAgent);
    } catch (sessionError) {
      console.error('Session creation failed after login:', sessionError);
    }

    const accessToken = generateToken(user.id, user.role);
    const refreshToken = await AUTH_SERVICE.createRefreshToken(user.id);

    return res.json({
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminRole: user.adminRole,
        status: user.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GOOGLE OAUTH CALLBACK
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const credential = String(req.body?.credential || '').trim();

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    let googleProfile: Awaited<ReturnType<typeof verifyGoogleCredential>>;
    try {
      googleProfile = await verifyGoogleCredential(credential);
    } catch (error: any) {
      console.error('Google token verification failed:', error?.response?.data || error?.message || error);
      return res.status(401).json({ message: 'Invalid Google credential' });
    }

    const { googleId, email, name } = googleProfile;

    let user = await prisma.user.findFirst({ where: { OR: [{ googleId }, { email }] } });

    if (!user) {
      user = await prisma.user.create({
        data: { googleId, email, name, emailVerified: true, role: 'USER' },
      });
    } else {
      const updateData: { googleId?: string; emailVerified?: boolean; name?: string } = {};

      if (!user.googleId) updateData.googleId = googleId;
      if (!user.emailVerified) updateData.emailVerified = true;
      if (!user.name && name) updateData.name = name;

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: updateData });
      }
    }

    if (user.status === 'SUSPENDED')
      return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });

    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
    const userAgent = String(req.headers['user-agent'] || 'Unknown Device');
    try {
      await AUTH_SERVICE.upsertSession(user.id, ipAddress, userAgent);
    } catch (sessionError) {
      console.error('Session creation failed after Google login:', sessionError);
    }

    const accessToken = generateToken(user.id, user.role);
    const refreshToken = await AUTH_SERVICE.createRefreshToken(user.id);

    return res.json({
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminRole: user.adminRole,
        status: user.status,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET ME
export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminRole: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: { include: { university: true } },
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

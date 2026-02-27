import type { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getProfile = async (req: any, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId },
      include: { university: true },
    });
    return res.json(profile);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const upsertProfile = async (req: any, res: Response) => {
  try {
    const studentId = String(req.body?.studentId ?? '').trim();
    const department = String(req.body?.department ?? '').trim();
    const semester = String(req.body?.semester ?? '').trim();
    const session = String(req.body?.session ?? '').trim();
    const universityId = String(req.body?.universityId ?? '').trim();

    if (!studentId || !department || !universityId) {
      return res.status(400).json({ message: 'studentId, department and universityId are required' });
    }

    const university = await prisma.university.findUnique({ where: { id: universityId } });
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: req.userId },
      update: { studentId, department, semester, session, universityId },
      create: { userId: req.userId, studentId, department, semester, session, universityId },
      include: { university: true },
    });
    return res.json(profile);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

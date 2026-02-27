import type { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllUniversities = async (req: Request, res: Response) => {
  try {
    const universities = await prisma.university.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return res.json(universities);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUniversityById = async (req: Request, res: Response) => {
  try {
    const university = await prisma.university.findUnique({
      where: { id: req.params.id },
    });
    if (!university) return res.status(404).json({ message: 'University not found' });
    return res.json(university);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

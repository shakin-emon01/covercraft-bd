import type { Response } from 'express';
import type { UniType } from '@prisma/client';
import prisma from '../lib/prisma';

export const getAdminStats = async (_req: any, res: Response) => {
  try {
    const [users, profiles, universities, covers] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.university.count(),
      prisma.cover.count(),
    ]);

    const recentCovers = await prisma.cover.findMany({
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
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminUsers = async (_req: any, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminCovers = async (_req: any, res: Response) => {
  try {
    const covers = await prisma.cover.findMany({
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
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateUniversityByAdmin = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, shortName, logoUrl, type } = req.body as {
      name?: string;
      shortName?: string;
      logoUrl?: string;
      type?: UniType;
    };

    if (!name || !shortName || !logoUrl || !type) {
      return res.status(400).json({ message: 'name, shortName, logoUrl and type are required' });
    }

    if (!['PUBLIC', 'PRIVATE'].includes(type)) {
      return res.status(400).json({ message: 'type must be PUBLIC or PRIVATE' });
    }

    const university = await prisma.university.update({
      where: { id },
      data: { name: name.trim(), shortName: shortName.trim(), logoUrl: logoUrl.trim(), type },
    });

    return res.json(university);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const syncUniversitiesByAdmin = async (req: any, res: Response) => {
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

      const existing = await prisma.university.findUnique({ where: { shortName } });
      if (existing) {
        await prisma.university.update({
          where: { id: existing.id },
          data: { name, logoUrl, type },
        });
        updated += 1;
      } else {
        await prisma.university.create({
          data: { name, shortName, logoUrl, type },
        });
        created += 1;
      }
    }

    return res.json({ message: 'University sync completed', created, updated, totalInput: payload.length });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

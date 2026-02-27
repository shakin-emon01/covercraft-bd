import type { Response } from 'express';
import prisma from '../lib/prisma';
import { ALLOWED_PALETTE_IDS, ALLOWED_TEMPLATE_IDS } from '../constants/template-catalog';

const validateCoverPayload = (payload: any) => {
  const templateId = String(payload?.templateId ?? '').trim();
  const paletteId = String(payload?.paletteId ?? '').trim();
  const coverData = payload?.coverData;

  if (!templateId) return 'templateId is required';
  if (!ALLOWED_TEMPLATE_IDS.has(templateId)) return 'Invalid templateId';
  if (paletteId && !ALLOWED_PALETTE_IDS.has(paletteId)) return 'Invalid paletteId';
  if (!coverData || typeof coverData !== 'object' || Array.isArray(coverData)) return 'coverData must be an object';

  return null;
};

const createCoverRecord = async (req: any) => {
  const templateId = String(req.body.templateId).trim();
  const paletteId = String(req.body.paletteId ?? '').trim();

  const cover = await prisma.cover.create({
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

  return prisma.cover.update({
    where: { id: cover.id },
    data: { pngUrl, pdfUrl },
  });
};

export const getUserCovers = async (req: any, res: Response) => {
  try {
    const covers = await prisma.cover.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json(covers);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createCover = async (req: any, res: Response) => {
  try {
    const validationError = validateCoverPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const cover = await createCoverRecord(req);
    return res.status(201).json(cover);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const generateCover = async (req: any, res: Response) => {
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
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getCoverDownloadInfo = async (req: any, res: Response) => {
  try {
    const format = String(req.query.format ?? '').toLowerCase();
    if (format !== 'png' && format !== 'pdf') {
      return res.status(400).json({ message: 'format must be png or pdf' });
    }

    const cover = await prisma.cover.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        userId: true,
        templateId: true,
        coverData: true,
        pngUrl: true,
        pdfUrl: true,
        createdAt: true,
      },
    });

    if (!cover) return res.status(404).json({ message: 'Cover not found' });

    const isOwner = cover.userId === req.userId;
    const isAdmin = req.userRole === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json({
      message: 'Client-side export endpoint. Render coverData with selected template and download locally.',
      format,
      cover,
    });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCover = async (req: any, res: Response) => {
  try {
    const cover = await prisma.cover.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true },
    });

    if (!cover) return res.status(404).json({ message: 'Cover not found' });

    const isOwner = cover.userId === req.userId;
    const isAdmin = req.userRole === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.cover.delete({ where: { id: cover.id } });
    return res.json({ message: 'Deleted' });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

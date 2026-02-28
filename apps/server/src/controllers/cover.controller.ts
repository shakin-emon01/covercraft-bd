import type { Response } from 'express';
import prisma from '../lib/prisma';
import { ALLOWED_PALETTE_IDS, ALLOWED_TEMPLATE_IDS } from '../constants/template-catalog';
import { generatePdfBuffer } from '../services/pdf.service';
import { z } from 'zod';
import archiver from 'archiver';

const COVER_EXPIRY_DAYS = 30;
const COVER_EXPIRY_MS = COVER_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

const getCoverExpiryCutoff = () => new Date(Date.now() - COVER_EXPIRY_MS);
const getCoverExpiresAt = (createdAt: Date) => new Date(createdAt.getTime() + COVER_EXPIRY_MS);

const purgeExpiredCovers = async (userId?: string) => {
  const whereClause: any = { createdAt: { lt: getCoverExpiryCutoff() } };
  if (userId) whereClause.userId = userId;
  await prisma.cover.deleteMany({ where: whereClause });
};

const coverSchema = z.object({
  templateId: z
    .string()
    .min(1, 'Template ID is required')
    .refine((val) => ALLOWED_TEMPLATE_IDS.has(val), 'Invalid template selected'),
  paletteId: z
    .string()
    .optional()
    .refine((val) => !val || ALLOWED_PALETTE_IDS.has(val), 'Invalid color palette selected'),
  coverData: z
    .record(z.string(), z.any())
    .refine((data) => Object.keys(data).length > 0, 'Cover data cannot be empty'),
});

const validateCoverPayload = (payload: any) => {
  const result = coverSchema.safeParse(payload);
  if (!result.success) {
    return result.error.issues[0]?.message ?? 'Invalid request payload';
  }
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

export const getMyCovers = async (req: any, res: Response) => {
  try {
    await purgeExpiredCovers(req.userId);

    const covers = await prisma.cover.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(
      covers.map((cover) => ({
        ...cover,
        expiresAt: getCoverExpiresAt(cover.createdAt),
      }))
    );
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUserCovers = getMyCovers;

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
    await purgeExpiredCovers();

    const format = String(req.query.format ?? '').toLowerCase();
    
    // format empty থাকলেও JSON রিটার্ন করবে যেন PrintView.jsx ডেটা পায়
    if (format && format !== 'png' && format !== 'pdf') {
      return res.status(400).json({ message: 'format must be png or pdf' });
    }

    // FIX: select-এর ভেতরে coverData এবং templateId যোগ করা হয়েছে
    const cover = await prisma.cover.findUnique({
      where: { id: req.params.id },
      select: { 
        id: true, 
        userId: true,
        createdAt: true,
        templateId: true,  // Added
        coverData: true    // Added
      },
    });

    if (!cover) return res.status(404).json({ message: 'Cover not found' });
    if (cover.createdAt < getCoverExpiryCutoff()) {
      await prisma.cover.delete({ where: { id: cover.id } }).catch(() => {});
      return res.status(404).json({ message: 'Cover expired after 30 days' });
    }

    const isOwner = cover.userId === req.userId;
    const isAdmin = req.userRole === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Server-side PDF Generation Logic
    if (format === 'pdf') {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      const authHeader = req.headers.authorization || '';
      const token = authHeader.split(' ')[1] || '';
      const targetUrl = `${clientUrl}/print/${cover.id}`;
      let timeoutHandle: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('PDF_TIMEOUT')), 30_000);
      });
      
      try {
        const pdfBuffer = (await Promise.race([
          generatePdfBuffer(
            targetUrl,
            token ? { Authorization: `Bearer ${token}` } : undefined
          ),
          timeoutPromise,
        ])) as Buffer;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=cover-${cover.id}.pdf`);
        return res.send(pdfBuffer);
      } catch (error) {
        if ((error as Error)?.message === 'PDF_TIMEOUT') {
          return res
            .status(408)
            .json({ message: 'PDF generation timed out. The server is busy, please try again in a few moments.' });
        }

        console.error('Puppeteer generation error:', error);
        await prisma.operationalAlert.create({
          data: {
            severity: 'CRITICAL',
            source: 'pdf.service',
            message: `PDF generation failed for cover ${cover.id}`,
            metadata: { coverId: cover.id, userId: req.userId, error: String((error as any)?.message || error) },
          },
        });
        return res.status(500).json({ message: 'Failed to generate PDF on server' });
      } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
      }
    }

    // PrintView.jsx-এর জন্য JSON ডেটা রিটার্ন করবে
    return res.json({
      message: 'Cover data fetched successfully.',
      format,
      cover
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

// 🚀 PUBLIC ENDPOINT: Fetch cover data for shared links
export const getSharedCover = async (req: any, res: Response) => {
  try {
    await purgeExpiredCovers();

    const cover = await prisma.cover.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        createdAt: true,
        templateId: true,
        coverData: true,
        user: { select: { name: true } } // কার কভার সেটা দেখানোর জন্য
      }
    });

    if (!cover) return res.status(404).json({ message: 'Cover not found or link expired.' });
    if (cover.createdAt < getCoverExpiryCutoff()) {
      await prisma.cover.delete({ where: { id: cover.id } }).catch(() => {});
      return res.status(404).json({ message: 'Cover expired after 30 days.' });
    }

    return res.json({ ...cover, expiresAt: getCoverExpiresAt(cover.createdAt) });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// 🚀 THE "CR SPECIAL" BATCH GENERATOR ENGINE
export const generateBatchCovers = async (req: any, res: Response) => {
  try {
    const { templateId, paletteId, baseData, students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Valid students array is required' });
    }

    // সার্ভার যেন ক্র্যাশ না করে, তাই একবারে সর্বোচ্চ ৩০টি কভার লিমিট করে দেওয়া হলো
    if (students.length > 30) {
      return res.status(400).json({ message: 'Maximum 30 covers allowed per batch.' });
    }

    // Response Headers for ZIP Download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=Batch_Covers.zip`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1] || '';

    // Loop through each student and generate PDF
    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      // 1. Create a temporary cover record
      const cover = await prisma.cover.create({
        data: {
          userId: req.userId,
          templateId,
          coverData: {
            ...baseData,
            submissionMode: 'individual', // Force individual for batch
            studentName: student.studentName || baseData.studentName,
            studentId: student.studentId || baseData.studentId,
            section: student.section || baseData.section,
            paletteId: paletteId || null,
          },
        },
      });

      // 2. Generate PDF via Puppeteer
      const targetUrl = `${clientUrl}/print/${cover.id}`;
      const pdfBuffer = await generatePdfBuffer(
        targetUrl,
        token ? { Authorization: `Bearer ${token}` } : undefined
      );

      // 3. Clean string and Append to ZIP
      const safeName = (student.studentName || `Student_${i+1}`).replace(/[^a-zA-Z0-9-]/g, '_');
      const safeId = (student.studentId || 'ID').replace(/[^a-zA-Z0-9-]/g, '_');
      archive.append(pdfBuffer, { name: `${safeId}_${safeName}_Cover.pdf` });

      // 4. Delete temp DB record to keep dashboard clean
      await prisma.cover.delete({ where: { id: cover.id } });
    }

    // Complete the ZIP and send to client
    await archive.finalize();

  } catch (error) {
    console.error('Batch Generation Error:', error);
    await prisma.operationalAlert.create({
      data: {
        severity: 'CRITICAL',
        source: 'batch.cover.generate',
        message: 'Batch cover generation failed',
        metadata: { userId: req.userId, error: String((error as any)?.message || error) },
      },
    });
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to generate batch covers' });
    }
  }
};

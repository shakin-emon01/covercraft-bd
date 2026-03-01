import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { buildUploadUrl, ensureUploadsDir } from '../lib/uploads';

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

export const submitLogoRequest = async (req: any, res: Response) => {
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

    const currentUniversity = await prisma.university.findUnique({
      where: { id: req.params.id },
      select: { id: true, logoUrl: true },
    });

    if (!currentUniversity) {
      return res.status(404).json({ message: 'University not found' });
    }

    const ext = mimeSubtype === 'png' ? '.png' : '.jpg';
    const newFileName = `req-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    // Create folder if not exists
    const uploadDir = ensureUploadsDir('requests');

    // Save strictly validated file to disk.
    const filePath = path.join(uploadDir, newFileName);
    fs.writeFileSync(filePath, buffer);

    // Update database
    const pendingLogoUrl = buildUploadUrl('requests', newFileName);

    await prisma.university.update({
      where: { id: req.params.id },
      data: { pendingLogoUrl },
    });

    // Premium workflow: create verification queue record for admin review.
    await prisma.universityVerification.create({
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
  } catch (error) {
    console.error('Secure Upload Error:', error);
    return res.status(500).json({ message: 'Server error during secure upload' });
  }
};

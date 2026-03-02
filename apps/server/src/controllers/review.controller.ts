import type { Response } from 'express';
import prisma from '../lib/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

const REVIEW_COMMENT_MAX_LENGTH = 600;

export const getReviews = async (req: AuthRequest, res: Response) => {
  try {
    const view = String(req.query?.view ?? '').toLowerCase();
    const sort = String(req.query?.sort ?? '').toLowerCase();
    const defaultTake = view === 'carousel' ? 10 : 20;
    const rawTake = Number(req.query?.take ?? defaultTake);
    const take = Number.isFinite(rawTake) ? Math.min(Math.max(Math.trunc(rawTake), 1), 100) : defaultTake;

    const orderBy = sort === 'top' || view === 'carousel'
      ? [{ rating: 'desc' as const }, { createdAt: 'desc' as const }]
      : [{ createdAt: 'desc' as const }];

    const where = view === 'carousel' ? { isCarouselVisible: true } : undefined;

    const reviews = await prisma.review.findMany({
      where,
      orderBy,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load reviews' });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment ?? '').trim();
    const displayName = String(req.body?.displayName ?? '').trim();
    const headline = String(req.body?.headline ?? '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    if (!comment) {
      return res.status(400).json({ message: 'Comment is required.' });
    }

    if (comment.length > REVIEW_COMMENT_MAX_LENGTH) {
      return res.status(400).json({ message: `Comment must be at most ${REVIEW_COMMENT_MAX_LENGTH} characters.` });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.userId,
        rating,
        comment,
        displayName: displayName || null,
        headline: headline || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json(review);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create review' });
  }
};

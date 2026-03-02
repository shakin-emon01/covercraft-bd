"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminReview = exports.createAdminReview = exports.getAdminReviews = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const REVIEW_COMMENT_MAX_LENGTH = 600;
const REVIEW_DISPLAY_NAME_MAX_LENGTH = 80;
const REVIEW_HEADLINE_MAX_LENGTH = 120;
const sanitizeOptionalText = (value, maxLength) => {
    const text = String(value ?? '').trim();
    if (!text)
        return null;
    return text.slice(0, maxLength);
};
const parseRating = (value) => {
    const rating = Number(value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
        return null;
    return rating;
};
const getAdminReviews = async (req, res) => {
    try {
        const rawTake = Number(req.query?.take ?? 50);
        const take = Number.isFinite(rawTake) ? Math.min(Math.max(Math.trunc(rawTake), 1), 200) : 50;
        const reviews = await prisma_1.default.review.findMany({
            orderBy: [{ createdAt: 'desc' }],
            take,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return res.json(reviews);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to load admin reviews.' });
    }
};
exports.getAdminReviews = getAdminReviews;
const createAdminReview = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const rating = parseRating(req.body?.rating);
        const comment = String(req.body?.comment ?? '').trim();
        const displayName = sanitizeOptionalText(req.body?.displayName, REVIEW_DISPLAY_NAME_MAX_LENGTH);
        const headline = sanitizeOptionalText(req.body?.headline, REVIEW_HEADLINE_MAX_LENGTH);
        const isCarouselVisible = req.body?.isCarouselVisible !== undefined ? Boolean(req.body?.isCarouselVisible) : true;
        if (!rating) {
            return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
        }
        if (!comment) {
            return res.status(400).json({ message: 'Comment is required.' });
        }
        if (comment.length > REVIEW_COMMENT_MAX_LENGTH) {
            return res.status(400).json({ message: `Comment must be at most ${REVIEW_COMMENT_MAX_LENGTH} characters.` });
        }
        const created = await prisma_1.default.review.create({
            data: {
                userId: req.userId,
                rating,
                comment,
                displayName,
                headline,
                isCarouselVisible,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return res.status(201).json(created);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to create admin review.' });
    }
};
exports.createAdminReview = createAdminReview;
const updateAdminReview = async (req, res) => {
    try {
        const reviewId = String(req.params?.id ?? '').trim();
        if (!reviewId) {
            return res.status(400).json({ message: 'Review id is required.' });
        }
        const patch = {};
        if (req.body?.rating !== undefined) {
            const rating = parseRating(req.body.rating);
            if (!rating)
                return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
            patch.rating = rating;
        }
        if (req.body?.comment !== undefined) {
            const comment = String(req.body.comment ?? '').trim();
            if (!comment)
                return res.status(400).json({ message: 'Comment cannot be empty.' });
            if (comment.length > REVIEW_COMMENT_MAX_LENGTH) {
                return res.status(400).json({ message: `Comment must be at most ${REVIEW_COMMENT_MAX_LENGTH} characters.` });
            }
            patch.comment = comment;
        }
        if (req.body?.displayName !== undefined) {
            patch.displayName = sanitizeOptionalText(req.body.displayName, REVIEW_DISPLAY_NAME_MAX_LENGTH);
        }
        if (req.body?.headline !== undefined) {
            patch.headline = sanitizeOptionalText(req.body.headline, REVIEW_HEADLINE_MAX_LENGTH);
        }
        if (req.body?.isCarouselVisible !== undefined) {
            patch.isCarouselVisible = Boolean(req.body.isCarouselVisible);
        }
        if (Object.keys(patch).length === 0) {
            return res.status(400).json({ message: 'No valid fields were provided to update.' });
        }
        const updated = await prisma_1.default.review.update({
            where: { id: reviewId },
            data: patch,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return res.json(updated);
    }
    catch (error) {
        if (error?.code === 'P2025') {
            return res.status(404).json({ message: 'Review not found.' });
        }
        return res.status(500).json({ message: 'Failed to update review.' });
    }
};
exports.updateAdminReview = updateAdminReview;

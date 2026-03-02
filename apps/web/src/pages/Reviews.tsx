/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createReview, getReviews } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useThemeMode } from '../hooks/useThemeMode';

const interactionClass = 'transition-all duration-300 hover:scale-105 hover:shadow-lg';

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
  viewport: { once: true, amount: 0.2 },
};

const StarRating = ({ value, onChange, disabled = false }: { value: number; onChange: (value: number) => void; disabled?: boolean }) => (
  <div className="flex flex-wrap items-center gap-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={disabled}
        onClick={() => onChange(star)}
        className={`${interactionClass} h-10 w-10 rounded-full border text-xl ${
          star <= value
            ? 'border-amber-300 bg-amber-100 text-amber-500 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300'
            : 'border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
        }`}
      >
        ★
      </button>
    ))}
  </div>
);

export default function Reviews() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeMode();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAllReviews = async () => {
    setLoading(true);
    try {
      const { data } = await getReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !token) {
      logout();
      navigate('/login');
      return;
    }

    void loadAllReviews();
  }, [user, token, logout, navigate]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 'N/A';
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = comment.trim();
    if (!trimmed) {
      setError('Please add a short comment to submit your review.');
      return;
    }

    setSubmitting(true);
    try {
      await createReview({ rating, comment: trimmed });
      setSuccess('Review submitted successfully. Thanks for your feedback!');
      setComment('');
      setRating(5);
      await loadAllReviews();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <motion.header
          initial={fadeInUp.initial}
          whileInView={fadeInUp.whileInView}
          transition={fadeInUp.transition}
          viewport={fadeInUp.viewport}
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CoverCraft BD logo" className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Community Reviews</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Share feedback and help other students choose confidently.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`${interactionClass} rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200`}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <Link
              to="/dashboard"
              className={`${interactionClass} rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200`}
            >
              ← Dashboard
            </Link>
          </div>
        </motion.header>

        <motion.section
          initial={fadeInUp.initial}
          whileInView={fadeInUp.whileInView}
          transition={fadeInUp.transition}
          viewport={fadeInUp.viewport}
          className="mb-6 grid gap-4 sm:grid-cols-3"
        >
          <div className={`${interactionClass} rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900`}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Total Reviews</p>
            <p className="mt-2 text-3xl font-black">{reviews.length}</p>
          </div>
          <div className={`${interactionClass} rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900`}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Average Rating</p>
            <p className="mt-2 text-3xl font-black">{averageRating}</p>
          </div>
          <div className={`${interactionClass} rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900`}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Your Current Pick</p>
            <p className="mt-2 text-3xl font-black">{rating}★</p>
          </div>
        </motion.section>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.section
            initial={fadeInUp.initial}
            whileInView={fadeInUp.whileInView}
            transition={fadeInUp.transition}
            viewport={fadeInUp.viewport}
            className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <h2 className="text-lg font-black tracking-tight">Write a Review</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your feedback helps us improve faster.</p>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Rating</label>
                <StarRating value={rating} onChange={setRating} disabled={submitting} />
              </div>

              <div>
                <label htmlFor="review-comment" className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Comment
                </label>
                <textarea
                  id="review-comment"
                  rows={5}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="What did you like most about CoverCraft BD?"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`${interactionClass} w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </motion.section>

          <motion.section
            initial={fadeInUp.initial}
            whileInView={fadeInUp.whileInView}
            transition={fadeInUp.transition}
            viewport={fadeInUp.viewport}
            className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <h2 className="text-lg font-black tracking-tight">Latest Testimonials</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Most recent feedback from students.</p>

            {loading ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No reviews yet. Submit one from the form.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className={`${interactionClass} rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{review.user?.name || 'CoverCraft User'}</h3>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                        {'★'.repeat(Number(review.rating || 0))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </article>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
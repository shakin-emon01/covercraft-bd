/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createReview, deleteCover, getActiveBroadcast, getReviews } from '../api/auth';
import API from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useThemeMode } from '../hooks/useThemeMode';

const fadeInUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: 'easeOut' },
  viewport: { once: true, amount: 0.2 },
};

const interactionClass = 'transition-all duration-300 hover:scale-105 hover:shadow-lg';

const StarRating = ({ value, onChange, disabled = false }: { value: number; onChange: (val: number) => void; disabled?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
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
          aria-label={`Give ${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ratingLabel = (rating: number) => {
  if (rating >= 5) return 'Outstanding';
  if (rating >= 4) return 'Excellent';
  if (rating >= 3) return 'Good';
  if (rating >= 2) return 'Fair';
  return 'Needs Work';
};

const starsFromRating = (rating: number) => '★'.repeat(Math.max(0, Math.min(5, Number(rating) || 0)));

const getReviewDisplayName = (review: any) => {
  return review?.displayName || review?.user?.name || 'CoverCraft User';
};

export default function Dashboard() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeMode();

  const [profile, setProfile] = useState<any>(null);
  const [covers, setCovers] = useState<any[]>([]);
  const [coversLoading, setCoversLoading] = useState(true);
  const [deletingCoverId, setDeletingCoverId] = useState('');
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loadError, setLoadError] = useState('');

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const { data } = await getReviews({ view: 'carousel', sort: 'top', take: 10 });
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !token) {
      logout();
      navigate('/login');
      return;
    }

    let cancelled = false;

    const loadDashboardData = async () => {
      setLoadError('');
      setCoversLoading(true);
      setReviewsLoading(true);

      const [profileRes, coversRes, broadcastRes, reviewsRes] = await Promise.allSettled([
        API.get('/profile'),
        API.get('/covers'),
        getActiveBroadcast(),
        getReviews({ view: 'carousel', sort: 'top', take: 10 }),
      ]);

      if (cancelled) return;

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      else setProfile(null);

      if (coversRes.status === 'fulfilled') setCovers(coversRes.value.data || []);
      else {
        setCovers([]);
        setLoadError('Could not load dashboard data. Please ensure backend server is running on port 5000.');
      }

      if (broadcastRes.status === 'fulfilled') setBroadcast(broadcastRes.value.data);
      else setBroadcast(null);

      if (reviewsRes.status === 'fulfilled') setReviews(Array.isArray(reviewsRes.value.data) ? reviewsRes.value.data : []);
      else setReviews([]);

      setCoversLoading(false);
      setReviewsLoading(false);
    };

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [user, token, logout, navigate]);

  useEffect(() => {
    if (!reviews.length) {
      setActiveCarouselIndex(0);
      return;
    }
    if (activeCarouselIndex >= reviews.length) {
      setActiveCarouselIndex(0);
    }
  }, [reviews.length, activeCarouselIndex]);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const intervalId = window.setInterval(() => {
      setActiveCarouselIndex((prev) => (prev + 1) % reviews.length);
    }, 4200);
    return () => window.clearInterval(intervalId);
  }, [reviews.length]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDuplicate = (cover: any) => {
    const coverForm = cover?.coverData || {};
    const payload = JSON.stringify({
      form: coverForm,
      selectedTemplate: Number(cover?.templateId) || 1,
      selectedPalette: cover?.paletteId || 'blue',
    });
    localStorage.setItem('covercraft_draft_v2', payload);
    localStorage.setItem('covercraft_draft', payload);
    navigate('/create');
  };

  const handleDeleteCover = async (coverId: string) => {
    if (!window.confirm('Are you sure you want to delete this saved cover?')) return;

    setDeletingCoverId(coverId);
    try {
      await deleteCover(coverId);
      setCovers((prev) => prev.filter((cover) => cover.id !== coverId));
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to delete cover.');
    } finally {
      setDeletingCoverId('');
    }
  };

  const handleReviewSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    const sanitized = reviewComment.trim();
    if (!sanitized) {
      setReviewError('Please write a short comment before submitting.');
      return;
    }

    setReviewSubmitting(true);
    try {
      await createReview({ rating: reviewRating, comment: sanitized });
      setReviewSuccess('Thanks! Your review was submitted.');
      setReviewComment('');
      setReviewRating(5);
      await loadReviews();
    } catch (error: any) {
      setReviewError(error?.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getExpiryDate = (cover: any) => {
    if (cover?.expiresAt) return new Date(cover.expiresAt);
    const createdAt = new Date(cover.createdAt);
    return new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  };

  const previewCovers = covers.slice(0, 6);
  const currentCarouselReview = reviews[activeCarouselIndex] || null;
  const previousCarouselReview = reviews[(activeCarouselIndex - 1 + reviews.length) % reviews.length] || null;
  const nextCarouselReview = reviews[(activeCarouselIndex + 1) % reviews.length] || null;

  const averageRating = useMemo(() => {
    if (!reviews.length) return 'N/A';
    const total = reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const stats = [
    { label: 'Covers Created', value: covers.length || 0, icon: '📄' },
    { label: 'Templates Used', value: new Set(covers.map((cover) => cover.templateId)).size || 0, icon: '🎨' },
    { label: 'Top 10 Rating', value: averageRating, icon: '⭐' },
    { label: 'University', value: profile?.university?.shortName || '—', icon: '🏛️' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 flex-nowrap">
            <img src="/logo.png" alt="CoverCraft BD logo" className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
            <div className="min-w-0">
              <div className="truncate whitespace-nowrap text-lg font-black leading-tight tracking-tight">CoverCraft BD</div>
              <p className="truncate whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">Academic Cover Generator</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`${interactionClass} rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200`}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>

            <Link
              to="/reviews"
              className={`${interactionClass} rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200`}
            >
              All Reviews
            </Link>

            <Link
              to="/create"
              className={`${interactionClass} rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-3 py-2 text-sm font-bold text-white`}
            >
              + New Cover
            </Link>

            <button
              onClick={handleLogout}
              className={`${interactionClass} rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {loadError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
            {loadError}
          </div>
        )}

        {broadcast?.isActive && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            📢 {broadcast.message}
          </div>
        )}

        <motion.section
          initial={fadeInUp.initial}
          whileInView={fadeInUp.whileInView}
          transition={fadeInUp.transition}
          viewport={fadeInUp.viewport}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600 px-5 py-8 text-white shadow-xl sm:px-8"
        >
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-14 h-64 w-64 rounded-full bg-cyan-300/15" />

          <div className="relative z-10 grid gap-8 md:grid-cols-[1.35fr_1fr] md:items-center">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100/80">Welcome Back</p>
              <h1 className="text-3xl font-black leading-tight sm:text-4xl">
                {user?.name ? `${user.name}, ready for your next submission?` : 'Ready for your next submission?'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-blue-100/85 sm:text-base">
                Build premium looking university cover pages in minutes. Scroll down to explore your saved work, feedback, and quick actions.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/create')}
                  className={`${interactionClass} rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-800`}
                >
                  Start Designing
                </button>

                <button
                  onClick={() => navigate('/profile/setup')}
                  className={`${interactionClass} rounded-xl border border-white/35 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur`}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.25 }}
              className="mx-auto flex w-full max-w-xs items-center justify-center rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur"
            >
              <img src="/logo.png" alt="CoverCraft BD visual" className="w-full rounded-2xl object-contain" />
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          initial={fadeInUp.initial}
          whileInView={fadeInUp.whileInView}
          transition={fadeInUp.transition}
          viewport={fadeInUp.viewport}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((item) => (
            <div
              key={item.label}
              className={`${interactionClass} rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900`}
            >
              <div className="mb-3 text-2xl">{item.icon}</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{item.value}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{item.label}</div>
            </div>
          ))}
        </motion.section>

        <motion.section
          initial={fadeInUp.initial}
          whileInView={fadeInUp.whileInView}
          transition={fadeInUp.transition}
          viewport={fadeInUp.viewport}
          className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">Recent Covers</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your latest generated files with quick actions.</p>
            </div>
            <Link
              to="/covers"
              className={`${interactionClass} rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200`}
            >
              View All
            </Link>
          </div>

          {coversLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading your recent covers...
            </div>
          ) : previewCovers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No covers created yet.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Generate your first one and it will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {previewCovers.map((cover) => (
                <div
                  key={cover.id}
                  className={`${interactionClass} rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-300">
                    {cover.coverData?.courseCode || 'Course N/A'}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-extrabold leading-tight text-slate-900 dark:text-slate-100">
                    {cover.coverData?.topicName || 'Untitled Assignment'}
                  </h3>
                  <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Created: {new Date(cover.createdAt).toLocaleDateString()} • Expires: {getExpiryDate(cover).toLocaleDateString()}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      onClick={() => handleDuplicate(cover)}
                      className={`${interactionClass} rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-700`}
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => navigate(`/share/${cover.id}`)}
                      className={`${interactionClass} rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white`}
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleDeleteCover(cover.id)}
                      disabled={deletingCoverId === cover.id}
                      className={`${interactionClass} rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {deletingCoverId === cover.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          initial={fadeInUp.initial}
          whileInView={fadeInUp.whileInView}
          transition={fadeInUp.transition}
          viewport={fadeInUp.viewport}
          className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-5 text-slate-100 dark:border-slate-700 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  What Our <span className="text-cyan-300">Users</span> Say
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Trusted by Bangladeshi students for fast, professional, print-ready cover pages. Showing top 10 highest-rated reviews.
                </p>
              </div>
              <Link
                to="/reviews"
                className={`${interactionClass} rounded-xl border border-slate-500/60 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-100`}
              >
                More Reviews
              </Link>
            </div>

            {reviewsLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-600 px-4 py-8 text-center text-sm font-semibold text-slate-300">
                Loading top reviews carousel...
              </div>
            ) : !currentCarouselReview ? (
              <div className="rounded-2xl border border-dashed border-slate-600 px-4 py-8 text-center text-sm font-semibold text-slate-300">
                No reviews available yet. Ask users to share feedback.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="hidden grid-cols-[0.82fr_1.2fr_0.82fr] items-stretch gap-4 lg:grid">
                  {[previousCarouselReview, currentCarouselReview, nextCarouselReview].map((review, idx) => {
                    const isCenter = idx === 1;
                    const author = getReviewDisplayName(review);
                    return (
                      <div
                        key={`${review?.id}-${idx}-${activeCarouselIndex}`}
                        className={`rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-4 transition-all duration-500 ${isCenter ? 'scale-100 shadow-2xl shadow-cyan-500/15' : 'scale-95 opacity-55'}`}
                      >
                        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-white">{author}</p>
                            <p className="text-xs text-blue-100">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          <p className="mt-1 text-xs text-blue-100">{review.headline || 'Verified CoverCraft BD Review'}</p>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-amber-300">{starsFromRating(review.rating)}</p>
                        <p className="mt-2 line-clamp-4 text-sm text-slate-200">{review.comment}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-cyan-400/30 bg-slate-900/75 p-4 lg:hidden">
                  <div className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white">{getReviewDisplayName(currentCarouselReview)}</p>
                      <p className="text-xs text-blue-100">{new Date(currentCarouselReview.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="mt-1 text-xs text-blue-100">{currentCarouselReview.headline || 'Verified CoverCraft BD Review'}</p>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-amber-300">{starsFromRating(currentCarouselReview.rating)}</p>
                  <p className="mt-2 text-sm text-slate-200">{currentCarouselReview.comment}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {reviews.map((review, idx) => (
                      <button
                        key={review.id}
                        type="button"
                        onClick={() => setActiveCarouselIndex(idx)}
                        aria-label={`Show review ${idx + 1}`}
                        className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${idx === activeCarouselIndex ? 'w-6 bg-cyan-300' : 'bg-slate-500 hover:bg-slate-300'}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCarouselIndex((prev) => (prev - 1 + reviews.length) % reviews.length)}
                      className={`${interactionClass} rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 py-1.5 text-xs font-bold text-slate-100`}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCarouselIndex((prev) => (prev + 1) % reviews.length)}
                      className={`${interactionClass} rounded-lg border border-slate-500/60 bg-slate-900/70 px-3 py-1.5 text-xs font-bold text-slate-100`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h3 className="text-lg font-black tracking-tight">Rate Your Experience</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Drop a quick rating and comment for the community.</p>

            <form className="mt-4 space-y-4" onSubmit={handleReviewSubmit}>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                  Your Rating
                </label>
                <StarRating value={reviewRating} onChange={setReviewRating} disabled={reviewSubmitting} />
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{ratingLabel(reviewRating)}</p>
              </div>

              <div>
                <label htmlFor="dashboard-review" className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                  Your Review
                </label>
                <textarea
                  id="dashboard-review"
                  rows={4}
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Tell us how CoverCraft BD helped you..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {reviewError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
                  {reviewError}
                </p>
              )}

              {reviewSuccess && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {reviewSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={reviewSubmitting}
                className={`${interactionClass} w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

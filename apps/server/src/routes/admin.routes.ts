import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  getAdminCovers,
  syncUniversitiesByAdmin,
  upload,
  uploadUniversityLogo,
  getPendingLogoRequests,
  reviewLogoRequest,
  reviewLogoRequestsBulk,
  deleteUser,
  getAllUniversitiesAdmin,
  addUniversity,
  updateUniversity,
  deleteUniversity,
  getTemplateAnalytics,
  updateBroadcast,
  getAuditLogs,
  getRoleMatrix,
  updateUserRoleAndStatus,
  getAbuseRiskUsers,
  createAbuseSignal,
  markAbuseSignalReviewed,
  createUniversityVerificationRequest,
  getUniversityVerifications,
  reviewUniversityVerification,
  getTemplatePerformanceAnalytics,
  getOperationalAlerts,
  createOperationalAlert,
  resolveOperationalAlert,
  massUserAction,
  getFeatureFlags,
  upsertFeatureFlag,
  deleteFeatureFlag,
  getSupportTickets,
  getSupportTicketStats,
  createSupportTicket,
  updateSupportTicket,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', requirePermission('analytics.view'), getAdminStats);
router.get('/users', requirePermission('users.view'), getAdminUsers);
router.get('/covers', requirePermission('analytics.view'), getAdminCovers);
router.patch('/users/:id/access', requirePermission('roles.manage'), updateUserRoleAndStatus);
router.delete('/users/:id', requirePermission('users.delete'), deleteUser);
router.post('/users/mass-action', requirePermission('users.mass'), massUserAction);

router.get('/users/abuse-risk', requirePermission('users.abuse'), getAbuseRiskUsers);
router.post('/users/abuse-signals', requirePermission('users.abuse'), createAbuseSignal);
router.patch('/users/abuse-signals/:id/review', requirePermission('users.abuse'), markAbuseSignalReviewed);

router.get('/universities', requirePermission('universities.manage'), getAllUniversitiesAdmin);
router.post('/universities', requirePermission('universities.manage'), addUniversity);
router.put('/universities/:id', requirePermission('universities.manage'), updateUniversity);
router.delete('/universities/:id', requirePermission('universities.manage'), deleteUniversity);
router.post('/universities/sync', requirePermission('universities.manage'), syncUniversitiesByAdmin);
router.post('/universities/:id/logo', requirePermission('universities.manage'), upload.single('logo'), uploadUniversityLogo);

router.get('/verifications', requirePermission('verification.view'), getUniversityVerifications);
router.post('/verifications', requirePermission('verification.manage'), createUniversityVerificationRequest);
router.post('/verifications/:id/review', requirePermission('verification.manage'), reviewUniversityVerification);

router.get('/logo-requests', requirePermission('logos.review'), getPendingLogoRequests);
router.post('/logo-requests/:id/resolve', requirePermission('logos.review'), reviewLogoRequest);
router.post('/logo-requests/bulk-resolve', requirePermission('logos.review'), reviewLogoRequestsBulk);

router.get('/analytics/templates', requirePermission('analytics.view'), getTemplateAnalytics);
router.get('/analytics/templates/performance', requirePermission('analytics.view'), getTemplatePerformanceAnalytics);

router.post('/broadcast', requirePermission('broadcast.manage'), updateBroadcast);

router.get('/alerts', requirePermission('alerts.manage'), getOperationalAlerts);
router.post('/alerts', requirePermission('alerts.manage'), createOperationalAlert);
router.patch('/alerts/:id/resolve', requirePermission('alerts.manage'), resolveOperationalAlert);

router.get('/flags', requirePermission('flags.view'), getFeatureFlags);
router.post('/flags', requirePermission('flags.manage'), upsertFeatureFlag);
router.delete('/flags/:key', requirePermission('flags.manage'), deleteFeatureFlag);

router.get('/support/tickets', requirePermission('tickets.manage'), getSupportTickets);
router.get('/support/tickets/stats', requirePermission('tickets.manage'), getSupportTicketStats);
router.post('/support/tickets', requirePermission('tickets.manage'), createSupportTicket);
router.patch('/support/tickets/:id', requirePermission('tickets.manage'), updateSupportTicket);

router.get('/audit-logs', requirePermission('audit.view'), getAuditLogs);
router.get('/role-matrix', requirePermission('audit.view'), getRoleMatrix);

export default router;

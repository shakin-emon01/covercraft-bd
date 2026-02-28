# Security & Privacy Features Implementation Guide

This document provides a comprehensive guide for the newly implemented security and privacy features in CoverCraft BD.

## 📋 Table of Contents

1. [Email Verification + Password Reset OTP](#email-verification--password-reset-otp)
2. [Refresh Token Rotation + Token Revocation](#refresh-token-rotation--token-revocation)
3. [Session Management](#session-management)
4. [Signed Download URLs](#signed-download-urls)
5. [WAF/Captcha Protection](#wafcaptcha-protection)
6. [Environment Setup](#environment-setup)
7. [API Endpoints](#api-endpoints)
8. [Frontend Integration](#frontend-integration)

---

## 🔐 Email Verification + Password Reset OTP

### Overview
- Users must verify their email after registration
- Secure password reset with OTP and email verification
- 6-digit codes expire after 10 minutes
- OTP sent via email (Gmail SMTP)

### Backend Implementation
Located in: `src/lib/auth.service.ts`

**Key Functions:**
- `sendEmailVerification(email, name)` - Send verification code
- `verifyEmail(userId, code)` - Verify email with code
- `initiatePasswordReset(email)` - Send password reset link
- `resetPassword(email, resetToken, newPassword)` - Reset password

### Database Fields
```prisma
User {
  emailVerified: Boolean @default(false)
  emailVerificationCode: String?
  resetTokenHash: String?
  resetTokenExpiry: DateTime?
}
```

### API Endpoints

**Send Verification Code**
```
POST /api/security/send-verification-code
Headers: Authorization: Bearer {token}
Response: { message: "Verification code sent to your email" }
```

**Verify Email**
```
POST /api/security/verify-email
Headers: Authorization: Bearer {token}
Body: { code: "123456" }
Response: { message: "Email verified successfully" }
```

**Request Password Reset**
```
POST /api/security/request-password-reset
Body: { email: "user@example.com" }
Response: { message: "Password reset link sent to your email" }
```

**Reset Password**
```
POST /api/security/reset-password
Body: {
  email: "user@example.com",
  resetToken: "token-from-email",
  newPassword: "newpass123",
  confirmPassword: "newpass123"
}
Response: { message: "Password reset successfully" }
```

### Frontend Usage
```typescript
import { useSecurityFeatures } from '../hooks/useSecurityFeatures';

const { sendEmailVerification, verifyEmail } = useSecurityFeatures(token);

// Send code
await sendEmailVerification();

// Verify code
await verifyEmail('123456');
```

---

## 🔑 Refresh Token Rotation + Token Revocation

### Overview
- Access tokens expire in 7 days
- Refresh tokens expire in 30 days
- Automatic token rotation on refresh
- Token blacklist for logout and revocation

### Database Models
```prisma
RefreshToken {
  id: String @id
  userId: String
  token: String @unique
  revoked: Boolean @default(false)
  expiresAt: DateTime
}

TokenBlacklist {
  id: String @id
  token: String @unique
  expiresAt: DateTime
}
```

### Backend Implementation
**Key Functions:**
- `createRefreshToken(userId)` - Create new refresh token
- `refreshAccessToken(refreshToken)` - Get new access token
- `revokeRefreshToken(refreshToken)` - Revoke specific refresh token
- `revokeAllUserTokens(userId)` - Logout all sessions
- `blacklistToken(token)` - Add token to blacklist

### API Endpoints

**Refresh Token**
```
POST /api/security/refresh-token
Body: { refreshToken: "refresh-token-here" }
Response: {
  accessToken: "new-access-token",
  refreshToken: "new-refresh-token"
}
```

**Logout (Revoke All)**
```
POST /api/security/logout
Headers: Authorization: Bearer {accessToken}
Response: { message: "Logged out successfully" }
```

### Frontend Usage
```typescript
const { refreshAccessToken, logout } = useSecurityFeatures(token);

// Refresh access token
const result = await refreshAccessToken(refreshToken);
if (result.success) {
  localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('refreshToken', result.refreshToken);
}

// Logout
await logout();
```

---

## 📱 Session Management

### Overview
- Track active sessions across devices
- View device name, IP address, and last activity
- Revoke specific sessions remotely
- Sign out from all other devices

### Database Model
```prisma
Session {
  id: String @id
  userId: String
  deviceName: String      // Extracted from User-Agent
  ipAddress: String
  userAgent: String
  lastActivity: DateTime
  createdAt: DateTime
}
```

### Backend Implementation
**Key Functions:**
- `upsertSession(userId, ipAddress, userAgent)` - Create session
- `updateSessionActivity(sessionId)` - Update last activity
- `getActiveSessions(userId)` - Get all active sessions
- `revokeSession(sessionId)` - Delete specific session
- `revokeAllOtherSessions(userId, currentSessionId)` - Keep only current

### API Endpoints

**Get Active Sessions**
```
GET /api/security/sessions
Headers: Authorization: Bearer {token}
Response: [
  {
    id: "session-id",
    deviceName: "Windows",
    ipAddress: "192.168.1.1",
    createdAt: "2024-01-01T00:00:00Z",
    lastActivity: "2024-01-01T12:00:00Z"
  }
]
```

**Revoke Specific Session**
```
DELETE /api/security/sessions/{sessionId}
Headers: Authorization: Bearer {token}
Response: { message: "Session revoked successfully" }
```

**Revoke All Other Sessions**
```
POST /api/security/sessions/revoke-others
Headers: Authorization: Bearer {token}
Body: { sessionId: "current-session-id" }
Response: { message: "All other sessions have been revoked" }
```

### Frontend Component
```typescript
import { SessionManagementPage } from '../pages/SessionManagement';

<SessionManagementPage token={authToken} />
```

---

## 🔗 Signed Download URLs

### Overview
- Generate time-limited URLs for file downloads
- URLs expire after 30 minutes (configurable)
- Base64-encoded signature with timestamp
- Prevents direct file access

### Database Model
```prisma
SignedUrl {
  id: String @id
  signature: String @unique   // Encoded base64 string
  fileType: String           // pdf, png, zip
  filePath: String           // Path to file
  expiresAt: DateTime
}
```

### Backend Implementation
**Key Functions:**
- `generateSignedDownloadUrl(filePath, fileType, expiryMinutes)`
- `validateSignedUrl(signature)` - Verify URL validity
- `cleanupExpiredUrls()` - Remove expired URLs (runs periodically)

### API Endpoints

**Generate Signed URL**
```
POST /api/security/generate-signed-url
Headers: Authorization: Bearer {token}
Body: {
  filePath: "uploads/covers/file.pdf",
  fileType: "pdf"
}
Response: { signedUrl: "base64-encoded-signature" }
```

**Download with Signed URL**
```
GET /api/security/download/{signature}
Response: File content (or redirect to S3/Cloud Storage)
```

### Frontend Usage
```typescript
const { generateSignedUrl } = useSecurityFeatures(token);

// Generate URL
const { signedUrl } = await generateSignedUrl('uploads/file.pdf', 'pdf');

// Use URL for download
window.location.href = `/api/security/download/${signedUrl}`;
```

---

## 🛡️ WAF/Captcha Protection

### Overview (P2 Priority)
- Rate limiting on auth endpoints (5 attempts / 15 minutes)
- Web Application Firewall (WAF) basic pattern detection
- Optional reCAPTCHA v3 integration
- Optional hCaptcha integration

### Rate Limiting
- `/auth/register`: 5 attempts per 15 minutes
- `/auth/login`: 5 attempts per 15 minutes
- `/security/request-password-reset`: 3 attempts per 15 minutes

### WAF Protection
Detects:
- HTML/SQL injection patterns
- Directory traversal attacks
- XSS script patterns

### Captcha Configuration

**reCAPTCHA v3:**
```typescript
import { verifyRecaptcha } from '../middleware/waf.middleware';

router.post('/login', verifyRecaptcha, loginHandler);
```

**hCaptcha:**
```typescript
import { verifyHcaptcha } from '../middleware/waf.middleware';

router.post('/register', verifyHcaptcha, registerHandler);
```

---

## 🔧 Environment Setup

### Backend (.env)
```
DATABASE_URL="postgresql://user:pass@localhost/covercraft_db"
JWT_SECRET="min-32-characters-secret-key"
REFRESH_TOKEN_SECRET="min-32-characters-refresh-secret"
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASS="gmail-app-password"
FRONTEND_URL="http://localhost:5173"
RECAPTCHA_SECRET_KEY="your-recaptcha-key"
HCAPTCHA_SECRET="your-hcaptcha-key"
```

### Frontend (.env)
```
VITE_API_URL="http://localhost:5000/api"
VITE_RECAPTCHA_SITE_KEY="your-recaptcha-key"
VITE_HCAPTCHA_SITE_KEY="your-hcaptcha-key"
VITE_ENABLE_EMAIL_VERIFICATION=true
VITE_ENABLE_SESSION_MANAGEMENT=true
```

### Database Migration
```bash
cd apps/server
npx prisma migrate dev --name add_security_features
npx prisma generate
```

---

## 📚 Frontend Integration

### 1. Add Hooks to Your Pages
```typescript
import { useSecurityFeatures } from '../hooks/useSecurityFeatures';

export const MyPage = () => {
  const token = localStorage.getItem('accessToken');
  const security = useSecurityFeatures(token);
  
  // Use security.sendEmailVerification(), etc.
};
```

### 2. Add Components
```typescript
import { EmailVerificationComponent } from '../components/EmailVerification';
import { PasswordResetComponent } from '../components/PasswordReset';
import { SessionManagementPage } from '../pages/SessionManagement';

// In your settings/profile page:
<EmailVerificationComponent token={token} />
<SessionManagementPage token={token} />
```

### 3. Update Login Flow
```typescript
// After successful login:
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
localStorage.setItem('sessionId', response.sessionId); // From login response

// Handle token refresh before expiry
setInterval(() => {
  const refreshToken = localStorage.getItem('refreshToken');
  securityFeatures.refreshAccessToken(refreshToken);
}, 6 * 24 * 60 * 60 * 1000); // Every 6 days
```

---

## 🚀 Deployment Checklist

- [ ] Set strong JWT_SECRET and REFRESH_TOKEN_SECRET (32+ characters)
- [ ] Configure Gmail App Password for email
- [ ] Set FRONTEND_URL to production domain
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Set up reCAPTCHA keys in Google Cloud Console
- [ ] Configure CORS origin in .env
- [ ] Enable HTTPS in production
- [ ] Set NODE_ENV=production
- [ ] Configure backup strategy for database
- [ ] Monitor session cleanup (old sessions auto-deleted after 30 days)

---

## 📊 Monitoring & Logs

### Key Events to Monitor
- Multiple failed login attempts (rate limit triggers)
- Unusual session locations (IP changes)
- Token refresh failures
- Verification code retries
- Password reset attempts

### Query Active Sessions
```sql
SELECT userId, deviceName, ipAddress, lastActivity 
FROM "Session" 
WHERE "updatedAt" > NOW() - INTERVAL '7 days'
ORDER BY "lastActivity" DESC;
```

---

## 🔄 Maintenance Tasks

1. **Clean up expired tokens** (runs automatically every 10 minutes)
2. **Archive old sessions** (keep last 90 days)
3. **Rotate JWT secrets** (update .env quarterly)
4. **Review audit logs** (for admin actions)
5. **Email quota monitoring** (Gmail SMTP limits)

---

## 📞 Support & Troubleshooting

### Email Not Sending
- Check EMAIL_USER and EMAIL_PASS in .env
- Enable "Less secure app access" or use App Password
- Verify email service limits

### Sessions Not Tracking
- Ensure middleware order in index.ts is correct
- Check User-Agent header is being passed
- Verify database connection

### Token Refresh Issues
- Ensure REFRESH_TOKEN_SECRET is set
- Check token expiry configuration
- Monitor token blacklist cleanup

---

## 🎯 Next Steps (P1/P2 Features)

1. **Implement 2FA (TOTP)** for admin accounts
2. **Add file upload security scanning** for logo uploads
3. **Create immutable security logs** (append-only)
4. **Set up secret vault + key rotation**
5. **Add PII data retention policy**
6. **Enable At-rest encryption** for sensitive fields

---

*Last Updated: 2026-02-28*

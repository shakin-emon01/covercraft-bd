# Quick Start: Security Features Deployment

## 🚀 5-Minute Setup Guide

### Step 1: Database Setup
```bash
cd apps/server
npx prisma migrate dev --name add_security_features
npx prisma generate
```

### Step 2: Environment Configuration
```bash
# Copy .env template
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL (Postgres)
# - JWT_SECRET (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - REFRESH_TOKEN_SECRET (run same command)
# - EMAIL_USER and EMAIL_PASS (Gmail)
# - FRONTEND_URL
```

### Step 3: Frontend Setup
```bash
cd apps/web

# Copy .env template
cp .env.example .env

# Edit .env with your API_URL
# VITE_API_URL="http://localhost:5000/api"
```

### Step 4: Start Development Server
```bash
# Terminal 1: Backend
cd apps/server
npm run dev

# Terminal 2: Frontend
cd apps/web
npm run dev
```

---

## 🧪 Testing the Features

### Test 1: Email Verification
```bash
# 1. Register new user
POST http://localhost:5000/api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}

# 2. Send verification code (as logged-in user)
POST http://localhost:5000/api/security/send-verification-code
Headers: Authorization: Bearer {token}

# 3. Check email for code (in development, check console logs)

# 4. Verify email
POST http://localhost:5000/api/security/verify-email
Headers: Authorization: Bearer {token}
{
  "code": "123456"  // From email
}
```

### Test 2: Password Reset
```bash
# 1. Request password reset
POST http://localhost:5000/api/security/request-password-reset
{
  "email": "test@example.com"
}

# 2. Get reset token from email

# 3. Reset password
POST http://localhost:5000/api/security/reset-password
{
  "email": "test@example.com",
  "resetToken": "token-from-email",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### Test 3: Session Management
```bash
# 1. Get active sessions
GET http://localhost:5000/api/security/sessions
Headers: Authorization: Bearer {token}

# 2. Revoke specific session
DELETE http://localhost:5000/api/security/sessions/{sessionId}
Headers: Authorization: Bearer {token}

# 3. Revoke all other sessions
POST http://localhost:5000/api/security/sessions/revoke-others
Headers: Authorization: Bearer {token}
{
  "sessionId": "current-session-id"
}
```

### Test 4: Token Refresh
```bash
# 1. Login to get refresh token
POST http://localhost:5000/api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}
// Response includes: accessToken, refreshToken

# 2. Refresh access token
POST http://localhost:5000/api/security/refresh-token
{
  "refreshToken": "refresh-token-from-login"
}
// Response includes: new accessToken, new refreshToken
```

### Test 5: Rate Limiting
```bash
# Make 6 login attempts within 15 minutes - 6th will be blocked
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "\nAttempt $i"
  sleep 1
done

# 6th request will return 429 (Too Many Requests)
```

### Test 6: Signed URLs
```bash
# 1. Generate signed URL
POST http://localhost:5000/api/security/generate-signed-url
Headers: Authorization: Bearer {token}
{
  "filePath": "uploads/covers/sample.pdf",
  "fileType": "pdf"
}

# 2. Download with signature
GET http://localhost:5000/api/security/download/{signature}
```

---

## 📱 Frontend Integration Quick Test

### Add to Settings Page
```tsx
import { useSecurityFeatures } from '../hooks/useSecurityFeatures';
import { SessionManagementPage } from '../pages/SessionManagement';
import { EmailVerificationComponent } from '../components/EmailVerification';

export const SettingsPage = () => {
  const token = localStorage.getItem('accessToken');

  return (
    <div>
      <h1>Account Settings</h1>
      <EmailVerificationComponent token={token} />
      <SessionManagementPage token={token} />
    </div>
  );
};
```

### Quick Component Test
```bash
# 1. Go to http://localhost:5173/settings
# 2. Click "Send Verification Code"
# 3. Check browser console for simulated email
# 4. Enter code to verify
# 5. View active sessions
# 6. Try revoking a session
```

---

## 🔍 Debugging Tips

### Check Email Sending (Development)
- In development, emails print to console
- Gmail SMTP requires "App Password" (not regular password)
- Check `.env` has EMAIL_USER and EMAIL_PASS

### Check Database Migrations
```bash
# View migration status
npx prisma migrate status

# See all tables created
npx prisma db seed  # (if seed.ts exists)
```

### Check Rate Limiting
```bash
# Look for "Too many attempts" errors in console
# Rate limiter resets every 15 minutes
# Check logs in terminal for rate limit triggers
```

### Check Session Tracking
```bash
# Query sessions in database:
# SELECT * FROM "Session" WHERE "userId" = 'user-id';
```

### Check Token Rotation
```bash
# Decode JWT token:
# Go to jwt.io and paste your token
# Should show: { userId, role, exp, iat }
```

---

## 📋 Checklist for Production

- [ ] Set strong JWT secrets (32+ random characters)
- [ ] Configure real Gmail account with App Password
- [ ] Set FRONTEND_URL to production domain
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure database backup
- [ ] Review all .env values
- [ ] Test all endpoints in production environment
- [ ] Monitor logs for errors
- [ ] Set up email alerts for security events

---

## 🆘 Common Issues

### "Email not sending"
```
Solution:
1. Check EMAIL_USER and EMAIL_PASS in .env
2. Use Gmail App Password (not account password)
3. Enable 2FA on Gmail account first
4. Check email service quotas
```

### "Token blacklist table not found"
```
Solution:
1. Run migrations: npx prisma migrate dev
2. Check ".env" DATABASE_URL is correct
3. Verify Postgres is running
4. Check migration status: npx prisma migrate status
```

### "Rate limiting too strict"
```
Solution:
1. Edit window/maxRequests in waf.middleware.ts
2. Default: 5 attempts per 15 minutes
3. Change in createRateLimiter calls
```

### "Session not tracking IP address"
```
Solution:
1. Verify middleware order in index.ts
2. trackSession must come before createSession
3. Check req.ip is available
4. For behind proxy: set trust proxy in Express
```

---

## 📞 Support Commands

```bash
# Check database connection
npx prisma db execute --stdin < check-connection.sql

# View all sessions for a user
npx prisma client --execute "User.findUnique({where:{id:'user-id'}, include:{sessions:true}})"

# Clean up expired sessions (manual)
npx prisma client --execute "Session.deleteMany({where:{updatedAt:{lt:Date.now()-30d}}})"

# Check migration history
npx prisma migrate status

# Reset database (⚠️ DESTRUCTIVE)
npx prisma migrate reset
```

---

## 🎓 Learning Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Prisma Security Guide](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

*Last Updated: 2026-02-28*
*Ready for production deployment*

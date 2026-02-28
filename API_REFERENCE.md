# Security API Reference

## Base URL
```
http://localhost:5000/api/security
```

## Authentication
All endpoints except `request-password-reset` and `reset-password` require:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

---

## Email Verification

### Send Verification Code
Send a 6-digit code to user's email.

**Endpoint:**
```
POST /send-verification-code
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Verification code sent to your email"
}
```

**Errors:**
- `401` - Unauthorized (missing/invalid token)
- `404` - User not found
- `500` - Server error (email service)

---

### Verify Email
Verify email with 6-digit code.

**Endpoint:**
```
POST /verify-email
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Errors:**
- `400` - Invalid or expired code
- `401` - Unauthorized
- `500` - Server error

---

## Password Reset

### Request Password Reset
Initiate password reset flow (sends reset link to email).

**Endpoint:**
```
POST /request-password-reset
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account with that email exists, a reset link has been sent"
}
```

**Errors:**
- `400` - Email required
- `429` - Too many attempts (max 3 per 15 minutes)
- `500` - Server error

**Security Note:** Response is same whether user exists or not (prevents email enumeration)

---

### Reset Password
Complete password reset with token.

**Endpoint:**
```
POST /reset-password
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "resetToken": "token-from-email",
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully. Please login with your new password."
}
```

**Errors:**
- `400` - Missing fields, mismatched passwords, invalid token
- `400` - Password too short (< 8 characters)
- `429` - Too many attempts (max 3 per 15 minutes)
- `500` - Server error

**Side Effects:** All refresh tokens revoked (user logged out everywhere)

---

## Token Management

### Refresh Access Token
Get new access token using refresh token.

**Endpoint:**
```
POST /refresh-token
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response (200):**
```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token"
}
```

**Errors:**
- `400` - Refresh token required
- `401` - Invalid or expired refresh token
- `500` - Server error

**Note:** Old refresh token is automatically revoked (token rotation)

---

### Logout
Revoke all tokens and sessions for user.

**Endpoint:**
```
POST /logout
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `500` - Server error

**Side Effects:**
- All refresh tokens revoked
- All sessions deleted
- Current access token blacklisted

---

## Session Management

### Get Active Sessions
List all active sessions (devices) for user.

**Endpoint:**
```
GET /sessions
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": "session-uuid",
    "deviceName": "Windows",
    "ipAddress": "192.168.1.100",
    "createdAt": "2024-01-01T08:00:00Z",
    "lastActivity": "2024-01-01T14:30:00Z"
  },
  {
    "id": "session-uuid-2",
    "deviceName": "Mobile",
    "ipAddress": "203.45.67.89",
    "createdAt": "2024-01-01T10:00:00Z",
    "lastActivity": "2024-01-01T14:25:00Z"
  }
]
```

**Errors:**
- `401` - Unauthorized
- `500` - Server error

---

### Revoke Specific Session
Delete/revoke a specific session.

**Endpoint:**
```
DELETE /sessions/{sessionId}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `sessionId` - UUID of session to revoke

**Response (200):**
```json
{
  "message": "Session revoked successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Session doesn't belong to user
- `404` - Session not found
- `500` - Server error

**Side Effects:** User logged out on that device

---

### Revoke All Other Sessions
Delete all sessions except the current one.

**Endpoint:**
```
POST /sessions/revoke-others
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "sessionId": "current-session-id"
}
```

**Response (200):**
```json
{
  "message": "All other sessions have been revoked"
}
```

**Errors:**
- `400` - Missing sessionId
- `401` - Unauthorized
- `500` - Server error

**Side Effects:** User logged out on all other devices

---

## Signed Download URLs

### Generate Signed URL
Create a time-limited URL for file download.

**Endpoint:**
```
POST /generate-signed-url
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "filePath": "uploads/covers/assignment-cover.pdf",
  "fileType": "pdf",
  "expiryMinutes": 30
}
```

**Response (200):**
```json
{
  "signedUrl": "base64-encoded-signature-string"
}
```

**Errors:**
- `400` - filePath or fileType missing
- `401` - Unauthorized
- `500` - Server error

**Usage:**
```
Download link: GET /download/{signedUrl}
```

---

### Download with Signed URL
Download file using signed URL (no auth required).

**Endpoint:**
```
GET /download/{signature}
```

**Parameters:**
- `signature` - Base64-encoded signed URL string

**Response (200):**
- File content (binary)

**Headers:**
```
Content-Type: application/pdf (or appropriate type)
Content-Disposition: attachment; filename="file.pdf"
```

**Errors:**
- `400` - Signature required
- `401` - Invalid or expired signature
- `500` - Server error

**Security:**
- URL valid for 30 minutes only (default)
- One-time use (optional, can implement)
- IP validation (optional, can implement)

---

## Response Codes

### Success
- `200` - Request successful
- `201` - Resource created

### Client Errors
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Too many requests (rate limited)

### Server Errors
- `500` - Internal server error
- `503` - Service unavailable

---

## Rate Limiting Headers

When rate limited, response includes:
```json
{
  "message": "Too many attempts. Please try again later.",
  "retryAfter": 300
}
```

**Rate Limits:**
- `/request-password-reset` - 3 per 15 minutes
- `/reset-password` - 3 per 15 minutes
- `/verify-email` - 10 per 15 minutes
- All endpoints - 300 per 15 minutes (global)

---

## Error Response Format

All errors return JSON:
```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input
- `AUTH_REQUIRED` - Missing authorization
- `INVALID_TOKEN` - Invalid or expired token
- `RATE_LIMITED` - Too many requests
- `USER_NOT_FOUND` - User doesn't exist
- `EMAIL_MISMATCH` - Email doesn't match
- `PASSWORD_WEAK` - Password too weak
- `SERVER_ERROR` - Unexpected server error

---

## Example Flows

### Complete Registration & Verification
```
1. POST /auth/register
   → Get accessToken, refreshToken
   
2. POST /security/send-verification-code
   → "Code sent to email"
   
3. [User receives email with 6-digit code]

4. POST /security/verify-email
   → "Email verified successfully"
```

### Complete Password Reset
```
1. POST /security/request-password-reset
   → "Email sent if account exists"
   
2. [User receives email with reset link]
   Link contains: /reset-password?token=XXX

3. POST /security/reset-password
   → "Password reset successfully"
   
4. Redirect to login page

5. POST /auth/login (with new password)
   → Get new tokens
```

### Session-Based Security
```
1. POST /auth/login
   → Get tokens, session created

2. GET /security/sessions
   → View all active sessions

3. DELETE /security/sessions/{sessionId}
   → Revoke other session

4. POST /security/sessions/revoke-others
   → Sign out all, keep current only
```

### Token Refresh & Rotation
```
1. accessToken expires (7 days)

2. POST /security/refresh-token
   → Get new accessToken + refreshToken
   → Old refreshToken revoked

3. Update localStorage with new tokens

4. Continue using new accessToken
```

---

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123"}'

# Send verification code
curl -X POST http://localhost:5000/api/security/send-verification-code \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify email
curl -X POST http://localhost:5000/api/security/verify-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'

# Get sessions
curl -X GET http://localhost:5000/api/security/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Request password reset
curl -X POST http://localhost:5000/api/security/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Webhooks & Events (Reserved for Future)

Potential events to emit:
- `user.email_verified`
- `user.password_reset`
- `user.session_created`
- `user.session_revoked`
- `user.logout`
- `token.refreshed`

---

*Last Updated: 2026-02-28*
*API Version: 1.0*

# CoverCraft Premium + Safety + Privacy Features

Last reviewed: 2026-02-28

This file is a product roadmap-style feature catalog for both student (user) and admin sides.
It is based on current system capabilities in this repository (auth, profile, cover library, admin dashboard, university management, logo approval, analytics, broadcast, and shared cover links).

---

## Current Baseline (Already in Project)

- JWT auth with role-based access (`STUDENT`, `ADMIN`)
- Admin-only endpoints with database role verification
- Profile setup and university mapping
- Cover save/list/delete, duplicate/edit, share link
- Batch cover generation for class use
- Admin dashboard with user list, university CRUD, logo approval queue
- Template analytics and global broadcast
- Basic security headers and request rate limiting

---

## Premium Features: User Side

Priority legend: `P0` = immediate, `P1` = next, `P2` = later.

| Feature Name | Priority | Why It Matters |
|---|---:|---|
| `Cover Version History` | P0 | Restore any previous edit of a saved cover. |
| `Smart Folders & Tags` | P0 | Organize covers by semester/course quickly. |
| `Private Share Link Controls` | P0 | Add link expiry, password, one-time access. |
| `Submission Pack Export` | P1 | One-click ZIP: cover + source data + timestamp note. |
| `Offline Draft Mode (PWA Sync Queue)` | P1 | Work without internet, auto-sync when online. |
| `University Brand Kit Auto-Apply` | P1 | Auto apply logos/colors/layout rules per university. |
| `Class Workspace (CR/Group)` | P1 | Team-level library for multiple students/sections. |
| `AI Field Assistant` | P2 | Suggest title/format fixes and required fields. |
| `Premium Template Pack` | P2 | Paid modern templates, typography, print presets. |
| `Auto Reminder Engine` | P2 | Reminders for submission deadlines and revisions. |

---

## Premium Features: Admin Side

| Feature Name | Priority | Why It Matters |
|---|---:|---|
| `Admin Audit Trail` | P0 | Track who changed users/universities/broadcast/logos. |
| `Role Permission Matrix` | P0 | Separate `Super Admin`, `Moderator`, `Support` access. |
| `Abuse & Spam Risk Score` | P0 | Flag suspicious users/covers automatically. |
| `University Verification Workflow` | P1 | Multi-step review for logo + metadata + ownership. |
| `Template Performance Analytics` | P1 | Compare conversion by template/university/semester. |
| `Operational Alerts Center` | P1 | Notify failed PDF generation, API errors, queue spikes. |
| `Mass User Action Tools` | P2 | Batch suspend, restore, export compliance reports. |
| `Feature Flag Console` | P2 | Roll out new features safely by user segment. |
| `Tenant/Institution Billing` | P2 | Paid institution plans and usage quotas. |
| `Support Desk Panel` | P2 | Ticketing + impersonation-safe troubleshooting mode. |

---

## Safety & Privacy Features (Recommended)

| Feature Name | Priority | Type |
|---|---:|---|
| `Session Management Page` (view/revoke devices) | P0 | Account Safety |
| `Email Verification + Password Reset OTP` | P0 | Account Safety |
| `2FA (TOTP)` for admin and optional users | P0 | Account Safety |
| `Refresh Token Rotation + Token Revocation` | P0 | Auth Hardening |
| `PII Data Retention Policy` (auto-clean old records) | P0 | Privacy |
| `Right-to-Delete & Data Export` (self-service) | P1 | Privacy Compliance |
| `Signed Download URLs` with short expiry | P1 | Data Protection |
| `File Upload Security Scan` for logos | P1 | Platform Safety |
| `Immutable Security Logs` (append-only) | P1 | Incident Response |
| `Secret Vault + Key Rotation Policy` | P1 | Infrastructure Security |
| `WAF/Captcha on Auth Endpoints` | P2 | Abuse Protection |
| `At-Rest Encryption for Sensitive Fields` | P2 | Privacy |

---

## Suggested Delivery Plan

### Phase A (2-4 weeks)
- Session management
- Email verification and reset OTP
- Admin audit trail
- Private share link controls
- Cover version history

### Phase B (4-8 weeks)
- 2FA (admin first)
- University verification workflow
- Signed URLs + upload security scan
- Smart folders/tags
- Template performance analytics

### Phase C (8-12 weeks)
- Offline draft sync (PWA queue)
- Class workspace
- Feature flag console
- Data export/delete self-service
- Premium template and billing modules

---

## Notes for Implementation

- Keep feature rollout behind flags to avoid breaking current flows.
- Add automated API tests for all admin actions and delete flows.
- Add structured security logging before advanced moderation features.
- Define privacy policy and retention windows before launching premium collaboration.

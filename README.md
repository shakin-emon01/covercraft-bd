# CoverCraft BD

**Academic cover page generator for Bangladeshi universities**

A full-stack monorepo application that helps students create professional, customizable academic covers for assignments and lab reports. Features multiple design templates, color palettes, authentication, user profiles, and server-side PDF generation with Puppeteer.

---

## 🧭 Feature Roadmap

- Premium, safety, and privacy feature catalog: [FEATURES_README.md](./FEATURES_README.md)

---

## 📁 Project Structure

```
covercraft-bd/
├── apps/
│   ├── server/                          # Express.js Backend API
│   │   ├── src/
│   │   │   ├── index.ts                 # Main server entry point
│   │   │   ├── constants/
│   │   │   │   └── template-catalog.ts  # 15 templates + 8 color palettes
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts   # Register, login, Google OAuth, JWT validation
│   │   │   │   ├── cover.controller.ts  # Create, list, delete covers; PDF generation
│   │   │   │   ├── profile.controller.ts# User academic profile management
│   │   │   │   ├── template.controller.ts# List available templates
│   │   │   │   ├── university.controller.ts# University list and lookup
│   │   │   │   └── admin.controller.ts  # Admin stats, users, covers, university sync
│   │   │   ├── middleware/
│   │   │   │   └── auth.middleware.ts   # JWT authentication & role-based access
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts       # /api/auth/*
│   │   │   │   ├── cover.routes.ts      # /api/covers/*
│   │   │   │   ├── profile.routes.ts    # /api/profile/*
│   │   │   │   ├── template.routes.ts   # /api/templates/*
│   │   │   │   ├── university.routes.ts # /api/universities/*
│   │   │   │   └── admin.routes.ts      # /api/admin/*
│   │   │   ├── services/
│   │   │   │   └── pdf.service.ts       # Puppeteer PDF generation (server-side)
│   │   │   └── lib/
│   │   │       └── prisma.ts            # Prisma ORM client
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # Database schema (User, Profile, Cover, University)
│   │   │   ├── migrations/              # Database migration files
│   │   │   └── seed.ts                  # Database seeding script
│   │   ├── dist/                        # Compiled JavaScript (auto-generated)
│   │   ├── package.json                 # Server dependencies
│   │   ├── tsconfig.json                # TypeScript configuration
│   │   └── prisma.config.ts             # Prisma CLI config
│   │
│   └── web/                             # React + Vite Frontend
│       ├── src/
│       │   ├── main.tsx                 # App bootstrap with Google OAuth provider
│       │   ├── App.tsx                  # Router setup
│       │   ├── index.css                # Global styles
│       │   ├── App.css                  # Root component styles
│       │   ├── api/
│       │   │   └── auth.ts              # Axios client with JWT interceptor
│       │   ├── store/
│       │   │   └── authStore.ts         # Zustand auth state (user, token, logout)
│       │   ├── hooks/
│       │   │   └── useViewport.ts       # Responsive design hook (mobile, tablet, desktop)
│       │   ├── types/
│       │   │   └── jsx-modules.d.ts     # JSX module declarations
│       │   ├── pages/
│       │   │   ├── Login.tsx            # Email/password + Google OAuth login
│       │   │   ├── Register.jsx         # User registration form
│       │   │   ├── Dashboard.jsx        # Main dashboard (view covers, create new)
│       │   │   ├── ProfileSetup.jsx     # Student profile: university, department, semester
│       │   │   ├── CoverDesigner.jsx    # Main designer (15 templates, 8 palettes, form fields, PNG/PDF export)
│       │   │   └── PrintView.jsx        # Clean A4 view for Puppeteer PDF capture
│       │   └── assets/
│       │       └── react.svg
│       ├── public/
│       │   └── vite.svg
│       ├── index.html                   # HTML entry point
│       ├── .env                         # Frontend environment variables
│       ├── vite.config.ts               # Vite build configuration
│       ├── tsconfig.json                # TypeScript config
│       ├── tsconfig.app.json            # App-specific TS config
│       ├── tsconfig.node.json           # Build TS config
│       ├── eslint.config.js             # ESLint rules
│       ├── package.json                 # Frontend dependencies
│       └── README.md                    # Frontend setup guide
│
├── docs/
│   └── PROJECT_EXECUTION_PLAN.md        # Detailed project plan
│
├── .env                                 # Root environment variables
├── .gitignore                           # Git ignore patterns
├── package.json                         # Workspace root scripts
├── pnpm-lock.yaml                       # Dependency lock file
├── pnpm-workspace.yaml                  # pnpm workspace configuration
├── start.ps1                            # Windows helper script (kills port 5000, launches both servers)
└── README.md                            # This file
```

---

## 🏗️ Architecture

### Backend (`apps/server`)

**Stack:** Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL

- **RESTful API** with 6 route modules
- **Authentication:** JWT tokens + role-based access control (STUDENT, ADMIN)
- **Database:** PostgreSQL with Prisma migrations
- **PDF Generation:** Server-side rendering via Puppeteer
- **Port:** 5000

**Key Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Google OAuth callback
- `GET /api/universities` - List all universities
- `GET /api/templates` - List cover templates
- `POST /api/covers` - Save cover data
- `POST /api/covers/generate` - Generate and save cover
- `GET /api/covers/:id/download?format=pdf` - Download PDF (Puppeteer)
- `GET /api/profile` - User academic profile
- `GET /api/admin/*` - Admin dashboard stats

### Frontend (`apps/web`)

**Stack:** React 19, Vite 8 (beta), TypeScript, React Router, Zustand, Axios

- **Single Page Application** with client-side routing
- **State Management:** Zustand (auth, user data)
- **Form Handling:** Controlled inputs with real-time validation
- **Design System:** Inline CSS styling with theme support
- **Export:** PNG (html2canvas) + PDF (server-side via Puppeteer)
- **Port:** 5173

**Key Pages:**
- `/login` - Email/password + Google login
- `/register` - New user registration
- `/profile/setup` - Student profile configuration
- `/dashboard` - Cover history and create new
- `/create` - Cover designer with 15 templates
- `/print/:id` - Clean A4 view for server PDF capture

### Database Schema

```prisma
User
 ├── id (String, UUID)
 ├── email (String, unique)
 ├── name (String)
 ├── passwordHash (String?, nullable)
 ├── googleId (String?, nullable)
 ├── role (Enum: STUDENT | ADMIN)
 ├── profile (Profile?, one-to-one)
 ├── covers (Cover[], one-to-many)
 └── timestamps (createdAt, updatedAt)

Profile
 ├── id (String, UUID)
 ├── userId (String, FK → User)
 ├── studentId (String)
 ├── department (String)
 ├── semester (String)
 ├── session (String)
 ├── universityId (String, FK → University)
 └── timestamps (createdAt, updatedAt)

University
 ├── id (String, UUID)
 ├── name (String)
 ├── shortName (String, unique)
 ├── logoUrl (String)
 ├── type (Enum: PUBLIC | PRIVATE)
 ├── profiles (Profile[], one-to-many)
 └── createdAt (DateTime)

Cover
 ├── id (String, UUID)
 ├── userId (String, FK → User)
 ├── templateId (String, 1-15)
 ├── coverData (JSON, form fields)
 ├── pngUrl (String?, nullable)
 ├── pdfUrl (String?, nullable)
 └── createdAt (DateTime)
```

---

## 🎨 Cover Templates (15 Total)

| ID | Name | Description | Decorator |
|----|------|-------------|-----------|
| 1 | Academic Precision | Formal serif layout inspired by classic styles | Classic |
| 2 | Sophisticated Student | Soft elegant wave with refined academic spacing | Wave |
| 3 | Polished Modern Tech | Modern geometric sidebar with cards | Sidebar |
| 4 | Classic Scholarly Frame | Traditional framed composition | Frame |
| 5 | Minimal Academic Prestige | Double-line clean premium layout | Minimal |
| 6 | Modern Luxury Academic | Clean luxury heading with decorative accents | Luxury |
| 7 | Bold Geometric Academic | Angular high-impact visual hierarchy | Geometric |
| 8 | Organic Academic Elegance | Nature-inspired curves with formal structure | Organic |
| 9 | Southeast Ribbon | Blue border with bold ribbon title | Southeast |
| 10 | Dhaka Heritage | Classic monochrome center-aligned composition | Dhaka |
| 11 | Rajshahi Split Panel | Two-column submitted-by/submitted-to layout | Rajshahi |
| 12 | Leading Emerald | Green framed layout with alternating cards | Leading |
| 13 | Minimal Gray Print | Soft gray printable structure | Print |
| 14 | Modern Luxury | Minimalist layout with elegant accents | Luxury Modern |
| 15 | Bold Geometric | Strong geometric blocks with bold hierarchy | Geometric Bold |

**Color Palettes (8 Total):**
Blue, Green, Maroon, Purple, Teal, Navy, Brown, Slate

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm 10+
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment variables
# Copy .env template and fill in DATABASE_URL, JWT_SECRET, etc.
```

### Run Development Servers

**Option 1: Both servers (from root)**
```bash
pnpm dev
```

**Option 2: Individual servers**
```bash
# Terminal 1: Backend
pnpm dev:server

# Terminal 2: Frontend
pnpm dev:web
```

**Option 3: Windows helper (runs in separate PowerShell windows)**
```bash
.\start.ps1
```

### Build for Production

```bash
pnpm build
```

### Database Operations

```bash
# Run migrations
pnpm --filter server prisma migrate dev

# Seed initial data
pnpm seed

# Type-check all apps
pnpm typecheck
```

---

## 📦 Key Dependencies

### Backend
- **express** - Web framework
- **@prisma/client** - ORM
- **puppeteer** - Server-side PDF generation
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - CORS middleware

### Frontend
- **react** - UI library
- **react-router-dom** - Client routing
- **zustand** - State management
- **axios** - HTTP client
- **html2canvas** - PNG export
- **@react-oauth/google** - Google OAuth

---

## 🔄 PDF Generation Flow

1. **Designer Component** (CoverDesigner.jsx)
   - User fills form and selects template
   - Clicks "Download PDF" button
   - Saves cover data to backend

2. **Backend** (cover.controller.ts)
   - Receives cover ID
   - Spawns Puppeteer browser instance
   - Navigates to `/print/:id`

3. **PrintView Page** (PrintView.jsx)
   - Fetches cover data from backend
   - Renders clean CoverPage without UI
   - Puppeteer captures DOM as A4 PDF

4. **Download**
   - Backend streams PDF to frontend
   - Browser auto-downloads as `CoverCraft-{courseCode}.pdf`

---

## 🛠️ Development Workflow

1. **Port Management**
   - Backend: 5000
   - Frontend: 5173
   - Use `.\start.ps1` to auto-manage ports

2. **Hot Reload**
   - Frontend: Vite HMR (instant)
   - Backend: Nodemon watches `.ts` files

3. **API Testing**
   - Use Postman or PowerShell
   - JWT token: retrieve from auth/register or auth/login
   - Add `Authorization: Bearer {token}` header

4. **Git Workflow**
   ```bash
   git add .
   git commit -m "Feature: description"
   git push origin main
   ```

---

## 📋 Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://user:password@host:port/db
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

### Frontend (`apps/web/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 📝 Scripts (Root)

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Run web + server in parallel |
| `pnpm dev:web` | Frontend only |
| `pnpm dev:server` | Backend only |
| `pnpm build` | Build web + server |
| `pnpm seed` | Seed database |
| `pnpm typecheck` | Validate TypeScript |

---

## 🌟 Next-Level Feature Roadmap

### Product Features (High Impact)
- University-specific smart forms (auto-required fields by university + department).
- Group cover mode (multiple students in one cover with role order).
- Draft autosave + version history + restore previous versions.
- Batch generation (create many covers from CSV in one click).
- Reusable preset profiles (Exam cover, Lab cover, Thesis cover presets).

### Premium Export & Print Quality
- Server-side PNG rendering (same fidelity as PDF).
- ZIP export bundle (PDF + PNG + metadata JSON).
- Print-safe validation (A4 bleed, margin warning, overflow detection).
- Optional QR code verification block (cover metadata + timestamp).

### Admin & Operations
- Logo approval workflow (upload, preview, approve/reject, rollback).
- University sync log with status and retry actions.
- Render queue dashboard (pending, processing, failed, completed).
- Per-template usage analytics + failure analytics.

### Security & Reliability
- End-to-end schema validation (`zod`) for all request payloads.
- Rate limiting + abuse protection for auth/export endpoints.
- Audit log for admin actions (who changed logo/template/role and when).
- Signed URL strategy for private downloads in production.

### UX & Growth
- Full bilingual UI (English + Bangla switch).
- PWA support (installable app + offline draft editing).
- Shareable read-only cover links.
- Accessibility modes (high contrast, keyboard-first navigation, larger text mode).

### Suggested Execution Order
1. Print-safe validation + server-side PNG + draft autosave.
2. Admin approval workflow + audit logs + rate limiting.
3. Batch generation + group cover mode + analytics.
4. PWA + bilingual UI + shareable links.

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with `pnpm dev` running
3. Commit: `git commit -m "Feature: description"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

---

## 📄 License

ISC

---

## 📞 Support

For issues or questions:
1. Check [PROJECT_EXECUTION_PLAN.md](docs/PROJECT_EXECUTION_PLAN.md) for detailed documentation
2. Review [apps/web/README.md](apps/web/README.md) for frontend setup
3. Verify environment variables and port availability
4. Check server logs: `pnpm dev:server`

---

**Last Updated:** February 28, 2026  
**Version:** 1.0.0

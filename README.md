# CampusCoder — Student Coding Community Platform 🚀

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CampusCoder** is an end-to-end, student-led developer community platform built for engineering universities and tech clubs. It powers event discovery and RSVPs, real-time photo memories with one-click bulk ZIP downloads, curated engineering notes and handbooks, student project showcases, automated transactional emails, and a comprehensive admin management console.

---

## 🌟 Key Features

### 🎓 1. Student Portal
- **Events & Sprints Directory**: Filter upcoming and completed workshops, hackathons, coding challenges, orientations, and webinars.
- **Interactive Event RSVP**: One-click event registration with instant database validation, duplicate prevention, and seat tracking.
- **Event Photo Memories & Lightbox**:
  - Full-screen high-resolution photo slideshow with zoom and keyboard navigation (`Left`, `Right`, `Escape`).
  - **Single Photo Download**: Download any individual image with automatic naming.
  - **One-Click Bulk ZIP Download**: Download an entire event's photo album bundled into a `.zip` file generated directly in the browser via `JSZip`.
- **Engineering Notes & Resources Library**: Verified course notes, interview prep materials, syllabus handbooks, and developer cheat sheets.
- **Project Showcase**: Student portfolio showcase to submit and view peer projects, live demos, and GitHub repositories.
- **Competitions & Coding Challenges**: Live and upcoming coding challenges with guidelines and registration links.
- **Authentication & Security**: Email OTP verification, secure password reset, protected student dashboard, and customizable profile settings.

### 🛡️ 2. Admin Management Console
- **Sprint & Event Management**: Create, edit, and publish events with rich markdown descriptions, banner uploads, and multi-speaker assignments.
- **Event Photo Gallery Uploads**: Upload multiple event photos in batch to Supabase Storage or paste remote image URLs with instant preview and deletion.
- **Meeting Link Broadcasts**: Send automated Google Meet / Zoom meeting links with dynamic dates and times to all registered attendees with a single click.
- **Project Submissions Approval**: Review, approve, or reject student project submissions with automated email receipts.
- **Community Socials & Announcements**: Broadcast campus announcements and manage active Discord, WhatsApp, GitHub, and LinkedIn links.
- **Role-Based Access Control (RBAC)**: Secure access control for `student`, `organizer`, and `admin` roles via Supabase Auth and JWT session middleware.

### ⚡ 3. Backend & Email Pipeline
- **RESTful API**: Clean Express.js backend with TypeScript, input sanitization, and Zod schema validation.
- **Dual-Provider Email System**: Automated transactional emails powered by **Resend** and **Azure Communication Services**.
- **Dynamic Registration Confirmations**: Emails sent immediately to students containing full event details (title, formatted date, 12-hour AM/PM time, venue/mode instructions, attendee summary, and community join links).
- **Background Queue Worker**: Concurrency-controlled, non-blocking queue for email delivery and batch notifications with automatic retry safeguards.
- **High-Performance Caching**: Redis integration with automatic in-memory fallback for ultra-fast query responses.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [JSZip](https://stuk.github.io/jszip/), [Sonner](https://sonner.emilkowal.ski/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/), [Zod](https://zod.dev/), [Multer](https://github.com/expressjs/multer) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security, Supabase Auth, Storage Buckets) |
| **Caching** | [Redis](https://redis.io/) (`ioredis`) with memory fallback |
| **Email Services** | [Resend](https://resend.com/) & [Azure Communication Services](https://azure.microsoft.com/en-us/products/communication-services) with React Server markup templates |
| **Testing** | [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/) (E2E), [ESLint](https://eslint.org/) |

---

## 📁 Repository Structure

```text
CampusCoder/
├── backend/                       # Node.js Express REST API
│   ├── src/
│   │   ├── components/emails/     # React email templates (Registration, Admin, OTP, etc.)
│   │   ├── lib/                   # Email clients, queue worker, cache, formatters
│   │   ├── middleware/            # Auth, RBAC, and rate limiting middleware
│   │   ├── routes/                # API routes (events, notes, showcase, admin, auth, upload)
│   │   ├── types/                 # Database types and interfaces
│   │   └── server.ts              # Express application entry point
│   ├── supabase/migrations/       # 18 PostgreSQL migrations (RLS, schema, triggers, photos)
│   └── package.json
│
├── frontend/                      # Next.js App Router Web Application
│   ├── src/
│   │   ├── app/                   # App Router pages (events, notes, admin, dashboard, auth)
│   │   ├── components/            # UI components, layout, animations, event photo gallery
│   │   │   └── events/            # EventPhotoGallery, EventPhotoLightbox
│   │   ├── data/                  # Static definitions & tests
│   │   ├── lib/                   # API client, downloadZip, eventPhotos, validation
│   │   └── types/                 # Shared frontend TypeScript interfaces
│   └── package.json
│
├── docs/                          # Detailed Guides & System Architecture
│   ├── api_reference.md           # Full REST API endpoint reference
│   ├── architecture.md            # System architecture & data flow diagrams
│   ├── aws-deployment.md          # Free-tier AWS EC2 deployment guide
│   ├── email_setup.md             # Resend & Azure email configuration
│   ├── security_audit.md          # Security & RLS audit documentation
│   └── supabase_setup.md          # Step-by-step database setup & migration guide
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18.0 or later (v20+ recommended)
- **npm** or **pnpm**
- **Supabase Account**: [supabase.com](https://supabase.com) (Free Tier)
- **Resend Account**: [resend.com](https://resend.com) (Free Tier)

---

### 1. Clone the Repository

```bash
git clone https://github.com/bharatbushan03/CampusCoder.git
cd CampusCoder
```

---

### 2. Configure Environment Variables

#### Backend Configuration (`backend/.env`):
Create `backend/.env` (see `backend/.env.example`):
```env
PORT=4000
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Email Dispatch
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=CampusCoder <onboarding@resend.dev>
ADMIN_EMAIL=admin@yourcollege.edu

# Optional Redis Cache (falls back to memory if omitted)
REDIS_URL=redis://localhost:6379

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

#### Frontend Configuration (`frontend/.env.local`):
Create `frontend/.env.local` (see `frontend/.env.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### 3. Database Setup (Supabase)

1. Navigate to your **Supabase Dashboard** -> **SQL Editor**.
2. Run the database migration files in `backend/supabase/migrations/` in numerical order starting with `20260529000000_init_schema.sql`.
3. Create public Storage Buckets:
   - `event-banners`
   - `event-photos`
   - `project-submissions`
4. For detailed database instructions, refer to [docs/supabase_setup.md](./docs/supabase_setup.md).

---

### 4. Install Dependencies & Start Servers

#### Start Backend (Terminal 1):
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:4000`*

#### Start Frontend (Terminal 2):
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 🧪 Testing & Code Quality

### Frontend:
```bash
cd frontend

# Run Vitest unit tests
npm run test:unit

# Run TypeScript type verification
npm run type-check

# Run ESLint validation
npm run lint
```

### Backend:
```bash
cd backend

# Run TypeScript type check
npm run type-check

# Run linter
npm run lint
```

---

## 📚 Documentation & Guides

- [System Architecture & Data Flows](./docs/architecture.md)
- [REST API Reference & Schemas](./docs/api_reference.md)
- [Supabase Database & Migrations Setup](./docs/supabase_setup.md)
- [Email System Setup (Resend & Azure)](./docs/email_setup.md)
- [Free-Tier AWS EC2 Deployment Guide](./docs/aws-deployment.md)
- [Security & RLS Audit](./docs/security_audit.md)

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).

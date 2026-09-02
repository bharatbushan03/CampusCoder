# System Architecture & Technical Design

This document details the architectural layout, core subsystems, data flows, and security models governing the **CampusCoder** platform.

---

## 🏗️ High-Level System Architecture

```text
                               ┌─────────────────────────────────────────┐
                               │             Client Browsers             │
                               │      (Students, Admins, Organizers)     │
                               └────────────────────┬────────────────────┘
                                                    │
                                     HTTPS / JSON   │   Static Assets
                                                    ▼
                       ┌─────────────────────────────────────────────────────────┐
                       │                   Next.js 15 App Router                 │
                       │                (SSR, CSR, React 19 UI)                  │
                       └──────────────┬───────────────────────────┬──────────────┘
                                      │                           │
                   REST API Calls     │                           │ Direct Auth /
                   (Sanitized)        ▼                           │ Token Validation
                       ┌─────────────────────────┐                │
                       │     Node.js Express     │                ▼
                       │      REST API Server    │        ┌───────────────┐
                       │  (TypeScript, Port 4000)│        │   Supabase    │
                       └──────────────┬──────────┘        │     Auth      │
                                      │                   └───────┬───────┘
                     ┌────────────────┼────────────────┐          │
                     │                │                │          │
                     ▼                ▼                ▼          ▼
            ┌────────────────┐ ┌─────────────┐ ┌──────────────┐ ┌───────────────┐
            │  PostgreSQL    │ │ Redis Cache │ │ Resend / ACS │ │   Supabase    │
            │  (Supabase DB) │ │ (ioredis)   │ │ Email Queue  │ │ Storage Bins  │
            │  (RLS Enabled) │ └─────────────┘ └──────────────┘ └───────────────┘
            └────────────────┘
```

---

## 🧩 Core Architectural Components

### 1. Frontend Layer (`frontend/`)
- **Next.js 15 App Router**: Server Components (RSC) for metadata generation and SEO, coupled with interactive Client Components (`'use client'`) for dynamic views.
- **Client-Side ZIP Generation**: Utilizes `JSZip` in `frontend/src/lib/downloadZip.ts` to bundle multiple remote image Blobs directly in the user's browser without placing compute or bandwidth load on the backend.
- **State Management & Notifications**: Lightweight local React state + `sonner` toasts for responsive feedback.
- **Responsive Animations & Modals**: Fluid animations using Tailwind CSS utility classes and dedicated lightbox portals (`EventPhotoLightbox.tsx`).

### 2. Backend Layer (`backend/`)
- **Express.js with TypeScript**: Modular routing architecture separated into domain controllers (`events.ts`, `notes.ts`, `showcase.tsx`, `admin.ts`, `auth.ts`, `upload.ts`, `emails.tsx`).
- **Data Validation & Sanitization**: Strict input validation using `Zod` schemas and text sanitization to prevent XSS and SQL injection.
- **Background Task Worker (`backend/src/lib/queue.ts`)**: In-memory task queue that executes transactional email dispatches, audit logs, and external notifications asynchronously.
- **Multi-Level Caching**: Redis-backed cache layer for high-read public endpoints (such as active events, notes, and community links) with transparent fallback to in-memory caching if Redis is unavailable.

### 3. Database & Security Layer (Supabase PostgreSQL)
- **Row Level Security (RLS)**: Fine-grained security policies ensure that students can only access their own private profile and registration records, while public event listings are readable by everyone and admin mutations require explicit `admin` or `organizer` claims.
- **Automated Profile Triggers**: PostgreSQL trigger `on_auth_user_created` automatically provisions user profiles on new Supabase Auth registrations.
- **Storage Buckets**: Secured object storage with MIME-type constraints and size limits for event banners, event photo galleries, and student project screenshots.

### 4. Transactional Email Pipeline
- **Template Rendering**: Uses React component trees (`RegistrationConfirmation.tsx`, `AdminNotification.tsx`, `MeetingLinkAnnouncement.tsx`, etc.) rendered to static HTML markup on the fly via `react-dom/server`.
- **Dual-Provider Failover**: Automatically prioritizes **Resend** for transactional email deliverability and supports **Azure Communication Services** as a secondary failover provider.

---

## 🔄 End-to-End Data Flows

### A. Event Registration Flow
1. **Student RSVP**: Student submits registration form on `/events/[slug]`.
2. **Input Validation**: Backend validates payload using `registrationSchema` (validates email syntax, college, branch, and graduation year).
3. **Database Guardrails**: Checks event status (`published`), deadline timestamp, and checks for duplicate registrations using composite index `(event_id, email)`.
4. **Record Insertion**: Saves registration record to `public.registrations`.
5. **Background Email Dispatch**: Backend queues personalized `RegistrationConfirmationEmail` with formatted date, time, venue, attendee summary, and community links to the student, and sends `AdminNotificationEmail` to the community admin.
6. **Instant Response**: Returns `{ ok: true, success: true }` to client immediately (< 100ms response time).

### B. Event Photo Gallery & ZIP Download Flow
1. **Photo Viewing**: Students browse photo gallery thumbnails on the event details page or click `"📷 Photos"` on any event card.
2. **Lightbox Viewing**: Lightbox modal loads high-resolution photo with navigation keys (`Left`, `Right`, `Esc`) and zoom controls.
3. **Single Download**: Fetch image as Blob and invoke `URL.createObjectURL(blob)` to trigger native browser download.
4. **Bulk ZIP Download**: `JSZip` iteratively fetches all event photos as ArrayBuffers with progress reporting, packages them into `[event-slug]-photos.zip`, and triggers a single archive download.

---

## 🔒 Security & RBAC Matrix

| Role | Permissions |
|---|---|
| **Anonymous (Public)** | View published events, event photo memories, active community links, verified notes, submit event RSVPs, sign up / login. |
| **Student (Authenticated)** | View own dashboard, update own profile details, submit showcase projects, request password reset with OTP. |
| **Organizer** | Create and edit events, upload event photos, broadcast meeting links to attendees, view registered attendees list. |
| **Admin** | Full system control: Manage all events, delete registrations, approve/reject project submissions, update community links, post announcements, manage user roles. |

# Transactional Email System Setup (Resend & Azure)

CampusCoder features an automated transactional email dispatch engine that delivers personalized notifications, confirmation receipts, OTP verification codes, and meeting link announcements.

---

## 📧 Supported Email Providers

The backend uses a dual-provider architecture defined in `backend/src/lib/email.ts`:

1. **Resend (Primary)**: High deliverability and real-time dashboard analytics.
2. **Azure Communication Services (Failover)**: Enterprise-grade secondary email service.

---

## 🛠️ Step-by-Step Configuration

### 1. Resend Setup (Recommended)

1. Sign up for a free account at **[resend.com](https://resend.com)**.
2. Navigate to the **API Keys** section in your Resend Dashboard.
3. Click **Create API Key** with **Full Access**.
4. Copy the API key (format: `re_...`).
5. Add to `backend/.env`:
   ```env
   RESEND_API_KEY=re_123456789...
   FROM_EMAIL=CampusCoder <onboarding@resend.dev>
   ADMIN_EMAIL=admin@yourcollege.edu
   ```

### 2. Custom Domain Verification (Production)

For production deliverability, configure your custom university or organization domain in Resend:
1. Go to **Domains** -> **Add Domain** (e.g. `campuscoder.org` or `mail.college.edu`).
2. Add the generated DNS records to your domain registrar / DNS manager:
   - **DKIM (CNAME / TXT)**
   - **SPF (TXT)**
   - **DMARC (TXT)**
3. Once verified, update `FROM_EMAIL` in `backend/.env`:
   ```env
   FROM_EMAIL=CampusCoder <team@campuscoder.org>
   ```

---

## 📬 Email Templates Catalog

All email templates are built with React and rendered server-side with inline styles in `backend/src/components/emails/`:

| Template | File | Purpose | Recipient |
|---|---|---|---|
| **Registration Confirmation** | `RegistrationConfirmation.tsx` | Instant RSVP confirmation with event name, dynamic date, 12-hr time, venue/mode instructions, attendee summary, and community links. | Registered Student |
| **Admin Registration Alert** | `AdminNotification.tsx` | Real-time notification when a student RSVPs. | Community Lead / Admin |
| **Meeting Link Broadcast** | `MeetingLinkAnnouncement.tsx` | Live session link (Google Meet / Zoom) sent to all registered attendees before sprint starts. | All Event Attendees |
| **Email OTP Verification** | `OtpVerificationEmail.tsx` | 6-digit one-time password for student registration and account verification. | Student |
| **Password Reset** | `PasswordResetEmail.tsx` | Secure password reset token instructions. | Student |
| **Project Submission Receipt** | `ProjectSubmissionReceipt.tsx` | Confirmation when a student submits a project to the showcase. | Student |
| **Project Admin Alert** | `ProjectSubmissionNotification.tsx` | Alert for admins to review and approve new student portfolio submissions. | Admin |

---

## ⚙️ Background Queue Worker

Email dispatches are processed asynchronously by `backgroundQueue` in `backend/src/lib/queue.ts`:
- **Zero Request Latency**: Web API endpoints return within 50ms without waiting for third-party SMTP/HTTP roundtrips.
- **Concurrency Control & Throttling**: Protects against rate limits during large batch announcements.
- **Automatic Retries**: Failed email deliveries are retried automatically up to 3 times.

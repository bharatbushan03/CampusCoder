# CampusCoder Community Portal

CampusCoder is a student-led virtual coding community hub. This portal manages event registrations, community announcements, social links, and automated student communications.

## 🚀 Key Features

-   **Admin Console:** Management of events, community links, and announcements.
-   **Event RSVP:** Secure registration flow with automated email confirmations.
-   **Supabase Backend:** Scalable PostgreSQL database with Row Level Security.
-   **Email System:** Real-time student notifications and admin alerts via Resend.
-   **Community Hub:** Dynamic social links and announcements for the student body.

## 🛠 Tech Stack

-   **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide React.
-   **Backend:** Supabase (Database, Auth, Storage).
-   **Email:** Resend.
-   **Icons:** Lucide React.

## 📖 Setup & Configuration

For detailed setup instructions, please refer to the documentation:

-   [Supabase Database Setup](./docs/supabase_setup.md)
-   [Email System Setup](./docs/email_setup.md)
-   [Free-Tier AWS EC2 Deployment Guide](./docs/aws-deployment.md)

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Check

Before deploying, run:

```bash
npm run production-check
```

For a charge-conscious AWS EC2 deployment, follow [docs/aws-deployment.md](./docs/aws-deployment.md).

## 📄 License

MIT

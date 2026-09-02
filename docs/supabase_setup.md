# Supabase Database Setup & Migration Guide

This guide walks you through applying all database migrations, configuring Row Level Security (RLS), setting up storage buckets, and configuring authentication triggers on your Supabase project.

---

## 1. Step-by-Step Migration Execution

To apply the database schema, follow these steps in your **Supabase Dashboard**:

1. Log into your **[Supabase Dashboard](https://app.supabase.com)** and open your project.
2. Select the **SQL Editor** tab from the left sidebar.
3. Click **New Query** -> **Blank Query**.
4. Open the SQL files located in `backend/supabase/migrations/` in numerical order:

| # | Migration File | Description |
|---|---|---|
| 1 | `20260529000000_init_schema.sql` | Core schema (`profiles`, `events`, `event_owners`, `registrations`, `community_links`, `announcements`), RLS policies, and profile trigger. |
| 2 | `20260529000001_add_meeting_sent_at.sql` | Adds `meeting_link_sent_at` timestamp tracking to `events`. |
| 3 | `20260529000002_add_resources_and_archive_fields.sql` | Adds `summary`, `recording_url` fields to `events` and creates `resources` table. |
| 4 | `20260529000003_add_unique_registration.sql` | Adds unique constraint `(event_id, email)` to `registrations` to prevent duplicate RSVPs. |
| 5 | `20260529000004_rls_hardening.sql` | Hardens RLS policies across all tables. |
| 6 | `20260529000005_add_rate_limiting.sql` | Adds rate limiting support functions. |
| 7 | `20260529000006_add_banner_storage_policies.sql` | Configures storage RLS policies for event banners. |
| 8 | `20260716000001_move_dsa_challenge_to_past.sql` | Updates challenge event statuses to past/completed. |
| 9 | `20260716203734_move_dsa_challenge_to_past_events.sql` | Synchronizes past event views. |
| 10 | `20260716203735_remove_dsa_challenge_registrations.sql` | Cleans up legacy test registration entries. |
| 11 | `20260717000000_allow_read_completed_events.sql` | Grants public read access for completed events in archive. |
| 12 | `20260823000000_create_showcase_projects.sql` | Creates `showcase_projects` table for student portfolios with approval workflows. |
| 13 | `20260823000001_create_email_otps.sql` | Creates `email_otps` table for secure password reset and OTP verification. |
| 14 | `20260823000002_cascade_profile_deletions.sql` | Adds cascading deletion triggers for user profiles. |
| 15 | `20260825000000_performance_indexes.sql` | Adds performance indexes on frequent filter columns (`slug`, `event_type`, `status`, `created_at`). |
| 16 | `20260830000000_create_competitions.sql` | Creates `competitions` table for university coding challenges and hackathons. |
| 17 | `20260830000001_create_notes.sql` | Creates `notes` table for engineering course handbooks and study notes. |
| 18 | `20260902000000_add_event_photos.sql` | Adds `photos text[] DEFAULT '{}'` to `events` table for photo galleries. |

5. Copy the SQL content from each file, paste it into the editor, and click **Run** (or `Ctrl + Enter`).
6. Confirm `Success. No rows returned.` after each file before running the next.

---

## 2. Storage Buckets Setup

Under **Supabase Dashboard** -> **Storage**:

1. Click **New Bucket**.
2. Create the following buckets with **Public** access enabled:
   - **`event-banners`**: Max file size: 5MB. Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`.
   - **`event-photos`**: Max file size: 10MB. Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`.
   - **`project-submissions`**: Max file size: 5MB. Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`.
   - **`notes-handbooks`**: Max file size: 25MB. Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`.

---

## 3. Row Level Security (RLS) Summary

| Table | Operation | Target Role / Condition | Purpose |
|---|---|---|---|
| **`profiles`** | `SELECT` | `id = auth.uid()` OR `role IN ('admin', 'organizer')` | Students view own profile; admins view all. |
| | `UPDATE` | `id = auth.uid()` | Students update own profile fields. |
| | `ALL` | `role = 'admin'` | Full administrative control. |
| **`events`** | `SELECT` | `status IN ('published', 'completed')` OR `role IN ('admin', 'organizer')` | Public views live & past events; admins view drafts. |
| | `ALL` | `role IN ('admin', 'organizer')` | Organizers & admins create/modify events. |
| **`registrations`** | `INSERT` | Public (`anon`, `authenticated`) | Anyone can register for open events. |
| | `SELECT` | `email = auth.email()` OR `role IN ('admin', 'organizer')` | Students see own RSVPs; admins see all attendees. |
| **`showcase_projects`** | `SELECT` | `status = 'approved'` OR `user_id = auth.uid()` OR `role = 'admin'` | Public sees approved projects; students see own drafts. |
| | `INSERT` | `authenticated` | Logged-in students can submit projects. |
| **`notes`** | `SELECT` | `is_verified = true` OR `role = 'admin'` | Public sees verified notes; admins manage all. |
| **`community_links`** | `SELECT` | `is_active = true` | Public reads active Discord/social links. |
| | `ALL` | `role = 'admin'` | Admin modifies socials. |
| **`announcements`** | `SELECT` | Public | Public reads community announcements. |
| | `ALL` | `role = 'admin'` | Admin broadcasts announcements. |

---

## 4. Promoting Your First Admin Account

1. Sign up for a normal account on your app (`http://localhost:3000/signup`).
2. In your Supabase Dashboard SQL Editor, run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```
3. Sign out and sign in again to receive the updated JWT claims and access the `/admin` portal.

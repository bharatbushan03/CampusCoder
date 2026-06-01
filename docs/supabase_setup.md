# Supabase Setup Guide - CampusCoder

This guide walks you through applying the SQL schema, triggers, and Row Level Security (RLS) policies to your Supabase project.

---

## 1. Apply Schema via Supabase SQL Editor

To apply the database schema, follow these steps in your Supabase project dashboard:

1. Go to your **Supabase Dashboard** -> Select your Project.
2. Click on the **SQL Editor** tab from the left sidebar.
3. Click **New Query** -> **Blank Query**.
4. Open the files in `supabase/migrations`.
5. Copy and run each migration file in filename order, starting with `20260529000000_init_schema.sql`.
6. Paste one migration at a time into the editor.
7. Click **Run** (or press `Ctrl + Enter` / `Cmd + Enter`).
8. You should see a success message such as `Success. No rows returned.` before running the next migration.

---

## 2. Dynamic Profiles Auto-Creation Trigger

We have implemented an automatic database trigger `on_auth_user_created` that listens to user sign-ups in Supabase Auth.
When a student registers an account:
1. Supabase Auth creates an entry in the secure `auth.users` table.
2. The trigger automatically creates a corresponding profile entry in the public `profiles` table.
3. The default user role is set to `student`.

### How to customize roles during sign-up
You can pass custom metadata from your frontend signup client (using the Supabase SDK) to specify fields:
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'student@college.edu',
  password: 'securepassword',
  options: {
    data: {
      full_name: 'Jane Doe',
      college: 'Engineering Campus',
      branch: 'Computer Science',
      year: '2028',
      role: 'student' // 'student', 'admin', or 'organizer'
    }
  }
});
```

---

## 3. Row Level Security (RLS) Policies Breakdown

All tables have Row Level Security enabled by default. Only users meeting the policies below can query or modify entries.

| Table | Operation | Allowed Role/Condition | Description |
|---|---|---|---|
| **profiles** | `SELECT` | User matches `id` OR Admin/Organizer | Students view their own profile; Admins see all. |
| | `UPDATE` | User matches `id` | Students edit their own profile fields. |
| | `ALL` | Admin/Organizer | Full console control. |
| **events** | `SELECT` | Status is `'published'` OR Admin/Organizer | Public views live events; Admins see drafts. |
| | `ALL` | Admin/Organizer | Edit or delete sprints. |
| **event_owners** | `SELECT` | Public | View speaker panels. |
| | `ALL` | Admin/Organizer | Add speakers. |
| **registrations** | `INSERT` | Public | Any student can register/RSVP. |
| | `SELECT` | Admin/Organizer OR Email matches Auth Email | Admins see all RSVPs; students see their own. |
| **community_links**| `SELECT` | Active links | Public views active community links. |
| | `ALL` | Admin/Organizer | Update discord/slack targets. |
| **announcements** | `SELECT` | Public | Public reads notifications. |
| | `ALL` | Admin/Organizer | Post new announcements. |

---

## 4. Environment Variables Needed

Create a `.env.local` file in your root folder (Next.js automatically loads it for local development, and it is excluded in `.gitignore`):

```bash
# Obtain these from Supabase Dashboard -> Connect or Project Settings -> API Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Recommended current public key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Server-only key for protected server actions. Never expose this publicly.
SUPABASE_SECRET_KEY=sb_secret_...

# Optional legacy names if your Supabase project only shows old JWT keys:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

*Warning: Never commit your `.env.local` file containing real credentials to GitHub. Always use `.env.example` as a template for other developers.*

## 5. Auth Redirect URLs

In Supabase Dashboard -> Authentication -> URL Configuration:

1. Set **Site URL** to `http://localhost:3000` for local development.
2. Add redirect URLs for local auth flows:
   - `http://localhost:3000`
   - `http://localhost:3000/reset-password`
3. When deployed, add your production domain and production reset password URL too.

## 6. Make Your First Admin

After creating your first account through `/signup`, promote that profile to admin from Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

Then sign out and sign in again before opening `/admin`.

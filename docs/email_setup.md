# Email System Setup (Resend)

CampusCoder uses [Resend](https://resend.com) for sending automated emails.

## Configuration Steps

### 1. Create a Resend Account
Sign up at [resend.com](https://resend.com) and create an account.

### 2. Get API Key
- Go to the **API Keys** section in the Resend dashboard.
- Create a new API Key with "Full Access".
- Copy the key (it starts with `re_`).

### 3. Verify Domain (Production)
For production, you should verify your own domain (e.g., `campuscoder.org`) in the **Domains** section of Resend.
- Add your domain.
- Configure the DNS records (DKIM, SPF) provided by Resend.
- Once verified, update `FROM_EMAIL` in `src/lib/email.ts`.

### 4. Configure Environment Variables
Add the following to your `.env.local` file:

```env
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Admin email for receiving registration notifications
ADMIN_EMAIL=your-email@example.com
```

## Email Templates
The system includes the following React-based templates in `src/components/emails/`:
- **Registration Confirmation:** Sent to students immediately after RSVP.
- **Admin Notification:** Sent to the community lead when a new registration occurs.
- **Meeting Link Announcement:** Triggered by admin to send the session URL to all attendees.
- **Event Reminder & Thank You:** Ready for future integration with scheduled cron jobs.

## Error Handling
- Emails are sent asynchronously via Server Actions.
- If email sending fails, the error is logged, but the **registration is still saved** in the database to ensure no student data is lost.
- Admin receives an alert in the console if an email blast fails.

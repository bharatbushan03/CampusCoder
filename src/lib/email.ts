import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@campuscoder.org';
export const FROM_EMAIL = 'CampusCoder <onboarding@resend.dev>'; // Default Resend test email or verified domain

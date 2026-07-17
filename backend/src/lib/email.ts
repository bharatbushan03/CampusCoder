import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bharatbushan5320@gmail.com';
export const FROM_EMAIL = process.env.FROM_EMAIL || 'CampusCoder <onboarding@resend.dev>';

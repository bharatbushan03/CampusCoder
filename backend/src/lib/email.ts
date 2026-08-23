import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EmailClient } from '@azure/communication-email';
import { Resend } from 'resend';

const azureConnectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const resendApiKey = process.env.RESEND_API_KEY;

export const azureEmailClient = azureConnectionString ? new EmailClient(azureConnectionString) : null;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bharatbushan5320@gmail.com';
export const AZURE_SENDER_EMAIL = process.env.AZURE_EMAIL_SENDER || 'DoNotReply@4cd68ee0-18b0-4412-a82c-535fa9c436b3.azurecomm.net';

let defaultFrom = process.env.FROM_EMAIL || 'CampusCoder <onboarding@resend.dev>';
if (defaultFrom.includes('@gmail.com') || defaultFrom.includes('@yahoo.com') || defaultFrom.includes('@hotmail.com') || defaultFrom.includes('@outlook.com')) {
  defaultFrom = 'CampusCoder <onboarding@resend.dev>';
}
export const FROM_EMAIL = defaultFrom;

export interface SendMailOptions {
  to: string;
  subject: string;
  react?: React.ReactElement;
  html?: string;
  plainText?: string;
}

export async function sendAppEmail(options: SendMailOptions): Promise<{ success: boolean; id?: string; error?: any }> {
  const { to, subject, react, plainText } = options;
  let html = options.html;

  if (react && !html) {
    try {
      html = renderToStaticMarkup(react);
    } catch (renderErr) {
      console.error('[Email] Failed to render React template:', renderErr);
    }
  }

  // 1. Prioritize Azure Communication Services if configured
  if (azureEmailClient) {
    try {
      const emailContent = html
        ? { subject, html, plainText: plainText || undefined }
        : { subject, plainText: plainText || subject };

      const poller = await azureEmailClient.beginSend({
        senderAddress: AZURE_SENDER_EMAIL,
        content: emailContent,
        recipients: {
          to: [{ address: to }],
        },
      });

      const response = await poller.pollUntilDone();
      if (response.status === 'Succeeded') {
        console.log(`[Azure Email] Email delivered to ${to} (ID: ${response.id})`);
        return { success: true, id: response.id };
      } else {
        console.error('[Azure Email] Send status:', response.status, response.error);
        return { success: false, error: response.error };
      }
    } catch (azureErr: any) {
      console.error('[Azure Email] Exception:', azureErr.message);
      // Fall through to Resend if available
    }
  }

  // 2. Fallback to Resend if configured
  if (resend) {
    try {
      const res = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        ...(react ? { react } : { html: html || '' }),
      });

      if (res.error) {
        console.error('[Resend Email] Send error:', res.error);
        return { success: false, error: res.error };
      }

      console.log(`[Resend Email] Delivered to ${to} (ID: ${res.data?.id})`);
      return { success: true, id: res.data?.id };
    } catch (resendErr: any) {
      console.error('[Resend Email] Exception:', resendErr);
      return { success: false, error: resendErr };
    }
  }

  console.warn(`[Email DEV] No email provider configured. (Subject: "${subject}", To: "${to}")`);
  return { success: false, error: 'No email service configured' };
}

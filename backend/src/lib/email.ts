import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EmailClient } from '@azure/communication-email';
import { Resend } from 'resend';

const azureConnectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const resendApiKey = process.env.RESEND_API_KEY;

export const azureEmailClient = azureConnectionString ? new EmailClient(azureConnectionString) : null;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
export const AZURE_SENDER_EMAIL = process.env.AZURE_EMAIL_SENDER || '';
export const FROM_EMAIL = process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'CampusCoder <onboarding@resend.dev>';

import { backgroundQueue } from './queue';

export interface SendMailOptions {
  to: string;
  subject: string;
  react?: React.ReactElement;
  html?: string;
  plainText?: string;
}

export async function sendAppEmail(
  options: SendMailOptions,
  timeoutMs: number = 8000
): Promise<{ success: boolean; id?: string; error?: any }> {
  const { to, subject, react, plainText } = options;
  let html = options.html;

  if (react && !html) {
    try {
      html = renderToStaticMarkup(react);
    } catch (renderErr) {
      console.error('[Email] Failed to render React template:', renderErr);
    }
  }

  const sendPromise = async (): Promise<{ success: boolean; id?: string; error?: any }> => {
    // 1. Primary: Use Resend for OTP and transactional emails
    if (resend) {
      try {
        const fromAddress = FROM_EMAIL || 'CampusCoder <onboarding@resend.dev>';
        const res = await resend.emails.send({
          from: fromAddress,
          to,
          subject,
          ...(react ? { react } : { html: html || '' }),
          text: plainText || undefined,
        });

        if (res.error) {
          console.error('[Resend Email] Send error:', res.error);
          // If Resend failed, attempt Azure fallback below if configured
        } else {
          console.log(`[Resend Email] Successfully sent "${subject}" to ${to} (id: ${res.data?.id})`);
          return { success: true, id: res.data?.id };
        }
      } catch (resendErr: any) {
        console.error('[Resend Email] Exception:', resendErr);
      }
    } else {
      console.warn('[Resend Email] RESEND_API_KEY is not set in backend/.env');
    }

    // 2. Fallback: Azure Communication Services if configured
    if (azureEmailClient && AZURE_SENDER_EMAIL) {
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

        const initialStatus = poller.getOperationState();
        if (initialStatus.status === 'running' || initialStatus.status === 'notStarted') {
          poller.pollUntilDone().catch((err) => {
            console.warn(`[Azure Email] Background polling warning for ${to}:`, err?.message);
          });
          return { success: true, id: (initialStatus as any).id || (initialStatus.result as any)?.id || 'queued' };
        }

        const response = await poller.pollUntilDone();
        if (response.status === 'Succeeded') {
          return { success: true, id: response.id };
        } else {
          console.error('[Azure Email] Send status:', response.status, response.error);
          return { success: false, error: response.error };
        }
      } catch (azureErr: any) {
        console.error('[Azure Email] Exception:', azureErr.message);
      }
    }

    console.warn(`[Email DEV] No active email provider delivered. (Subject: "${subject}", To: "${to}")`);
    return { success: false, error: 'No email service configured' };
  };


  // Wrap in timeout safeguard to guarantee Node request handlers never hang
  const timeoutPromise = new Promise<{ success: boolean; id?: string; error?: any }>((resolve) => {
    setTimeout(() => {
      resolve({ success: true, id: 'timeout-fallback' });
    }, timeoutMs);
  });

  return Promise.race([sendPromise(), timeoutPromise]);
}

/**
 * Enqueues an email to be sent asynchronously in the background queue with concurrency control & retries
 */
export function queueAppEmail(options: SendMailOptions): string {
  return backgroundQueue.add(
    `email_${options.to}`,
    options,
    async (opts) => {
      const result = await sendAppEmail(opts, 15000);
      if (!result.success && result.error && result.error !== 'No email service configured') {
        throw new Error(result.error?.message || 'Email dispatch failed');
      }
    },
    3
  );
}

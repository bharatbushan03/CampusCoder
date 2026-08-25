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
export const FROM_EMAIL = process.env.FROM_EMAIL || '';

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
    // 1. Prioritize Azure Communication Services if configured
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

        // Non-blocking poll in background, or check initial status
        const initialStatus = poller.getOperationState();
        if (initialStatus.status === 'running' || initialStatus.status === 'notStarted') {
          // Allow background poller to finish without delaying caller
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
        // Fall through to Resend if available
      }
    } else if (azureEmailClient && !AZURE_SENDER_EMAIL) {
      console.warn('[Azure Email] AZURE_COMMUNICATION_CONNECTION_STRING is set, but AZURE_EMAIL_SENDER is missing in .env');
    }

    // 2. Fallback to Resend if configured
    if (resend && FROM_EMAIL) {
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

        return { success: true, id: res.data?.id };
      } catch (resendErr: any) {
        console.error('[Resend Email] Exception:', resendErr);
        return { success: false, error: resendErr };
      }
    } else if (resend && !FROM_EMAIL) {
      console.warn('[Resend Email] RESEND_API_KEY is set, but FROM_EMAIL is missing in .env');
    }

    console.warn(`[Email DEV] No email provider configured in .env. (Subject: "${subject}", To: "${to}")`);
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

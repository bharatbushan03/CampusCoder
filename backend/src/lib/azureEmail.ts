// backend/src/lib/azureEmail.ts
import { EmailClient } from '@azure/communication-email';

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;

export const emailClient = connectionString ? new EmailClient(connectionString) : null;
export const SENDER_EMAIL = process.env.AZURE_EMAIL_SENDER || 'DoNotReply@your-domain.azurecomm.net';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bharatbushan5320@gmail.com';

export async function sendEmail({
  to,
  subject,
  html,
  plainText,
}: {
  to: string;
  subject: string;
  html?: string;
  plainText?: string;
}) {
  if (!emailClient) {
    console.warn('[Azure Email] Client not initialized. Check AZURE_COMMUNICATION_CONNECTION_STRING.');
    return { success: false, error: 'Azure Email Client not configured' };
  }

  try {
    const poller = await emailClient.beginSend({
      senderAddress: SENDER_EMAIL,
      content: {
        subject,
        html: html || '',
        plainText: plainText || '',
      },
      recipients: {
        to: [{ address: to }],
      },
    });

    const response = await poller.pollUntilDone();
    return { success: true, messageId: response.id, status: response.status };
  } catch (error: any) {
    console.error('[Azure Email Error]:', error);
    return { success: false, error: error.message };
  }
}

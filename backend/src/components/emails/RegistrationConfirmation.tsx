import * as React from 'react';

interface RegistrationConfirmationEmailProps {
  studentName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  mode: string;
  communityLinks: { platform: string; url: string }[];
}

const copyrightYear = new Date().getFullYear();

export const RegistrationConfirmationEmail: React.FC<Readonly<RegistrationConfirmationEmailProps>> = ({
  studentName,
  eventTitle,
  eventDate,
  eventTime,
  mode,
  communityLinks,
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#1a202c', maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
    <h1 style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Registration Confirmed!</h1>
    <p>Hi <strong>{studentName}</strong>,</p>
    <p>You have successfully registered for <strong>{eventTitle}</strong>. We are excited to have you join us!</p>
    
    <div style={{ backgroundColor: '#f7fafc', padding: '15px', borderRadius: '6px', margin: '20px 0' }}>
      <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Event Details</h2>
      <p style={{ margin: '5px 0' }}><strong>Date:</strong> {eventDate}</p>
      <p style={{ margin: '5px 0' }}><strong>Time:</strong> {eventTime}</p>
      <p style={{ margin: '5px 0' }}><strong>Mode:</strong> {mode}</p>
    </div>

    <p style={{ color: '#4a5568', fontSize: '14px', lineHeight: '1.5' }}>
      <strong>Note:</strong> The meeting link and further instructions will be shared with you via email closer to the event date.
    </p>

    <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

    <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Join our Community</h3>
    <p style={{ fontSize: '14px' }}>Connect with fellow coders and stay updated:</p>
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {communityLinks.map((link) => (
        <a key={link.platform} href={link.url} style={{ padding: '8px 12px', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
          {link.platform}
        </a>
      ))}
    </div>

    <p style={{ marginTop: '30px', fontSize: '12px', color: '#718096', textAlign: 'center' }}>
      &copy; {copyrightYear} CampusCoder Community. All rights reserved.
    </p>
  </div>
);
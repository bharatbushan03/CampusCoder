import * as React from 'react';

interface EventReminderEmailProps {
  studentName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  meetingLink?: string;
}

const copyrightYear = new Date().getFullYear();

export const EventReminderEmail: React.FC<Readonly<EventReminderEmailProps>> = ({
  studentName,
  eventTitle,
  eventDate,
  eventTime,
  meetingLink,
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#1a202c', maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
    <h1 style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Reminder: {eventTitle} is Starting Soon!</h1>
    <p>Hi <strong>{studentName}</strong>,</p>
    <p>This is a friendly reminder for the upcoming event <strong>{eventTitle}</strong>.</p>
    
    <div style={{ backgroundColor: '#f7fafc', padding: '15px', borderRadius: '6px', margin: '20px 0' }}>
      <p style={{ margin: '5px 0' }}><strong>Date:</strong> {eventDate}</p>
      <p style={{ margin: '5px 0' }}><strong>Time:</strong> {eventTime}</p>
    </div>

    {meetingLink && (
      <div style={{ textAlign: 'center', margin: '25px 0' }}>
        <a href={meetingLink} style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }}>
          Join Meeting
        </a>
      </div>
    )}

    <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
      We look forward to seeing you there!
    </p>

    <p style={{ marginTop: '30px', fontSize: '12px', color: '#718096', textAlign: 'center' }}>
      &copy; {copyrightYear} CampusCoder Community. All rights reserved.
    </p>
  </div>
);

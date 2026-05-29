import * as React from 'react';

interface MeetingLinkEmailProps {
  studentName: string;
  eventTitle: string;
  meetingLink: string;
}

export const MeetingLinkEmail: React.FC<Readonly<MeetingLinkEmailProps>> = ({
  studentName,
  eventTitle,
  meetingLink,
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#1a202c', maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
    <h1 style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Meeting Link for {eventTitle}</h1>
    <p>Hi <strong>{studentName}</strong>,</p>
    <p>The meeting link for the upcoming event <strong>{eventTitle}</strong> is now available.</p>
    
    <div style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', margin: '20px 0', textAlign: 'center' }}>
      <p style={{ marginBottom: '20px' }}>Click the button below to join the session:</p>
      <a href={meetingLink} style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }}>
        Join Meeting
      </a>
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#718096' }}>
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href={meetingLink} style={{ color: '#3182ce' }}>{meetingLink}</a>
      </p>
    </div>

    <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
      We recommend joining 5 minutes early to test your audio and video setup.
    </p>

    <p style={{ marginTop: '30px', fontSize: '12px', color: '#718096', textAlign: 'center' }}>
      &copy; {new Date().getFullYear()} CampusCoder Community. All rights reserved.
    </p>
  </div>
);

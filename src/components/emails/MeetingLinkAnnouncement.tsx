import * as React from 'react';

interface MeetingLinkEmailProps {
  studentName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  meetingLink: string;
}

const copyrightYear = new Date().getFullYear();

export const MeetingLinkEmail: React.FC<Readonly<MeetingLinkEmailProps>> = ({
  studentName,
  eventTitle,
  eventDate,
  eventTime,
  meetingLink,
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#1a202c', maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
    <h1 style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Meeting Link: {eventTitle}</h1>
    <p>Hi <strong>{studentName}</strong>,</p>
    <p>The meeting link for the upcoming sprint <strong>{eventTitle}</strong> is now available. We&apos;re excited to see you there!</p>
    
    <div style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', margin: '20px 0' }}>
      <p style={{ margin: '5px 0' }}><strong>Event:</strong> {eventTitle}</p>
      <p style={{ margin: '5px 0' }}><strong>Date:</strong> {eventDate}</p>
      <p style={{ margin: '5px 0' }}><strong>Time:</strong> {eventTime}</p>
      
      <div style={{ textAlign: 'center', marginTop: '25px', marginBottom: '15px' }}>
        <a href={meetingLink} style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }}>
          Join Google Meet
        </a>
      </div>
      <p style={{ marginTop: '15px', fontSize: '11px', color: '#718096', textAlign: 'center' }}>
        Meeting Link: <a href={meetingLink} style={{ color: '#3182ce' }}>{meetingLink}</a>
      </p>
    </div>

    <div style={{ padding: '15px', borderLeft: '4px solid #10b981', backgroundColor: '#f0fff4', margin: '20px 0', fontSize: '14px' }}>
      <strong>Join on Time:</strong> Please ensure you join at least 5 minutes before the start time to resolve any technical issues and ensure we can start the sprint promptly.
    </div>

    <p style={{ fontSize: '14px', marginTop: '25px', marginBottom: '5px' }}>Happy Coding,</p>
    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', margin: '0' }}>CampusCoder Team</p>

    <p style={{ marginTop: '40px', fontSize: '11px', color: '#a0aec0', textAlign: 'center', borderTop: '1px solid #edf2f7', paddingTop: '20px' }}>
      &copy; {copyrightYear} CampusCoder Community. All rights reserved.
    </p>
  </div>
);

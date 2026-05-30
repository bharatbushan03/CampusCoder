import * as React from 'react';

interface ThankYouEmailProps {
  studentName: string;
  eventTitle: string;
}

export const ThankYouEmail: React.FC<Readonly<ThankYouEmailProps>> = ({
  studentName,
  eventTitle,
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#1a202c', maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
    <h1 style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Thanks for Attending!</h1>
    <p>Hi <strong>{studentName}</strong>,</p>
    <p>Thank you for participating in <strong>{eventTitle}</strong>. We hope you found the session valuable and learned something new!</p>
    
    <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
      Your feedback is important to us. If you have any thoughts or suggestions for future sessions, feel free to share them in our community channels.
    </p>

    <div style={{ backgroundColor: '#f7fafc', padding: '15px', borderRadius: '6px', margin: '20px 0', textAlign: 'center' }}>
      <p style={{ margin: '0', fontStyle: 'italic' }}>&ldquo;Stay hungry, stay foolish, and keep coding!&rdquo;</p>
    </div>

    <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
      Keep an eye on the events page for more upcoming sprints and workshops.
    </p>

    <p style={{ marginTop: '30px', fontSize: '12px', color: '#718096', textAlign: 'center' }}>
      &copy; {new Date().getFullYear()} CampusCoder Community. All rights reserved.
    </p>
  </div>
);

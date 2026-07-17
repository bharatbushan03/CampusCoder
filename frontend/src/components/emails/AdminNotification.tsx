import * as React from 'react';

interface AdminNotificationEmailProps {
  studentName: string;
  studentEmail: string;
  eventTitle: string;
  college: string;
  branch: string;
}

export const AdminNotificationEmail: React.FC<Readonly<AdminNotificationEmailProps>> = ({
  studentName,
  studentEmail,
  eventTitle,
  college,
  branch,
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#1a202c', maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
    <h1 style={{ color: '#2d3748', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>New Event Registration</h1>
    <p>A new student has registered for an event.</p>
    
    <div style={{ backgroundColor: '#f7fafc', padding: '15px', borderRadius: '6px', margin: '20px 0' }}>
      <p style={{ margin: '5px 0' }}><strong>Event:</strong> {eventTitle}</p>
      <p style={{ margin: '5px 0' }}><strong>Student:</strong> {studentName}</p>
      <p style={{ margin: '5px 0' }}><strong>Email:</strong> {studentEmail}</p>
      <p style={{ margin: '5px 0' }}><strong>College:</strong> {college}</p>
      <p style={{ margin: '5px 0' }}><strong>Branch:</strong> {branch}</p>
    </div>

    <p style={{ fontSize: '12px', color: '#718096' }}>
      You can view more details in the admin dashboard.
    </p>
  </div>
);

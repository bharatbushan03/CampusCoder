import * as React from 'react';

interface ProjectSubmissionReceiptEmailProps {
  studentName: string;
  projectTitle: string;
}

export const ProjectSubmissionReceiptEmail: React.FC<
  Readonly<ProjectSubmissionReceiptEmailProps>
> = ({
  studentName,
  projectTitle,
}) => (
  <div
    style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0f172a',
      backgroundColor: '#f8fafc',
      padding: '30px 20px',
      margin: '0 auto',
      maxWidth: '600px',
    }}
  >
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '32px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            padding: '12px',
            borderRadius: '50%',
            marginBottom: '16px',
          }}
        >
          🚀
        </div>
        <h1 style={{ color: '#0f172a', fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0' }}>
          Project Received!
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Hey {studentName}, thanks for sharing your work with the CampusCoder community!
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          padding: '16px',
          margin: '20px 0',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Submitted Project
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          {projectTitle}
        </p>
      </div>

      <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#334155' }}>
        Your project has been delivered to the CampusCoder team. We will review your submission and feature it on the community showcase gallery soon!
      </p>

      <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#334155' }}>
        Keep building and happy coding! 💻
      </p>

      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
          CampusCoder • Empowering Student Developers Everywhere
        </p>
      </div>
    </div>
  </div>
);

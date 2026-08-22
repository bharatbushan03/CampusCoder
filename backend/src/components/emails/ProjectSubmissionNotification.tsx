import * as React from 'react';

interface ProjectSubmissionNotificationEmailProps {
  studentName: string;
  studentEmail: string;
  college?: string | null;
  branch?: string | null;
  year?: string | null;
  projectTitle: string;
  tagline: string;
  description: string;
  techStack: string;
  githubUrl?: string | null;
  liveUrl?: string | null;
  demoVideoUrl?: string | null;
  submittedAt: string;
}

export const ProjectSubmissionNotificationEmail: React.FC<
  Readonly<ProjectSubmissionNotificationEmailProps>
> = ({
  studentName,
  studentEmail,
  college,
  branch,
  year,
  projectTitle,
  tagline,
  description,
  techStack,
  githubUrl,
  liveUrl,
  demoVideoUrl,
  submittedAt,
}) => (
  <div
    style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0f172a',
      backgroundColor: '#f8fafc',
      padding: '30px 20px',
      margin: '0 auto',
      maxWidth: '650px',
    }}
  >
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px' }}>
        <span
          style={{
            display: 'inline-block',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '4px 10px',
            borderRadius: '9999px',
            border: '1px solid #a7f3d0',
            marginBottom: '12px',
          }}
        >
          CampusCoder Showcase
        </span>
        <h1 style={{ color: '#0f172a', fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', lineHeight: 1.3 }}>
          🚀 New Student Project Submission
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Submitted on {submittedAt}
        </p>
      </div>

      {/* Project Highlights */}
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ color: '#34d399', fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
          {projectTitle}
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: '14px', fontStyle: 'italic', margin: 0 }}>
          &ldquo;{tagline}&rdquo;
        </p>
      </div>

      {/* Student Details */}
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 10px 0',
          }}
        >
          Student Author Information
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px 0', color: '#64748b', width: '120px' }}>Name:</td>
              <td style={{ padding: '8px 0', color: '#0f172a', fontWeight: 600 }}>{studentName}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px 0', color: '#64748b' }}>Email:</td>
              <td style={{ padding: '8px 0', color: '#0f172a' }}>
                <a href={`mailto:${studentEmail}`} style={{ color: '#059669', textDecoration: 'none' }}>
                  {studentEmail}
                </a>
              </td>
            </tr>
            {college && (
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 0', color: '#64748b' }}>College:</td>
                <td style={{ padding: '8px 0', color: '#0f172a' }}>{college}</td>
              </tr>
            )}
            {(branch || year) && (
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Branch / Year:</td>
                <td style={{ padding: '8px 0', color: '#0f172a' }}>
                  {[branch, year ? `Year ${year}` : ''].filter(Boolean).join(' • ')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Project Details */}
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 10px 0',
          }}
        >
          Project Overview
        </h3>
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '16px',
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#334155',
            whiteSpace: 'pre-line',
          }}
        >
          {description}
        </div>
      </div>

      {/* Tech Stack */}
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 10px 0',
          }}
        >
          Tech Stack
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
          {techStack}
        </p>
      </div>

      {/* Project Links */}
      <div style={{ marginBottom: '32px' }}>
        <h3
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            margin: '0 0 12px 0',
          }}
        >
          Links &amp; Resources
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {githubUrl && (
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>GitHub:</strong>{' '}
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', textDecoration: 'underline' }}>
                {githubUrl}
              </a>
            </p>
          )}
          {liveUrl && (
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Live Demo:</strong>{' '}
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', textDecoration: 'underline' }}>
                {liveUrl}
              </a>
            </p>
          )}
          {demoVideoUrl && (
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Video Demo:</strong>{' '}
              <a href={demoVideoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', textDecoration: 'underline' }}>
                {demoVideoUrl}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
          This notification was automatically sent by the CampusCoder Project Showcase engine.
        </p>
      </div>
    </div>
  </div>
);

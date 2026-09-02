import * as React from 'react';

export interface RegistrationConfirmationEmailProps {
  studentName: string;
  studentEmail?: string;
  college?: string;
  branch?: string;
  year?: string | number;
  codingLevel?: string;
  preferredLanguage?: string;
  eventTitle: string;
  eventType?: string;
  eventDate: string;
  eventTime: string;
  mode: string;
  venueLabel?: string;
  venueDetails?: string;
  meetingLink?: string | null;
  shortDescription?: string | null;
  communityLinks: { platform: string; url: string }[];
}

const copyrightYear = new Date().getFullYear();

export const RegistrationConfirmationEmail: React.FC<Readonly<RegistrationConfirmationEmailProps>> = ({
  studentName,
  studentEmail,
  college,
  branch,
  year,
  codingLevel,
  preferredLanguage,
  eventTitle,
  eventType = 'workshop',
  eventDate,
  eventTime,
  mode,
  venueLabel,
  venueDetails,
  meetingLink,
  shortDescription,
  communityLinks = [],
}) => {
  const displayMode = mode ? mode.toUpperCase() : 'ONLINE';
  const displayVenue = venueLabel || (mode === 'offline' ? 'In-Person / Campus Venue' : mode === 'hybrid' ? 'Hybrid (In-Person & Online)' : 'Online (Virtual)');
  const displayVenueDetails = venueDetails || (
    meetingLink 
      ? `Access Link: ${meetingLink}` 
      : mode === 'offline' 
        ? 'Campus Seminar Hall / Coding Lab (Report 10 mins prior)' 
        : 'Meeting link will be shared via email & Discord before the session begins.'
  );

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: '#090d16',
        color: '#f1f5f9',
        padding: '32px 16px',
        margin: '0',
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div
          style={{
            height: '6px',
            background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
            width: '100%',
          }}
        />

        {/* Header Branding */}
        <div
          style={{
            padding: '32px 32px 24px 32px',
            borderBottom: '1px solid #1e293b',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#34d399',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            ✓ Registration Confirmed
          </div>

          <h1
            style={{
              margin: '0 0 8px 0',
              fontSize: '26px',
              fontWeight: '800',
              letterSpacing: '-0.5px',
              color: '#ffffff',
            }}
          >
            Campus<span style={{ color: '#10b981' }}>Coder</span>
          </h1>
          <p
            style={{
              margin: '0',
              fontSize: '13px',
              color: '#94a3b8',
              letterSpacing: '0.2px',
            }}
          >
            Your seat is successfully reserved!
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '32px' }}>
          {/* Greeting */}
          <p
            style={{
              fontSize: '16px',
              color: '#f8fafc',
              lineHeight: '1.6',
              margin: '0 0 16px 0',
            }}
          >
            Hi <strong style={{ color: '#34d399' }}>{studentName}</strong>,
          </p>
          <p
            style={{
              fontSize: '14px',
              color: '#cbd5e1',
              lineHeight: '1.6',
              margin: '0 0 24px 0',
            }}
          >
            Thank you for registering for <strong style={{ color: '#ffffff' }}>{eventTitle}</strong>. We are thrilled to have you join our developer community for this sprint! Below are the complete event and registration details for your reference.
          </p>

          {/* Event Details Card */}
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid #334155',
                paddingBottom: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {eventType.replace('_', ' ')} • {displayMode}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                Confirmed
              </span>
            </div>

            <h2
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 16px 0',
                lineHeight: '1.4',
              }}
            >
              {eventTitle}
            </h2>

            {shortDescription && (
              <p
                style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  lineHeight: '1.5',
                  margin: '0 0 16px 0',
                }}
              >
                {shortDescription}
              </p>
            )}

            {/* Table of Details */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: '8px 0',
                      fontSize: '13px',
                      color: '#94a3b8',
                      width: '90px',
                      verticalAlign: 'top',
                    }}
                  >
                    <strong>📅 Date:</strong>
                  </td>
                  <td style={{ padding: '8px 0', fontSize: '13px', color: '#f8fafc', fontWeight: '600' }}>
                    {eventDate}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: '8px 0',
                      fontSize: '13px',
                      color: '#94a3b8',
                      width: '90px',
                      verticalAlign: 'top',
                    }}
                  >
                    <strong>⏰ Time:</strong>
                  </td>
                  <td style={{ padding: '8px 0', fontSize: '13px', color: '#f8fafc', fontWeight: '600' }}>
                    {eventTime}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: '8px 0',
                      fontSize: '13px',
                      color: '#94a3b8',
                      width: '90px',
                      verticalAlign: 'top',
                    }}
                  >
                    <strong>📍 Venue:</strong>
                  </td>
                  <td style={{ padding: '8px 0', fontSize: '13px', color: '#f8fafc', fontWeight: '600' }}>
                    {displayVenue}
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '400', marginTop: '2px' }}>
                      {displayVenueDetails}
                    </div>
                  </td>
                </tr>
                {meetingLink && (
                  <tr>
                    <td
                      style={{
                        padding: '8px 0',
                        fontSize: '13px',
                        color: '#94a3b8',
                        width: '90px',
                        verticalAlign: 'top',
                      }}
                    >
                      <strong>🔗 Meeting:</strong>
                    </td>
                    <td style={{ padding: '8px 0', fontSize: '13px', color: '#38bdf8' }}>
                      <a
                        href={meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#38bdf8', textDecoration: 'underline', wordBreak: 'break-all' }}
                      >
                        {meetingLink}
                      </a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Attendee Registration Summary Card */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '28px',
            }}
          >
            <h3
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                margin: '0 0 14px 0',
              }}
            >
              Attendee Profile
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', fontSize: '12px', color: '#64748b', width: '110px' }}>Name:</td>
                  <td style={{ padding: '4px 0', fontSize: '12px', color: '#e2e8f0', fontWeight: '500' }}>{studentName}</td>
                </tr>
                {studentEmail && (
                  <tr>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#64748b' }}>Email:</td>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#e2e8f0' }}>{studentEmail}</td>
                  </tr>
                )}
                {college && (
                  <tr>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#64748b' }}>College:</td>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#e2e8f0' }}>{college}</td>
                  </tr>
                )}
                {branch && (
                  <tr>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#64748b' }}>Branch / Year:</td>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#e2e8f0' }}>
                      {branch}{year ? ` (Year ${year})` : ''}
                    </td>
                  </tr>
                )}
                {(codingLevel || preferredLanguage) && (
                  <tr>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#64748b' }}>Coding Stack:</td>
                    <td style={{ padding: '4px 0', fontSize: '12px', color: '#e2e8f0' }}>
                      {[codingLevel, preferredLanguage].filter(Boolean).join(' • ')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tips / Instructions */}
          <div
            style={{
              borderLeft: '3px solid #10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              padding: '16px',
              borderRadius: '0 8px 8px 0',
              marginBottom: '28px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#34d399',
                margin: '0 0 6px 0',
              }}
            >
              💡 Next Steps &amp; Recommendations:
            </p>
            <ul
              style={{
                margin: '0',
                paddingLeft: '18px',
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: '1.6',
              }}
            >
              <li>Please mark your calendar for <strong>{eventDate}</strong> at <strong>{eventTime}</strong>.</li>
              <li>Keep your laptop and coding environment (VS Code / Python / Node) ready for hands-on sessions.</li>
              <li>Join the session 5–10 minutes early to test your audio &amp; video connection.</li>
            </ul>
          </div>

          {/* Community Links */}
          {communityLinks && communityLinks.length > 0 && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h4
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#e2e8f0',
                  margin: '0 0 12px 0',
                }}
              >
                Join the CampusCoder Community
              </h4>
              <p
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: '0 0 14px 0',
                }}
              >
                Connect with mentors, ask questions, and get instant updates:
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {communityLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: '#34d399',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      margin: '4px',
                    }}
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #1e293b',
            padding: '24px 32px',
            backgroundColor: '#090d16',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: '#64748b',
              margin: '0 0 6px 0',
              lineHeight: '1.4',
            }}
          >
            This is an automated confirmation from the CampusCoder Registration System.
          </p>
          <p
            style={{
              fontSize: '11px',
              color: '#64748b',
              margin: '0',
            }}
          >
            &copy; {copyrightYear} CampusCoder Community. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationConfirmationEmail;
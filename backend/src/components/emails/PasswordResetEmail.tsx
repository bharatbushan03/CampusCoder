import * as React from 'react';

interface PasswordResetEmailProps {
  fullName?: string;
  otpCode?: string;
  resetLink?: string;
}

const copyrightYear = new Date().getFullYear();

export const PasswordResetEmail: React.FC<Readonly<PasswordResetEmailProps>> = ({
  fullName,
  otpCode,
  resetLink,
}) => (
  <div
    style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#1e293b',
      backgroundColor: '#f8fafc',
      padding: '40px 20px',
      margin: '0',
    }}
  >
    <div
      style={{
        maxWidth: '520px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2
          style={{
            margin: '0',
            fontSize: '22px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            color: '#0f172a',
          }}
        >
          Campus<span style={{ color: '#10b981' }}>Coder</span>
        </h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Password Recovery
        </p>
      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
        <h1
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#0f172a',
            margin: '0 0 12px 0',
          }}
        >
          Reset Your Password
        </h1>
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px 0' }}>
          Hi <strong>{fullName || 'there'}</strong>,
        </p>
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          We received a request to reset your password for your CampusCoder account.
        </p>

        {/* OTP Box if provided */}
        {otpCode && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '2px dashed #86efac',
              borderRadius: '10px',
              padding: '18px',
              textAlign: 'center',
              margin: '20px 0',
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#059669', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Your 6-Digit Reset Code
            </p>
            <span
              style={{
                fontFamily: 'Courier, monospace',
                fontSize: '32px',
                fontWeight: 'bold',
                letterSpacing: '8px',
                color: '#047857',
                display: 'inline-block',
              }}
            >
              {otpCode}
            </span>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#059669' }}>
              Valid for 10 minutes
            </p>
          </div>
        )}

        {/* CTA Button if link provided */}
        {resetLink && (
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <a
              href={resetLink}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                display: 'inline-block',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
              }}
            >
              Reset Password &rarr;
            </a>
          </div>
        )}

        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '20px 0 0 0' }}>
          If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          marginTop: '32px',
          paddingTop: '20px',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: '0', fontSize: '12px', color: '#94a3b8' }}>
          &copy; {copyrightYear} CampusCoder Community. All rights reserved.
        </p>
      </div>
    </div>
  </div>
);

export default PasswordResetEmail;

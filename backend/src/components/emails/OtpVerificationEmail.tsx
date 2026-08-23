import * as React from 'react';

interface OtpVerificationEmailProps {
  fullName: string;
  otpCode: string;
  expiresInMinutes?: number;
}

const copyrightYear = new Date().getFullYear();

export const OtpVerificationEmail: React.FC<Readonly<OtpVerificationEmailProps>> = ({
  fullName,
  otpCode,
  expiresInMinutes = 10,
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
          Verification & Security
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
          Verify Your Email Address
        </h1>
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          Hi <strong>{fullName || 'there'}</strong>,
        </p>
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px 0' }}>
          Thank you for signing up for CampusCoder. Please use the following One-Time Password (OTP) to complete your registration:
        </p>

        {/* OTP Code Box */}
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '2px dashed #86efac',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center',
            margin: '24px 0',
          }}
        >
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
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#059669', fontWeight: '500' }}>
            Valid for {expiresInMinutes} minutes
          </p>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '20px 0 0 0' }}>
          If you did not attempt to sign up for CampusCoder, you can safely ignore this email. Do not share this code with anyone.
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
export default OtpVerificationEmail;

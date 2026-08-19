import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/app/_legal/LegalPage';

const updatedAt = 'May 31, 2026';

const sections: LegalSection[] = [
  {
    title: 'Information We Collect',
    paragraphs: [
      'CampusCoder collects information you choose to provide when you create an account, register for events, update your dashboard profile, or contact community administrators.',
    ],
    bullets: [
      'Account and profile details, such as name, email address, college, branch, graduation year, and role.',
      'Event registration details, such as selected event, phone number, coding level, preferred programming language, reason for joining, attendance status, and registration time.',
      'Authentication data handled by the backend authentication service, including session information. We do not store plain-text passwords.',
      'Messages and operational records needed to send confirmations, reminders, meeting links, announcements, and admin notifications.',
      'Basic technical information from your browser and device, including cookies, local storage, logs, and similar data used to keep the site working.',
    ],
  },
  {
    title: 'How We Use Information',
    paragraphs: [
      'We use information to operate the CampusCoder community portal, manage student events, and keep members informed about sessions they join.',
    ],
    bullets: [
      'Create and maintain student accounts and dashboards.',
      'Process event registrations, attendance, reminders, and meeting link communications.',
      'Send administrative emails and community announcements related to CampusCoder activity.',
      'Protect the site, prevent abuse, troubleshoot errors, and improve reliability.',
      'Understand aggregate participation trends so organizers can plan better workshops and resources.',
    ],
  },
  {
    title: 'Cookies and Local Storage',
    paragraphs: [
      'The site may use cookies, browser storage, and session storage to keep you signed in, remember interface choices, and support security. For example, announcement dismissal can be stored locally in your browser.',
      'You can control cookies through your browser settings. Some login, dashboard, and registration features may not work correctly if required storage is disabled.',
    ],
  },
  {
    title: 'How We Share Information',
    paragraphs: [
      'We do not sell personal information. We share information only when needed to run the community, support events, or meet legal and security obligations.',
    ],
    bullets: [
      'With CampusCoder administrators and event organizers who need access to manage events, registrations, attendance, and communications.',
      'With service providers that help operate the site, such as the backend hosting provider for authentication and database services, and email delivery providers for transactional mail.',
      'With third-party community platforms, such as Discord, WhatsApp, GitHub, or LinkedIn, only when you choose to follow external links or join those services.',
      'When required to comply with law, protect rights and safety, investigate abuse, or enforce community rules.',
    ],
  },
  {
    title: 'Retention',
    paragraphs: [
      'We keep personal information only as long as needed for the purposes described in this policy, including event administration, community records, security, troubleshooting, and legal obligations.',
      'You may ask us to update or delete your information. Some records may remain in backups, logs, or event records for a limited time when deletion is not technically immediate or when we have a legitimate operational reason to retain them.',
    ],
  },
  {
    title: 'Your Choices',
    paragraphs: [
      'You can update certain profile information from your dashboard, unregister from events where the site provides that option, and contact the CampusCoder administrators for help with access, correction, or deletion requests.',
      'You can unsubscribe from optional community messages by leaving external community channels or by contacting administrators. Operational messages about registrations, account access, or security may still be sent when needed.',
    ],
  },
  {
    title: 'Security',
    paragraphs: [
      'We use reasonable technical and administrative safeguards for the information we keep, including provider-managed authentication, access controls, and environment-based service configuration.',
      'No website or online service can guarantee perfect security. You should use a strong password, keep your login credentials private, and tell us if you believe your account or information has been misused.',
    ],
  },
  {
    title: 'Children and Students',
    paragraphs: [
      'CampusCoder is intended for students and community learners, but it is not directed to children under 13. We do not knowingly collect personal information from children under 13.',
      'If you believe a child under 13 provided personal information, contact us so we can review and delete it where appropriate.',
    ],
  },
  {
    title: 'Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy when CampusCoder changes its features, providers, or data practices. The updated date at the top of the page shows when the latest version took effect.',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      'For privacy questions, access requests, or deletion requests, contact the CampusCoder administrators at bharatbushan5320@gmail.com.',
    ],
  },
];

export const metadata: Metadata = {
  title: 'Privacy Policy | CampusCoder',
  description: 'Learn how CampusCoder collects, uses, shares, and protects student community information.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      label="Privacy"
      title="Privacy Policy"
      summary="This policy explains how CampusCoder handles information for accounts, event registration, student dashboards, announcements, and community communications."
      updatedAt={updatedAt}
      sections={sections}
    />
  );
}

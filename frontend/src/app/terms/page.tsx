import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/app/_legal/LegalPage';

const updatedAt = 'May 31, 2026';

const sections: LegalSection[] = [
  {
    title: 'Acceptance of Terms',
    paragraphs: [
      'By accessing or using CampusCoder, you agree to these Terms and Conditions and to the Privacy Policy. If you do not agree, do not use the site or register for events through it.',
      'CampusCoder may update these terms from time to time. Continued use of the site after an update means you accept the updated terms.',
    ],
  },
  {
    title: 'Who May Use CampusCoder',
    paragraphs: [
      'CampusCoder is built for students, organizers, speakers, and community members participating in coding workshops, webinars, challenges, resources, and related learning activities.',
    ],
    bullets: [
      'You must provide accurate registration and account information.',
      'You are responsible for keeping your account credentials private.',
      'The site is not directed to children under 13. If you are under the age of majority where you live, use CampusCoder only with permission from a parent or guardian.',
    ],
  },
  {
    title: 'Accounts and Access',
    paragraphs: [
      'Some features require an account or event registration. CampusCoder may approve, reject, suspend, or remove access when needed to protect the community, enforce these terms, or comply with operational requirements.',
      'You are responsible for activity that occurs through your account unless you report unauthorized access promptly.',
    ],
  },
  {
    title: 'Event Registration and Communications',
    paragraphs: [
      'When you register for an event, you agree that CampusCoder may use your registration details to manage your seat, send confirmations, reminders, meeting links, schedule changes, and event-related notices.',
      'Event dates, topics, speakers, capacity, meeting links, and formats may change. CampusCoder will try to communicate important changes, but availability is not guaranteed.',
    ],
    bullets: [
      'Do not share private meeting links outside the intended event audience.',
      'Do not submit false registrations or register other people without permission.',
      'If you cannot attend, unregister where available or notify the organizers when possible.',
    ],
  },
  {
    title: 'Community Conduct',
    paragraphs: [
      'CampusCoder should remain a respectful learning space. You agree not to misuse the site, events, community channels, or resources.',
    ],
    bullets: [
      'No harassment, hate, threats, discrimination, spam, impersonation, or disruptive behavior.',
      'No malware, scraping, credential sharing, unauthorized access, or attempts to interfere with the service.',
      'No academic dishonesty, plagiarism, or misuse of shared learning material.',
      'No posting or sending unlawful, confidential, or harmful content.',
    ],
  },
  {
    title: 'Content and Resources',
    paragraphs: [
      'CampusCoder content, event materials, resource links, announcements, and emails are provided for learning and community participation. They are not professional, career, legal, financial, or academic advice.',
      'External links may lead to third-party platforms or resources that CampusCoder does not control. Your use of those services is governed by their own terms and policies.',
    ],
  },
  {
    title: 'Your Submissions',
    paragraphs: [
      'You may submit information such as profile details, registration answers, feedback, messages, or reason-for-joining notes. You keep ownership of your submissions, but you give CampusCoder permission to use them as needed to operate the site, manage events, provide support, and communicate with the community.',
      'Do not submit sensitive personal information, confidential material, or content you do not have the right to share.',
    ],
  },
  {
    title: 'Service Availability',
    paragraphs: [
      'CampusCoder is provided on an as-is and as-available basis. The site may be unavailable, delayed, changed, or discontinued for maintenance, provider outages, security reasons, or feature updates.',
      'We try to keep the platform useful and reliable, but we do not promise that it will always be error-free, secure, uninterrupted, or compatible with every browser or device.',
    ],
  },
  {
    title: 'Limitation of Liability',
    paragraphs: [
      'To the maximum extent allowed by applicable law, CampusCoder and its administrators, organizers, contributors, and speakers are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the site, events, links, communications, or resources.',
      'Nothing in these terms limits liability that cannot be limited by law.',
    ],
  },
  {
    title: 'Privacy',
    paragraphs: [
      'Your use of CampusCoder is also governed by the Privacy Policy, which explains what information is collected, how it is used, and the choices available to you.',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      'For questions about these Terms and Conditions, contact the CampusCoder administrators at bharatbushan5320@gmail.com.',
    ],
  },
];

export const metadata: Metadata = {
  title: 'Terms and Conditions | CampusCoder',
  description: 'Read the terms for using CampusCoder accounts, events, resources, and community features.',
};

export default function TermsPage() {
  return (
    <LegalPage
      label="Terms"
      title="Terms and Conditions"
      summary="These terms set expectations for CampusCoder accounts, event registrations, community behavior, learning resources, and platform availability."
      updatedAt={updatedAt}
      sections={sections}
    />
  );
}

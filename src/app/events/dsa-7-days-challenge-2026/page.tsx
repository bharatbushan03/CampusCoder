import { Metadata } from 'next';
import DSAChallengePageClient from './DSAChallengePageClient';

export const metadata: Metadata = {
  title: '7 Days DSA Challenge 2026 | CampusCoder',
  description: 'Master Data Structures & Algorithms in 7 days. Join India\'s growing student developer community for an intensive HackerRank coding challenge. 22-28 June 2026.',
  openGraph: {
    title: '7 Days DSA Challenge 2026 | CampusCoder',
    description: 'Master Data Structures & Algorithms in 7 days. Join India\'s growing student developer community for an intensive HackerRank coding challenge.',
    url: 'https://campuscoder.com/events/dsa-7-days-challenge-2026',
    siteName: 'CampusCoder',
    images: [
      {
        url: 'https://campuscoder.com/og/dsa-challenge.png',
        width: 1200,
        height: 630,
        alt: '7 Days DSA Challenge 2026 Banner',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '7 Days DSA Challenge 2026 | CampusCoder',
    description: 'Master Data Structures & Algorithms in 7 days. 22-28 June 2026.',
    images: ['https://campuscoder.com/og/dsa-challenge.png'],
  },
};

export default function DSAChallengePage() {
  // JSON-LD structured data for Google Rich Results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationEvent',
    name: '7 Days DSA Challenge 2026',
    description: 'A 7-day intensive Data Structures and Algorithms challenge designed to help students improve problem-solving skills, coding efficiency, and interview preparation.',
    startDate: '2026-06-22T18:00:00+05:30',
    endDate: '2026-06-28T21:00:00+05:30',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'VirtualLocation',
      url: 'https://campuscoder.com/events/dsa-7-days-challenge-2026',
    },
    image: [
      'https://campuscoder.com/og/dsa-challenge.png'
    ],
    organizer: {
      '@type': 'Organization',
      name: 'CampusCoder',
      url: 'https://campuscoder.com',
    },
    offers: {
      '@type': 'Offer',
      url: 'https://campuscoder.com/register',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      validFrom: '2026-01-01T00:00:00+05:30',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DSAChallengePageClient />
    </>
  );
}

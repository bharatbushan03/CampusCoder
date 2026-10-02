export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_CLUB_ID = '00000000-0000-0000-0000-000000000001';

export const DEFAULT_CLUBS: Club[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'ACM',
    slug: 'acm',
    description: 'Association for Computing Machinery student chapter focused on algorithms, systems, computing research, and hackathons.',
    category: 'Technical',
    logo_url: null,
    banner_url: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'IEEE',
    slug: 'ieee',
    description: 'Institute of Electrical and Electronics Engineers branch dedicated to engineering, hardware, IoT, and technological innovation.',
    category: 'Technical',
    logo_url: null,
    banner_url: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'LeetCode',
    slug: 'leetcode',
    description: 'Campus competitive programming community, daily DSA practice, algorithmic sprint contests, and technical interview preparation.',
    category: 'Coding & DSA',
    logo_url: null,
    banner_url: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

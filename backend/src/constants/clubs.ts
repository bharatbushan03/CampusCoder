export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  college: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_CLUB_ID = '00000000-0000-0000-0000-000000000001';

export const DEFAULT_CLUBS: Club[] = [];



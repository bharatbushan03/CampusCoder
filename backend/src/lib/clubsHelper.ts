import { createAdminClient } from '../utils/supabase/admin';
import { DEFAULT_CLUBS, DEFAULT_CLUB_ID, type Club } from '../constants/clubs';

export { DEFAULT_CLUBS, DEFAULT_CLUB_ID, type Club };

export async function getAllClubs(): Promise<Club[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_CLUBS;
    }

    return data as Club[];
  } catch {
    return DEFAULT_CLUBS;
  }
}

export async function getClubByIdOrSlug(idOrSlug: string): Promise<Club | null> {
  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    
    let query = supabase.from('clubs').select('*');
    if (isUuid) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }
    
    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      return data as Club;
    }
  } catch {
    // Fall back to memory
  }

  // Fallback to static list
  return (
    DEFAULT_CLUBS.find(c => c.id === idOrSlug || c.slug === idOrSlug) || null
  );
}

export function getDefaultClub(): Club {
  return DEFAULT_CLUBS[0];
}

import { createAdminClient } from '../utils/supabase/admin';
import { DEFAULT_CLUBS, DEFAULT_CLUB_ID, type Club } from '../constants/clubs';
import { appCache } from './cache';

export { DEFAULT_CLUBS, DEFAULT_CLUB_ID, type Club };

export const HACKERRANK_CREW_NAME = 'hackerrankcampuscrew';
const DEFAULT_COLLEGE = 'MIET';

// In-memory cache to guarantee immediate reactivity across requests even prior to migration or during caching
const inMemoryClubs: Club[] = [];
const deletedClubIds = new Set<string>();

export function removeClubFromMemory(idOrSlug: string): void {
  if (!idOrSlug) return;
  const trimmed = idOrSlug.trim();
  const lower = trimmed.toLowerCase();
  deletedClubIds.add(trimmed);
  deletedClubIds.add(lower);

  for (let i = inMemoryClubs.length - 1; i >= 0; i--) {
    if (inMemoryClubs[i].id === trimmed || inMemoryClubs[i].slug.toLowerCase() === lower) {
      inMemoryClubs.splice(i, 1);
    }
  }
}

export function removeClubsByCollegeFromMemory(collegeName: string): void {
  if (!collegeName) return;
  const norm = collegeName.trim().toUpperCase();
  for (let i = inMemoryClubs.length - 1; i >= 0; i--) {
    const clubCollege = (inMemoryClubs[i].college || DEFAULT_COLLEGE).trim().toUpperCase();
    if (clubCollege === norm) {
      deletedClubIds.add(inMemoryClubs[i].id);
      deletedClubIds.add(inMemoryClubs[i].slug.toLowerCase());
      inMemoryClubs.splice(i, 1);
    }
  }
}

export function generateHackerRankCrewSlug(collegeName: string): string {
  const norm = collegeName.trim().toLowerCase();
  const cleanCollege = norm.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `hackerrankcampuscrew-${cleanCollege || 'campus'}`;
}

export async function getAllClubs(): Promise<Club[]> {
  const clubsMap = new Map<string, Club>();

  // 1. Add default static clubs first
  DEFAULT_CLUBS.forEach((c) => {
    if (!deletedClubIds.has(c.id) && !deletedClubIds.has(c.slug.toLowerCase())) {
      clubsMap.set(c.id, c);
    }
  });

  // 2. Add in-memory dynamic clubs
  inMemoryClubs.forEach((c) => {
    if (!deletedClubIds.has(c.id) && !deletedClubIds.has(c.slug.toLowerCase())) {
      clubsMap.set(c.id, c);
    }
  });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      data.forEach((c: any) => {
        if (!deletedClubIds.has(c.id) && !deletedClubIds.has((c.slug || '').toLowerCase())) {
          clubsMap.set(c.id, c as Club);
        }
      });
    }
  } catch (err) {
    console.warn('[ClubsHelper] Supabase getAllClubs notice:', err);
  }

  return Array.from(clubsMap.values()).filter(
    (c) =>
      !deletedClubIds.has(c.id) &&
      !deletedClubIds.has(c.slug.toLowerCase()) &&
      !(
        ((c.slug || '').toLowerCase() === 'hackerrankcampuscrew' ||
          (c.name || '').toLowerCase() === HACKERRANK_CREW_NAME.toLowerCase()) &&
        (c.college || DEFAULT_COLLEGE).trim().toUpperCase() === 'MIET'
      )
  );
}

export async function getClubByIdOrSlug(idOrSlug: string): Promise<Club | null> {
  const trimmed = idOrSlug.trim();
  const lower = trimmed.toLowerCase();

  if (deletedClubIds.has(trimmed) || deletedClubIds.has(lower)) {
    return null;
  }

  const isMietHackerrank = (c: { slug?: string | null; name?: string | null; college?: string | null }) => {
    return (
      ((c.slug || '').toLowerCase() === 'hackerrankcampuscrew' ||
        (c.name || '').toLowerCase() === HACKERRANK_CREW_NAME.toLowerCase()) &&
      (c.college || DEFAULT_COLLEGE).trim().toUpperCase() === 'MIET'
    );
  };

  // 1. Check in-memory clubs first for immediate resolution
  const memMatch = inMemoryClubs.find(
    (c) => c.id === trimmed || c.slug.toLowerCase() === lower
  );
  if (memMatch && !deletedClubIds.has(memMatch.id)) {
    if (isMietHackerrank(memMatch)) return null;
    return memMatch;
  }

  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

    let query = supabase.from('clubs').select('*');
    if (isUuid) {
      query = query.eq('id', trimmed);
    } else {
      query = query.eq('slug', lower);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      if (deletedClubIds.has(data.id) || deletedClubIds.has((data.slug || '').toLowerCase())) {
        return null;
      }
      if (isMietHackerrank(data)) return null;
      return data as Club;
    }
  } catch {
    // Fall back to static list
  }

  // 2. Fallback to static list
  const staticMatch = DEFAULT_CLUBS.find((c) => c.id === trimmed || c.slug.toLowerCase() === lower);
  if (staticMatch && (deletedClubIds.has(staticMatch.id) || deletedClubIds.has(staticMatch.slug.toLowerCase()))) {
    return null;
  }
  if (staticMatch && isMietHackerrank(staticMatch)) {
    return null;
  }
  return staticMatch || null;
}

export function getDefaultClub(): Club | null {
  return inMemoryClubs[0] || null;
}

/**
 * Automatically creates a hackerrankcampuscrew club for the specified college/campus (if not existing)
 * and assigns the first registered member of that college as its organizer.
 */
export async function autoSetupHackerRankCrewForCollege(
  collegeName: string,
  _candidateUserId?: string
): Promise<{ club: Club | null; organizerAssigned: boolean }> {
  if (!collegeName) return { club: null, organizerAssigned: false };
  const normalizedCollege = collegeName.trim();
  const upper = normalizedCollege.toUpperCase();

  if (
    !normalizedCollege ||
    upper === 'ALL' ||
    upper === 'ALL CAMPUSES' ||
    upper === 'ALL_CAMPUSES' ||
    upper === 'MIET'
  ) {
    return { club: null, organizerAssigned: false };
  }

  const supabase = createAdminClient();
  let targetClub: Club | null = null;
  const targetSlug = generateHackerRankCrewSlug(normalizedCollege);

  // 1. Check if a club for this college named hackerrankcampuscrew already exists in database
  try {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('college', normalizedCollege);

    if (!error && Array.isArray(data) && data.length > 0) {
      const match = data.find(
        (c: any) =>
          c.name?.toLowerCase() === HACKERRANK_CREW_NAME.toLowerCase() ||
          c.slug?.toLowerCase() === targetSlug.toLowerCase() ||
          c.slug?.toLowerCase().startsWith('hackerrankcampuscrew')
      );
      if (match) {
        targetClub = match as Club;
      }
    }
  } catch (err) {
    console.warn('[ClubsHelper] Error querying clubs for college:', err);
  }

  // Check in-memory / static fallback if not found in database
  if (!targetClub) {
    targetClub =
      inMemoryClubs.find(
        (c) =>
          (c.college || '').trim().toUpperCase() === upper &&
          (c.name.toLowerCase() === HACKERRANK_CREW_NAME.toLowerCase() ||
            c.slug.toLowerCase() === targetSlug.toLowerCase())
      ) ||
      DEFAULT_CLUBS.find(
        (c) =>
          (c.college || '').trim().toUpperCase() === upper &&
          c.name.toLowerCase() === HACKERRANK_CREW_NAME.toLowerCase()
      ) ||
      null;
  }

  // 2. If club does not exist yet for this college, create it!
  if (!targetClub) {
    const newClubId = crypto.randomUUID();
    const newClub: Club = {
      id: newClubId,
      name: HACKERRANK_CREW_NAME,
      slug: targetSlug,
      description: `Official HackerRank Campus Crew community chapter for ${normalizedCollege} - fostering algorithms, competitive programming sprints, hackathons, and technical interview preparation.`,
      category: 'Coding & DSA',
      college: normalizedCollege,
      logo_url: null,
      banner_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store in-memory immediately for real-time reactivity
    inMemoryClubs.push(newClub);
    targetClub = newClub;

    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('clubs')
        .insert({
          id: newClub.id,
          name: newClub.name,
          slug: newClub.slug,
          description: newClub.description,
          category: newClub.category,
          college: newClub.college,
          logo_url: newClub.logo_url,
          banner_url: newClub.banner_url,
          is_active: newClub.is_active,
        })
        .select()
        .single();

      if (insertErr) {
        // If conflict on slug (e.g. duplicate slug), try unique timestamp suffix
        if (insertErr.code === '23505') {
          const uniqueFallbackSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
          newClub.slug = uniqueFallbackSlug;
          const { data: retryData } = await supabase
            .from('clubs')
            .insert({
              id: newClub.id,
              name: newClub.name,
              slug: newClub.slug,
              description: newClub.description,
              category: newClub.category,
              college: newClub.college,
              logo_url: newClub.logo_url,
              banner_url: newClub.banner_url,
              is_active: newClub.is_active,
            })
            .select()
            .single();
          if (retryData) {
            targetClub = retryData as Club;
          }
        } else {
          console.warn('[ClubsHelper] Error inserting hackerrankcampuscrew club:', insertErr.message);
        }
      } else if (inserted) {
        targetClub = inserted as Club;
      }
    } catch (insertEx) {
      console.warn('[ClubsHelper] Exception creating club:', insertEx);
    }

    try {
      await appCache.invalidateTags(['clubs']);
    } catch {}
  }

  // Automatic self-promotion to organizer is removed for security (SEC-02).
  // Organizers must be granted explicitly by administrators.
  return { club: targetClub, organizerAssigned: false };
}

/**
 * Assigns organizer role to a user.
 * Deprecated for automatic signup flows; retained strictly as an explicit admin utility.
 */
export async function assignFirstMemberAsOrganizer(
  _club: Club,
  _collegeName: string,
  _candidateUserId?: string
): Promise<boolean> {
  // Permanently disabled in signup flow to close SEC-02 privilege escalation vulnerability.
  return false;
}

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
  if (norm === 'miet') {
    return 'hackerrankcampuscrew';
  }
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
    (c) => !deletedClubIds.has(c.id) && !deletedClubIds.has(c.slug.toLowerCase())
  );
}

export async function getClubByIdOrSlug(idOrSlug: string): Promise<Club | null> {
  const trimmed = idOrSlug.trim();
  const lower = trimmed.toLowerCase();

  if (deletedClubIds.has(trimmed) || deletedClubIds.has(lower)) {
    return null;
  }

  // 1. Check in-memory clubs first for immediate resolution
  const memMatch = inMemoryClubs.find(
    (c) => c.id === trimmed || c.slug.toLowerCase() === lower
  );
  if (memMatch && !deletedClubIds.has(memMatch.id)) return memMatch;

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
  return staticMatch || null;
}

export function getDefaultClub(): Club {
  return DEFAULT_CLUBS[0];
}

/**
 * Automatically creates a hackerrankcampuscrew club for the specified college/campus (if not existing)
 * and assigns the first registered member of that college as its organizer.
 */
export async function autoSetupHackerRankCrewForCollege(
  collegeName: string,
  candidateUserId?: string
): Promise<{ club: Club | null; organizerAssigned: boolean }> {
  if (!collegeName) return { club: null, organizerAssigned: false };
  const normalizedCollege = collegeName.trim();
  const upper = normalizedCollege.toUpperCase();

  if (!normalizedCollege || upper === 'ALL' || upper === 'ALL CAMPUSES' || upper === 'ALL_CAMPUSES') {
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

  // 3. Assign the first member as organizer
  const organizerAssigned = await assignFirstMemberAsOrganizer(targetClub, normalizedCollege, candidateUserId);

  return { club: targetClub, organizerAssigned };
}

/**
 * Assigns the first registered member of the college as the organizer of the club.
 * If candidateUserId is specified, uses that user (if the club has no organizer yet).
 * Otherwise finds the earliest registered member in profiles.
 */
export async function assignFirstMemberAsOrganizer(
  club: Club,
  collegeName: string,
  candidateUserId?: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const normCollegeUpper = collegeName.trim().toUpperCase();

  try {
    // 1. Check if an organizer is already assigned to this club
    const { data: existingOrgs, error: orgErr } = await supabase
      .from('profiles')
      .select('id, role, club_id')
      .eq('club_id', club.id)
      .eq('role', 'organizer');

    if (!orgErr && Array.isArray(existingOrgs) && existingOrgs.length > 0) {
      // Club already has an assigned organizer
      return false;
    }

    let targetUserId: string | null = null;

    if (candidateUserId) {
      targetUserId = candidateUserId;
    } else {
      // Find the first member registered in this college (non-admin)
      const { data: members, error: memErr } = await supabase
        .from('profiles')
        .select('id, role, college, created_at')
        .neq('role', 'admin')
        .order('created_at', { ascending: true });

      if (!memErr && Array.isArray(members)) {
        const collegeMember = members.find(
          (m) => ((m as any).college || DEFAULT_COLLEGE).trim().toUpperCase() === normCollegeUpper
        );
        if (collegeMember) {
          targetUserId = collegeMember.id;
        }
      }
    }

    if (!targetUserId) {
      return false;
    }

    // Assign as organizer of this club
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        role: 'organizer',
        club_id: club.id,
      })
      .eq('id', targetUserId);

    if (updateErr) {
      console.warn('[ClubsHelper] Error updating profile to organizer:', updateErr.message);
      return false;
    }

    // Update Supabase Auth user_metadata so JWT / session reflect organizer role
    try {
      await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          role: 'organizer',
          club_id: club.id,
        },
      });
    } catch (authMetaErr) {
      console.warn('[ClubsHelper] Supabase auth metadata update notice:', authMetaErr);
    }

    try {
      await appCache.invalidateTags(['auth_sessions']);
    } catch {}

    console.log(
      `[ClubsHelper] Successfully assigned first member ${targetUserId} as organizer for club ${club.name} (${collegeName})`
    );
    return true;
  } catch (err) {
    console.warn('[ClubsHelper] Error assigning first member as organizer:', err);
    return false;
  }
}

import { createAdminClient } from '../utils/supabase/admin';
import { autoSetupHackerRankCrewForCollege } from './clubsHelper';

export const DEFAULT_COLLEGE = 'MIET';

// In-memory cache to guarantee immediate persistence across requests even prior to migration
const inMemoryColleges = new Set<string>();

export async function getAllColleges(): Promise<string[]> {
  const collegesSet = new Set<string>();
  // Primary default
  collegesSet.add(DEFAULT_COLLEGE);

  // Add all cached in-memory colleges
  inMemoryColleges.forEach((c) => collegesSet.add(c));

  try {
    const supabase = createAdminClient();

    // 1. Fetch from colleges table
    const { data: collegesData, error: collegesErr } = await supabase
      .from('colleges')
      .select('name')
      .order('name', { ascending: true });

    if (!collegesErr && collegesData) {
      collegesData.forEach((c: { name: string }) => {
        if (c.name && c.name.trim()) {
          collegesSet.add(c.name.trim());
          inMemoryColleges.add(c.name.trim());
        }
      });
    }

    // 2. Fallback / union with distinct colleges from profiles table
    const { data: profileColleges, error: profileErr } = await supabase
      .from('profiles')
      .select('college');

    if (!profileErr && profileColleges) {
      profileColleges.forEach((p: { college: string | null }) => {
        if (p.college && p.college.trim()) {
          collegesSet.add(p.college.trim());
          inMemoryColleges.add(p.college.trim());
        }
      });
    }

    // 3. Fallback / union with distinct colleges from clubs table
    const { data: clubColleges, error: clubErr } = await supabase
      .from('clubs')
      .select('college');

    if (!clubErr && clubColleges) {
      clubColleges.forEach((c: { college: string | null }) => {
        if (c.college && c.college.trim()) {
          collegesSet.add(c.college.trim());
          inMemoryColleges.add(c.college.trim());
        }
      });
    }
  } catch (err) {
    console.warn('[CollegesHelper] Error loading colleges, returning default:', err);
  }

  // Convert to array with MIET always first
  const list = Array.from(collegesSet);
  const otherColleges = list
    .filter((c) => c.toUpperCase() !== DEFAULT_COLLEGE.toUpperCase())
    .sort((a, b) => a.localeCompare(b));

  return [DEFAULT_COLLEGE, ...otherColleges];
}

export async function ensureCollegeExists(rawName: string): Promise<string> {
  if (!rawName) return DEFAULT_COLLEGE;
  const trimmed = rawName.trim();
  if (!trimmed) return DEFAULT_COLLEGE;

  if (trimmed.toUpperCase() === 'ALL' || trimmed.toUpperCase() === 'ALL CAMPUSES') {
    return 'ALL';
  }

  // If multiple comma-separated colleges
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
    await Promise.all(parts.map((p) => ensureCollegeExists(p)));
    return trimmed;
  }

  // Normalize MIET
  if (trimmed.toUpperCase() === 'MIET') {
    try {
      await autoSetupHackerRankCrewForCollege(DEFAULT_COLLEGE);
    } catch {}
    return DEFAULT_COLLEGE;
  }

  // Cache in-memory immediately for real-time reactivity
  inMemoryColleges.add(trimmed);

  try {
    const supabase = createAdminClient();
    // Insert if not exists
    const { error } = await (supabase.from('colleges') as any)
      .upsert(
        { name: trimmed, code: trimmed.slice(0, 10).toUpperCase() },
        { onConflict: 'name', ignoreDuplicates: true }
      );
    if (error) {
      console.warn('[CollegesHelper] Supabase colleges table upsert notice:', error.message);
    }
  } catch (err: any) {
    console.warn('[CollegesHelper] Could not persist new college to database:', err?.message || err);
  }

  // Automatically initialize the hackerrankcampuscrew club for this new college
  // and assign the first member as the organizer if present
  try {
    await autoSetupHackerRankCrewForCollege(trimmed);
  } catch (err: any) {
    console.warn('[CollegesHelper] Error auto-setting up hackerrank crew:', err?.message || err);
  }

  return trimmed;
}

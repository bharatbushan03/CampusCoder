export type CompetitionType = 'all' | 'hackathon' | 'competitive-programming' | 'ai-data' | 'open-source' | 'flagship';
export type CompetitionDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type CompetitionStatus = 'Live Now' | 'Registration Open' | 'Upcoming' | 'Weekly Recurring' | 'Annual Flagship' | 'Concluded';

export interface TimelineStep {
  stage: string;
  date: string;
  description: string;
  isCompleted?: boolean;
  isActive?: boolean;
}

export interface CompetitionItem {
  id: string;
  title: string;
  subtitle: string;
  platform: string;
  platformUrl: string;
  type: CompetitionType;
  difficulty: CompetitionDifficulty;
  prizePool: string;
  teamSize: string;
  mode: 'Online' | 'Hybrid' | 'In-Person';
  status: CompetitionStatus;
  startDate?: string;
  deadlineDate: string;
  targetDate: string;
  concludedDate?: string;
  description: string;
  tags: string[];
  bannerGradient: string;
  perks: string[];
  eligibility: string;
  timeline: TimelineStep[];
  prepKit: {
    title: string;
    description: string;
    url: string;
  }[];
  checklist: string[];
  featured?: boolean;
}

export type CompetitionDateState = 'live' | 'upcoming' | 'concluded';

/**
 * Calculates the current real-time state of a competition based on timestamps.
 * If the target/end date of an active live competition has passed, it automatically
 * transitions to 'concluded' without requiring manual database status edits.
 */
export function getCompetitionDateState(comp: CompetitionItem): CompetitionDateState {
  if (!comp) return 'upcoming';
  if (comp.status === 'Concluded') return 'concluded';

  const now = Date.now();

  // Try parsing targetDate ISO timestamp or deadlineDate string
  let targetMs = NaN;
  if (comp.targetDate) {
    const parsed = new Date(comp.targetDate).getTime();
    if (!isNaN(parsed)) targetMs = parsed;
  }
  if (isNaN(targetMs) && comp.deadlineDate) {
    const parsed = new Date(comp.deadlineDate).getTime();
    if (!isNaN(parsed)) targetMs = parsed;
  }

  let startMs = 0;
  if (comp.startDate) {
    const parsed = new Date(comp.startDate).getTime();
    if (!isNaN(parsed)) startMs = parsed;
  }

  // Automatic expiration rule: If target/deadline date is in the past, it is Concluded
  if (!isNaN(targetMs) && targetMs <= now) {
    return 'concluded';
  }

  // Live rule:
  // 1. Explicitly tagged 'Live Now' and target date has not passed
  // 2. Start date has arrived (now >= startMs) and target date is still in the future (now < targetMs)
  if (comp.status === 'Live Now') {
    return 'live';
  }

  if (startMs > 0 && startMs <= now && (!isNaN(targetMs) ? targetMs > now : true)) {
    return 'live';
  }

  return 'upcoming';
}


/**
 * Dynamic competitions registry.
 * Static mock competitions removed per request so that all competitions
 * are dynamically loaded from the database via `/api/competitions` and managed
 * in the Admin Portal (/admin/competitions).
 */
export const competitionsData: CompetitionItem[] = [];

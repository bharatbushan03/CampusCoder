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

export function getCompetitionDateState(comp: CompetitionItem): CompetitionDateState {
  if (!comp) return 'upcoming';
  if (comp.status === 'Concluded') return 'concluded';

  const now = Date.now();
  const targetMs = new Date(comp.targetDate).getTime();
  const startMs = comp.startDate ? new Date(comp.startDate).getTime() : 0;

  if (!isNaN(targetMs) && targetMs < now) {
    return 'concluded';
  }

  if (comp.status === 'Live Now') {
    return 'live';
  }

  if (startMs && startMs <= now && targetMs > now) {
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

import { describe, it, expect } from 'vitest';
import { notesData } from './notesData';
import { getCompetitionDateState, CompetitionItem } from './competitionsData';
import { resourceSchema, competitionSchema } from '@/lib/validation';

describe('Resources & Academic Data Integration', () => {
  it('validates dynamic resourceSchema and competitionSchema successfully', () => {
    const validResource = {
      title: 'Full Stack Open',
      description: 'Deep dive into modern web development with React, Redux, Node.js, GraphQL, and TypeScript.',
      link: 'https://fullstackopen.com/',
      category: 'courses',
      is_active: true,
    };

    const parsedResource = resourceSchema.safeParse(validResource);
    expect(parsedResource.success).toBe(true);

    const validCompetition = {
      title: 'Smart India Hackathon 2026',
      subtitle: 'World Largest Hackathon',
      platform: 'AICTE',
      platform_url: 'https://sih.gov.in/',
      type: 'hackathon',
      difficulty: 'All Levels',
      deadline_date: 'Oct 15, 2026',
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Live Now',
      is_active: true,
    };

    const parsedComp = competitionSchema.safeParse(validCompetition);
    expect(parsedComp.success).toBe(true);
  });

  it('contains 1st year and 2nd year subject notes', () => {
    const firstYearNotes = notesData.filter(n => n.year === '1st-year');
    const secondYearNotes = notesData.filter(n => n.year === '2nd-year');

    expect(firstYearNotes.length).toBeGreaterThan(0);
    expect(secondYearNotes.length).toBeGreaterThan(0);

    // 1st year should have sem-1 and sem-2 subjects
    expect(firstYearNotes.some(n => n.semester === 'sem-1')).toBe(true);
    expect(firstYearNotes.some(n => n.semester === 'sem-2')).toBe(true);

    // 2nd year should have sem-3 and sem-4 subjects
    expect(secondYearNotes.some(n => n.semester === 'sem-3')).toBe(true);
    expect(secondYearNotes.some(n => n.semester === 'sem-4')).toBe(true);

    // Every note should have topics and highlights
    notesData.forEach(note => {
      expect(note.topics.length).toBeGreaterThan(0);
      expect(note.highlights.length).toBeGreaterThan(0);
      expect(note.code).toBeTruthy();
    });
  });

  it('correctly classifies competitions by date into live, upcoming, and concluded', () => {
    const sampleLive: CompetitionItem = {
      id: 'comp-1',
      title: 'Live Arena',
      subtitle: 'Live contest',
      platform: 'LeetCode',
      platformUrl: 'https://leetcode.com',
      type: 'competitive-programming',
      difficulty: 'Intermediate',
      prizePool: 'Swag',
      teamSize: 'Solo',
      mode: 'Online',
      status: 'Live Now',
      startDate: new Date(Date.now() - 3600 * 1000).toISOString(),
      deadlineDate: 'Today',
      targetDate: new Date(Date.now() + 3600 * 1000).toISOString(),
      description: 'Active contest',
      tags: ['algo'],
      bannerGradient: 'from-emerald-500/20 to-teal-500/20',
      perks: [],
      eligibility: 'All',
      timeline: [],
      prepKit: [],
      checklist: []
    };

    const sampleUpcoming: CompetitionItem = {
      id: 'comp-2',
      title: 'Upcoming Hackathon',
      subtitle: 'Future contest',
      platform: 'Devpost',
      platformUrl: 'https://devpost.com',
      type: 'hackathon',
      difficulty: 'Beginner',
      prizePool: '$10k',
      teamSize: '1-4',
      mode: 'Online',
      status: 'Registration Open',
      deadlineDate: 'Next Month',
      targetDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      description: 'Future contest',
      tags: ['hack'],
      bannerGradient: 'from-cyan-500/20 to-blue-500/20',
      perks: [],
      eligibility: 'All',
      timeline: [],
      prepKit: [],
      checklist: []
    };

    const sampleConcluded: CompetitionItem = {
      id: 'comp-3',
      title: 'Concluded Hackathon',
      subtitle: 'Past contest',
      platform: 'AICTE',
      platformUrl: 'https://sih.gov.in',
      type: 'hackathon',
      difficulty: 'All Levels',
      prizePool: '₹1 Lakh',
      teamSize: '6',
      mode: 'Offline',
      status: 'Concluded',
      deadlineDate: 'Dec 2025',
      targetDate: '2025-12-12T18:00:00.000Z',
      concludedDate: 'Dec 12, 2025',
      description: 'Past championship',
      tags: ['archive'],
      bannerGradient: 'from-slate-800 to-slate-900',
      perks: [],
      eligibility: 'All',
      timeline: [],
      prepKit: [],
      checklist: []
    };

    expect(getCompetitionDateState(sampleLive)).toBe('live');
    expect(getCompetitionDateState(sampleUpcoming)).toBe('upcoming');
    expect(getCompetitionDateState(sampleConcluded)).toBe('concluded');
  });
});

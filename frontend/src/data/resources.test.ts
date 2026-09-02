import { describe, it, expect } from 'vitest';
import { notesData } from './notesData';
import { getCompetitionDateState, CompetitionItem } from './competitionsData';
import { resourceSchema, competitionSchema, noteSchema } from '@/lib/validation';

describe('Resources & Academic Data Integration', () => {
  it('validates dynamic resourceSchema, competitionSchema, and noteSchema successfully', () => {
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

    const validNote = {
      title: 'Data Structures and Algorithms Complete Hand-written Notes',
      code: 'CS201',
      subject: 'Data Structures & Algorithms',
      year: '2nd-year',
      semester: 'sem-3',
      branch: 'CSE / IT',
      description: 'Comprehensive handwritten guide covering binary search trees, AVL trees, graphs, and dynamic programming.',
      pdf_url: 'https://example.com/dsa-notes.pdf',
      file_size: '6.2 MB',
      page_count: 88,
      author: 'CampusCoder Tech Team',
      tags: ['DSA', 'Trees', 'Graphs'],
      topics: [{ title: 'Module 1', subtopics: ['Trees', 'Graphs'] }],
      highlights: ['Includes complexity cheat sheet'],
      is_active: true,
    };

    const parsedNote = noteSchema.safeParse(validNote);
    expect(parsedNote.success).toBe(true);
  });

  it('handles dynamic subject notes data and schema structures', () => {
    expect(Array.isArray(notesData)).toBe(true);

    const sampleNote = {
      title: 'Operating Systems Complete Handbook',
      code: 'CS205',
      subject: 'Operating Systems',
      year: '2nd-year',
      semester: 'sem-4',
      branch: 'CSE / IT',
      description: 'Handwritten notes covering CPU scheduling, Banker algorithm, and memory paging.',
      pdf_url: 'https://example.com/os-notes.pdf',
      file_size: '5.4 MB',
      page_count: 72,
      author: 'CampusCoder Academic Team',
      tags: ['OS', 'Processes', 'Threads'],
      topics: [{ title: 'Module 1: Concurrency', subtopics: ['Semaphores', 'Deadlocks'] }],
      highlights: ['Step-by-step Banker algorithm solver'],
      is_active: true,
    };

    const parsed = noteSchema.safeParse(sampleNote);
    expect(parsed.success).toBe(true);
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
      mode: 'In-Person',
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

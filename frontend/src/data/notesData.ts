export type YearLevel = '1st-year' | '2nd-year' | '3rd-year' | '4th-year';
export type SemesterLevel = 'all' | 'sem-1' | 'sem-2' | 'sem-3' | 'sem-4' | 'sem-5' | 'sem-6' | 'sem-7' | 'sem-8';

export interface NoteTopic {
  title: string;
  subtopics: string[];
}

export interface SubjectNote {
  id: string;
  title: string;
  code: string;
  year: YearLevel;
  semester: 'sem-1' | 'sem-2' | 'sem-3' | 'sem-4' | 'sem-5' | 'sem-6' | 'sem-7' | 'sem-8';
  description: string;
  credits?: number;
  badgeColor?: string;
  tags: string[];
  topics: NoteTopic[];
  resources: {
    handwrittenNotesUrl?: string;
    typedNotesUrl?: string;
    cheatSheetUrl?: string;
    pyqUrl?: string;
    videoPlaylistUrl?: string;
  };
  highlights: string[];
}

/**
 * Dynamic subject notes registry.
 * Static mock items removed per user request so that all academic notes and handbooks
 * are dynamically managed and added via the website Admin Portal (/admin/notes).
 */
export const notesData: SubjectNote[] = [];

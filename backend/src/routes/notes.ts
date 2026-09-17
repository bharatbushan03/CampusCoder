import { Router, type Request, type Response } from 'express';
import { createAnonClient } from '../middleware/auth';
import { cacheRoute } from '../lib/cache';
import { queryAzure } from '../lib/azureDb';

const router = Router();

router.get('/', cacheRoute(60, ['notes'], 30), async (req: Request, res: Response) => {
  const { year, semester, search } = req.query;

  // 1. Try Azure Database first if configured & healthy
  const conditions: string[] = ['is_active = true'];
  const params: any[] = [];
  let paramIdx = 1;

  if (year && typeof year === 'string' && year !== 'all') {
    conditions.push(`year = $${paramIdx++}`);
    params.push(year);
  }
  if (semester && typeof semester === 'string' && semester !== 'all') {
    conditions.push(`semester = $${paramIdx++}`);
    params.push(semester);
  }
  if (search && typeof search === 'string' && search.trim()) {
    conditions.push(`(title ILIKE $${paramIdx} OR code ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR subject ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  const azureSql = `SELECT * FROM public.notes WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
  const azureNotes = await queryAzure(azureSql, params);
  if (azureNotes !== null) {
    return res.json({ ok: true, notes: azureNotes, source: 'azure' });
  }

  // 2. Resilient Supabase fallback
  const supabase = createAnonClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (year && typeof year === 'string' && year !== 'all') {
    query = query.eq('year', year);
  }

  if (semester && typeof semester === 'string' && semester !== 'all') {
    query = query.eq('semester', semester);
  }

  if (search && typeof search === 'string' && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,subject.ilike.%${search.trim()}%`);
  }

  const { data, error } = await query;

  const fallbackSeedNotes = [
    {
      id: 'note-math101-seed',
      title: 'Engineering Mathematics - I (Calculus & Linear Algebra)',
      code: 'MATH101',
      subject: 'Engineering Mathematics',
      year: '1st-year',
      semester: 'sem-1',
      branch: 'All Branches',
      description: 'Foundational calculus, linear algebra, matrices, rank, eigenvalues, and multivariable functions essential for all engineering branches.',
      pdf_url: 'https://tutorial.math.lamar.edu/pdf/Calculus_Cheat_Sheet_All.pdf',
      file_size: '4.8 MB',
      page_count: 52,
      author: 'Prof. Sharma (Mathematics Dept)',
      tags: ['Calculus', 'Linear Algebra', 'Matrices', 'Eigenvalues', 'Limits'],
      topics: [
        { title: 'Module 1: Matrix Theory & Linear Algebra', subtopics: ['Matrix Rank & Echelon Form', 'System of Linear Equations', 'Eigenvalues & Eigenvectors'] },
        { title: 'Module 2: Differential Calculus', subtopics: ['Rolle’s & Mean Value Theorems', 'Taylor’s & Maclaurin’s Series', 'Indeterminate Forms'] },
        { title: 'Module 3: Multivariable Calculus', subtopics: ['Partial Derivatives', 'Total Differential', 'Jacobians', 'Maxima & Minima'] }
      ],
      highlights: ['Complete formula sheets for Cayley-Hamilton & Eigenvalues', 'Handwritten step-by-step solved PYQs from last 5 years', 'Quick revision cheat sheet for partial derivatives and Jacobians'],
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'note-cs101-seed',
      title: 'Programming for Problem Solving in C',
      code: 'CS101',
      subject: 'Programming in C',
      year: '1st-year',
      semester: 'sem-1',
      branch: 'All Branches',
      description: 'Structured programming fundamentals in C covering variables, pointers, dynamic memory allocation, structs, and file handling.',
      pdf_url: 'https://www.unf.edu/~wkloster/2220/ppts/cprogramming_tutorial.pdf',
      file_size: '3.6 MB',
      page_count: 64,
      author: 'CampusCoder Academic Team',
      tags: ['C Language', 'Pointers', 'Arrays', 'Structures', 'Memory Allocation'],
      topics: [
        { title: 'Module 1: C Basics & Control Flow', subtopics: ['Data Types & Operators', 'Conditional Statements (if-else, switch)', 'Loops (for, while, do-while)'] },
        { title: 'Module 2: Arrays, Strings & Pointers', subtopics: ['1D and 2D Arrays', 'String Manipulation Library Functions', 'Pointer Arithmetic & Double Pointers'] },
        { title: 'Module 3: Structures & File I/O', subtopics: ['Struct vs Union', 'DMA (malloc, calloc, realloc, free)', 'File Operations (fopen, fread, fwrite)'] }
      ],
      highlights: ['Visual memory layout diagrams for Pointer Arithmetic and Dynamic Allocation', '30+ tested executable C program templates for lab exams', 'Common viva-voce questions with answers for end-semester practicals'],
      is_active: true,
      created_at: '2026-01-02T00:00:00.000Z'
    },
    {
      id: 'note-cs201-seed',
      title: 'Data Structures and Algorithms (Handwritten Complete Notes)',
      code: 'CS201',
      subject: 'Data Structures & Algorithms',
      year: '2nd-year',
      semester: 'sem-3',
      branch: 'CSE / IT',
      description: 'Comprehensive handwritten guide covering linear data structures, binary search trees, AVL trees, graphs, heaps, dynamic programming, and complexity analysis.',
      pdf_url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec01/',
      file_size: '6.2 MB',
      page_count: 88,
      author: 'CampusCoder Tech Team',
      tags: ['DSA', 'Trees', 'Graphs', 'Dynamic Programming', 'Complexity'],
      topics: [
        { title: 'Module 1: Linear Structures & Stacks/Queues', subtopics: ['Singly, Doubly, Circular Linked Lists', 'Stack Applications (Infix to Postfix)', 'Queue & Deque Implementations'] },
        { title: 'Module 2: Non-Linear Structures (Trees & Heaps)', subtopics: ['Binary Search Trees (BST) Traversal', 'AVL Tree Rotations', 'Min/Max Heap Operations & HeapSort'] },
        { title: 'Module 3: Graph Algorithms & Dynamic Programming', subtopics: ['BFS & DFS Traversals', 'Dijkstra & Kruskal MST', '0/1 Knapsack & LCS Problems'] }
      ],
      highlights: ['Clean ASCII and handwritten tree rotation diagrams', 'Time and space complexity cheat sheet for all standard operations', 'Curated LeetCode problem mappings with matching theory modules'],
      is_active: true,
      created_at: '2026-01-03T00:00:00.000Z'
    },
    {
      id: 'note-cs204-seed',
      title: 'Database Management Systems (DBMS) Comprehensive Guide',
      code: 'CS204',
      subject: 'DBMS',
      year: '2nd-year',
      semester: 'sem-4',
      branch: 'CSE / IT',
      description: 'Relational algebra, SQL query optimization, ER modeling, B+ Trees indexing, 1NF to BCNF Normalization, and ACID transaction concurrency protocols.',
      pdf_url: 'https://web.stanford.edu/class/cs145/notes/cs145-notes.pdf',
      file_size: '5.1 MB',
      page_count: 72,
      author: 'Prof. R. Verma (CSE Dept)',
      tags: ['DBMS', 'SQL', 'Normalization', 'Transactions', 'Indexing'],
      topics: [
        { title: 'Module 1: ER Modeling & Relational Algebra', subtopics: ['ER to Relational Schema Mapping', 'Relational Algebra Operations', 'Integrity Constraints'] },
        { title: 'Module 2: SQL & Schema Normalization', subtopics: ['Complex Joins, Subqueries & Aggregations', 'Functional Dependencies & Candidate Keys', '1NF, 2NF, 3NF, BCNF Decomposition'] },
        { title: 'Module 3: Transactions & Concurrency Control', subtopics: ['ACID Properties', 'Serializability & Precedence Graphs', 'Two-Phase Locking (2PL) & Deadlocks'] }
      ],
      highlights: ['Step-by-step BCNF and 3NF decomposition solver tables', 'SQL query templates for multi-table joins and subquery optimizations', 'Concurrency control conflict serializability practice questions'],
      is_active: true,
      created_at: '2026-01-04T00:00:00.000Z'
    }
  ];

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('[Supabase] public.notes table not yet created in database. Using curated fallbacks.');
      let filtered = fallbackSeedNotes;
      if (year && typeof year === 'string' && year !== 'all') {
        filtered = filtered.filter(n => n.year === year);
      }
      if (semester && typeof semester === 'string' && semester !== 'all') {
        filtered = filtered.filter(n => n.semester === semester);
      }
      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.code.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
      }
      return res.json({ ok: true, notes: filtered, source: 'fallback' });
    }
    console.error('Error fetching public notes:', error);
    return res.status(500).json({ ok: false, error: 'Failed to load notes' });
  }

  const resultNotes = data || [];
  return res.json({ ok: true, notes: resultNotes, source: (data && data.length > 0) ? 'supabase' : 'fallback' });
});

export { router as notesRouter };


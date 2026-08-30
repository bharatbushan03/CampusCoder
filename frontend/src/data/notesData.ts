export type YearLevel = '1st-year' | '2nd-year';
export type SemesterLevel = 'all' | 'sem-1' | 'sem-2' | 'sem-3' | 'sem-4';

export interface NoteTopic {
  title: string;
  subtopics: string[];
}

export interface SubjectNote {
  id: string;
  title: string;
  code: string;
  year: YearLevel;
  semester: 'sem-1' | 'sem-2' | 'sem-3' | 'sem-4';
  description: string;
  credits: number;
  badgeColor: string;
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

export const notesData: SubjectNote[] = [
  // ================= 1ST YEAR (SEMESTER 1) =================
  {
    id: 'maths-1',
    title: 'Engineering Mathematics - I',
    code: 'MATH101',
    year: '1st-year',
    semester: 'sem-1',
    description: 'Foundational calculus, linear algebra, matrices, rank, eigenvalues, and multivariable functions essential for all engineering branches.',
    credits: 4,
    badgeColor: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
    tags: ['Calculus', 'Linear Algebra', 'Matrices', 'Eigenvalues', 'Limits & Continuity'],
    topics: [
      {
        title: 'Module 1: Matrix Theory & Linear Algebra',
        subtopics: ['Matrix Rank & Echelon Form', 'System of Linear Equations', 'Eigenvalues & Eigenvectors', 'Cayley-Hamilton Theorem']
      },
      {
        title: 'Module 2: Differential Calculus',
        subtopics: ['Rolle’s & Mean Value Theorems', 'Taylor’s & Maclaurin’s Series', 'Indeterminate Forms & L’Hopital’s Rule']
      },
      {
        title: 'Module 3: Multivariable Calculus',
        subtopics: ['Partial Derivatives', 'Total Differential & Chain Rule', 'Jacobians', 'Maxima & Minima of Two Variables']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://github.com/topics/engineering-notes',
      cheatSheetUrl: 'https://tutorial.math.lamar.edu/pdf/Calculus_Cheat_Sheet_All.pdf',
      pyqUrl: 'https://gateoverflow.in/',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLbRMhDVUMngcf7iZf9rR_2XfUqX4q9m_3'
    },
    highlights: ['Includes 100+ Solved Matrix Problems', 'Formula Sheet for Multivariable Maxima', 'Solved University Question Papers (2020-2025)']
  },
  {
    id: 'c-programming',
    title: 'Programming in C & Problem Solving',
    code: 'CSE101',
    year: '1st-year',
    semester: 'sem-1',
    description: 'Core logic building, pointers, dynamic memory management, structures, recursion, and file handling in C.',
    credits: 4,
    badgeColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    tags: ['C Language', 'Pointers', 'Memory Management', 'Data Types', 'File I/O'],
    topics: [
      {
        title: 'Module 1: Basics & Control Structures',
        subtopics: ['Keywords, Identifiers, Operators', 'Branching (if-else, switch)', 'Loops (for, while, do-while)', 'Bitwise Operations']
      },
      {
        title: 'Module 2: Functions, Arrays & Strings',
        subtopics: ['Pass by Value vs Pass by Reference', 'Recursion & Call Stack', '1D & 2D Array Manipulations', 'String Functions without Library']
      },
      {
        title: 'Module 3: Pointers & Dynamic Memory',
        subtopics: ['Pointer Arithmetic & Double Pointers', 'malloc(), calloc(), realloc(), free()', 'Structures, Unions & Typedef', 'File Operations (fopen, fread, fwrite)']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://www.learn-c.org/',
      cheatSheetUrl: 'https://quickref.me/c',
      pyqUrl: 'https://github.com/topics/c-programming-notes',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLfqMhTWNBTe3H6c9OGXb5_6wcc1Mca52n'
    },
    highlights: ['Pointer Visualization Cheat Sheet', '50 Classic C Programs with Explanations', 'Memory Leak Prevention Guide']
  },
  {
    id: 'beee',
    title: 'Basic Electrical & Electronics Engineering',
    code: 'EEE101',
    year: '1st-year',
    semester: 'sem-1',
    description: 'Circuit analysis theorems (KVL/KCL, Thevenin, Norton), AC fundamentals, semiconductor diodes, BJTs, and digital logic gates.',
    credits: 3,
    badgeColor: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    tags: ['KVL/KCL', 'Thevenin', 'Semiconductors', 'Diodes', 'BJTs', 'Logic Gates'],
    topics: [
      {
        title: 'Module 1: DC Circuit Analysis',
        subtopics: ['Kirchhoff’s Laws (KVL/KCL)', 'Mesh & Nodal Analysis', 'Thevenin’s & Norton’s Theorems', 'Maximum Power Transfer']
      },
      {
        title: 'Module 2: AC Fundamentals & Transformers',
        subtopics: ['Single Phase AC, Phasor Diagrams', 'RL, RC, RLC Series Resonance', 'Single Phase Transformer Working & Efficiency']
      },
      {
        title: 'Module 3: Semiconductor Devices & Digital Basics',
        subtopics: ['PN Junction Diode & Rectifiers', 'Bipolar Junction Transistor (BJT) Characteristics', 'Logic Gates & Boolean Simplification']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://www.allaboutcircuits.com/textbook/',
      cheatSheetUrl: 'https://engineering.purdue.edu/',
      pyqUrl: 'https://gateoverflow.in/',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PL9RcWoqXmzaLTYUdnzKhF4bYug3GjGcEc'
    },
    highlights: ['Network Theorems Step-by-Step Solver Guide', 'BJT Biasing Formulas Summary', 'Logic Gate Truth Tables & K-Maps Cheat Sheet']
  },
  {
    id: 'eng-physics',
    title: 'Engineering Physics & Quantum Mechanics',
    code: 'PHY101',
    year: '1st-year',
    semester: 'sem-1',
    description: 'Wave optics, lasers, fiber optics, wave-particle duality, Schrödinger wave equation, and semiconductor physics.',
    credits: 3,
    badgeColor: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
    tags: ['Optics', 'Lasers', 'Fiber Optics', 'Quantum', 'Schrödinger', 'Semiconductors'],
    topics: [
      {
        title: 'Module 1: Wave Optics & Interference',
        subtopics: ['Thin Film Interference', 'Newton’s Rings Experiment', 'Fraunhofer Diffraction through Single/Double Slit']
      },
      {
        title: 'Module 2: Lasers & Optical Fibers',
        subtopics: ['Spontaneous & Stimulated Emission', 'He-Ne & Ruby Laser Systems', 'Numerical Aperture & Fiber Attenuation']
      },
      {
        title: 'Module 3: Quantum Physics & Nanomaterials',
        subtopics: ['De-Broglie Hypothesis', 'Schrödinger 1D Wave Equation', 'Particle in a 1D Box', 'Introduction to Carbon Nanotubes']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://ocw.mit.edu/courses/physics/',
      cheatSheetUrl: 'https://hyperphysics.phy-astr.gsu.edu/',
      pyqUrl: 'https://gateoverflow.in/',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLbRMhDVUMngca3_C9Dq_V_D9c5j7eHj2r'
    },
    highlights: ['Derivation Guide for All Major Formulas', 'Newton Rings & Diffraction Diagrams', 'Quantum Mechanics Short Notes']
  },

  // ================= 1ST YEAR (SEMESTER 2) =================
  {
    id: 'maths-2',
    title: 'Engineering Mathematics - II',
    code: 'MATH102',
    year: '1st-year',
    semester: 'sem-2',
    description: 'Ordinary & partial differential equations, Laplace transforms, Fourier series, and vector calculus for engineers.',
    credits: 4,
    badgeColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
    tags: ['Differential Equations', 'Laplace Transforms', 'Fourier Series', 'Vector Calculus', 'Green-Stokes'],
    topics: [
      {
        title: 'Module 1: Ordinary Differential Equations',
        subtopics: ['First Order Linear & Exact Equations', 'Higher Order Homogeneous Linear ODEs', 'Method of Variation of Parameters']
      },
      {
        title: 'Module 2: Laplace Transforms',
        subtopics: ['Standard Laplace Transforms & Properties', 'Inverse Laplace & Convolution Theorem', 'Solving ODEs using Laplace']
      },
      {
        title: 'Module 3: Vector Calculus & Integral Theorems',
        subtopics: ['Gradient, Divergence & Curl', 'Line, Surface & Volume Integrals', 'Green’s, Gauss Divergence & Stokes Theorems']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://tutorial.math.lamar.edu/Classes/DE/DE.aspx',
      cheatSheetUrl: 'https://tutorial.math.lamar.edu/pdf/Laplace_Table.pdf',
      pyqUrl: 'https://gateoverflow.in/',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLbRMhDVUMngfdZX7QdOkmT5CkhLqQp5oP'
    },
    highlights: ['Laplace Transform Table with Proofs', 'Vector Identities Quick Reference', '10-year University PYQ Solutions']
  },
  {
    id: 'python-pps',
    title: 'Python for Problem Solving',
    code: 'CSE102',
    year: '1st-year',
    semester: 'sem-2',
    description: 'Python syntax, data structures (lists, tuples, dicts, sets), OOP in Python, exception handling, and file manipulation.',
    credits: 3,
    badgeColor: 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30',
    tags: ['Python', 'OOP', 'Data Structures', 'File Handling', 'Exceptions'],
    topics: [
      {
        title: 'Module 1: Core Syntax & Data Structures',
        subtopics: ['Variables, Loops, Functions', 'Lists, Slicing & List Comprehensions', 'Tuples, Dictionaries, Sets']
      },
      {
        title: 'Module 2: OOP & Modules',
        subtopics: ['Classes, Objects, Constructors (__init__)', 'Inheritance & Polymorphism', 'Standard Library & Imports']
      },
      {
        title: 'Module 3: Exception Handling & File I/O',
        subtopics: ['try-except-finally Blocks', 'Custom Exceptions', 'CSV & JSON File Parsing']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://docs.python.org/3/tutorial/',
      cheatSheetUrl: 'https://quickref.me/python',
      pyqUrl: 'https://github.com/gto76/python-cheatsheet',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PL-osiE80TeTskrapNbzXhCo421U3883lR'
    },
    highlights: ['Python Built-in Methods Cheat Sheet', 'OOP Concepts with Code Examples', 'Hands-on Mini Projects List']
  },

  // ================= 2ND YEAR (SEMESTER 3) =================
  {
    id: 'dsa-core',
    title: 'Data Structures & Algorithms (DSA)',
    code: 'CSE201',
    year: '2nd-year',
    semester: 'sem-3',
    description: 'Arrays, Linked Lists, Stacks, Queues, Binary Trees, BSTs, Heaps, Graph traversals (BFS/DFS), Sorting, and Asymptotic Complexity.',
    credits: 4,
    badgeColor: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
    tags: ['DSA', 'Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Big-O', 'Recursion'],
    topics: [
      {
        title: 'Module 1: Linear Data Structures',
        subtopics: ['Big-O, Omega, Theta Notations', 'Singly, Doubly, Circular Linked Lists', 'Stacks (Infix to Postfix), Queues & Deque']
      },
      {
        title: 'Module 2: Non-Linear Structures: Trees & Heaps',
        subtopics: ['Binary Trees, BST Operations', 'AVL Tree Rotations', 'Min/Max Binary Heaps & Priority Queues']
      },
      {
        title: 'Module 3: Graphs & Algorithm Design',
        subtopics: ['BFS & DFS Traversals', 'Dijkstra’s & Bellman-Ford Shortest Path', 'Kruskal’s & Prim’s MST', 'Sorting (Merge, Quick, Heap)']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://github.com/jwasham/coding-interview-university',
      cheatSheetUrl: 'https://www.bigocheatsheet.com/',
      pyqUrl: 'https://gateoverflow.in/questions/data-structures',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLfqMhTWNBTe0b2nM6JHVCnAkhQRGiZMSJ'
    },
    highlights: ['All Sorting Algorithms Time/Space Summary', 'Tree Traversal Recursion Templates', 'Full C++ STL & Java Collections Guide']
  },
  {
    id: 'oops-cpp-java',
    title: 'Object-Oriented Programming (C++ / Java)',
    code: 'CSE202',
    year: '2nd-year',
    semester: 'sem-3',
    description: 'Encapsulation, Inheritance, Polymorphism, Abstraction, Virtual Functions, Templates/Generics, Exception Handling, and Design Patterns.',
    credits: 4,
    badgeColor: 'from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30',
    tags: ['OOP', 'C++', 'Java', 'Polymorphism', 'Inheritance', 'Design Patterns', 'Templates'],
    topics: [
      {
        title: 'Module 1: 4 Pillars of OOP',
        subtopics: ['Class & Object Lifecycle', 'Encapsulation & Access Modifiers', 'Constructors (Copy, Move) & Destructors']
      },
      {
        title: 'Module 2: Polymorphism & Advanced C++',
        subtopics: ['Function & Operator Overloading', 'Virtual Functions & vtable Mechanism', 'Abstract Classes & Pure Virtual Methods', 'Templates & STL Containers']
      },
      {
        title: 'Module 3: Java OOP & Design Principles',
        subtopics: ['Interfaces vs Abstract Classes', 'Garbage Collection & JVM Memory', 'SOLID Principles & Factory Pattern']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://refactoring.guru/design-patterns',
      cheatSheetUrl: 'https://quickref.me/cpp',
      pyqUrl: 'https://gateoverflow.in/',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4G5b'
    },
    highlights: ['Virtual Table (vtable) Execution Visuals', 'OOP Interview Cheat Sheet', 'SOLID Principles with Real Examples']
  },
  {
    id: 'discrete-maths',
    title: 'Discrete Mathematics & Graph Theory',
    code: 'CSE203',
    year: '2nd-year',
    semester: 'sem-3',
    description: 'Propositional logic, set theory, relations, recurrence relations, combinatorics, graph theory (Euler/Hamilton, coloring), and algebraic structures.',
    credits: 4,
    badgeColor: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
    tags: ['Logic', 'Set Theory', 'Recurrence', 'Graph Theory', 'Combinatorics', 'Boolean Algebra'],
    topics: [
      {
        title: 'Module 1: Mathematical Logic & Sets',
        subtopics: ['Truth Tables & Tautologies', 'Predicate Calculus & Quantifiers', 'Equivalence Relations & Partial Orders (Posets)']
      },
      {
        title: 'Module 2: Counting & Recurrence Relations',
        subtopics: ['Pigeonhole Principle', 'Permutations & Combinations', 'Generating Functions & Master Theorem']
      },
      {
        title: 'Module 3: Graph Theory & Algebraic Structures',
        subtopics: ['Isomorphism, Planar Graphs & Euler Formula', 'Hamiltonian Cycles & Graph Coloring', 'Groups, Subgroups & Rings']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/',
      cheatSheetUrl: 'https://www.cs.cornell.edu/~rafael/discrete-cheatsheet.pdf',
      pyqUrl: 'https://gateoverflow.in/questions/discrete-mathematics',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRhqJPDXcvYlLfXPh37L89g3'
    },
    highlights: ['Recurrence Relations Solving Cheat Sheet', 'Graph Theory Theorems Handbook', 'Solved GATE Previous Year Questions']
  },
  {
    id: 'coa',
    title: 'Computer Organization & Architecture (COA)',
    code: 'CSE204',
    year: '2nd-year',
    semester: 'sem-3',
    description: 'Instruction set architecture (MIPS/x86), ALU design, pipelining, hazards, memory hierarchy (cache mapping), and I/O organization.',
    credits: 3,
    badgeColor: 'from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30',
    tags: ['Architecture', 'Pipelining', 'Cache Memory', 'Hazards', 'ALU', 'MIPS', 'Addressing Modes'],
    topics: [
      {
        title: 'Module 1: Machine Instructions & Addressing',
        subtopics: ['Instruction Cycle & Register Formats', 'Addressing Modes (Immediate, Direct, Indirect)', 'MIPS/RISC vs CISC Architecture']
      },
      {
        title: 'Module 2: Processor Design & Pipelining',
        subtopics: ['Data Path & Control Unit (Hardwired vs Microprogrammed)', 'Pipelining & Pipeline Hazards (Data, Structural, Control)', 'Speedup & Throughput Calculations']
      },
      {
        title: 'Module 3: Memory Hierarchy & Cache Mapping',
        subtopics: ['Direct, Associative, Set-Associative Cache Mapping', 'Cache Misses (Compulsory, Capacity, Conflict)', 'Virtual Memory & Page Tables']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://github.com/topics/computer-architecture',
      cheatSheetUrl: 'https://chortle.ccsu.edu/AssemblyTutorial/Chapter-01/ass01_1.html',
      pyqUrl: 'https://gateoverflow.in/questions/computer-organization',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLbRMhDVUMnge3r_L5h_l2m_m9_R_8_v3G'
    },
    highlights: ['Cache Hit/Miss Numerical Formulas Guide', 'Pipeline Hazard Resolution Summary', 'Addressing Modes Quick Comparison Table']
  },

  // ================= 2ND YEAR (SEMESTER 4) =================
  {
    id: 'os',
    title: 'Operating Systems (OS)',
    code: 'CSE205',
    year: '2nd-year',
    semester: 'sem-4',
    description: 'Process management, CPU scheduling algorithms, synchronization (Semaphores, Mutex), Deadlocks, Memory paging/segmentation, and File Systems.',
    credits: 4,
    badgeColor: 'from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30',
    tags: ['OS', 'Processes', 'Threads', 'Scheduling', 'Semaphores', 'Deadlocks', 'Paging'],
    topics: [
      {
        title: 'Module 1: Processes & CPU Scheduling',
        subtopics: ['Process States, PCB, Context Switching', 'Threads (User vs Kernel Level)', 'FCFS, SJF, Round Robin, Priority Scheduling']
      },
      {
        title: 'Module 2: Concurrency & Deadlocks',
        subtopics: ['Critical Section Problem & Peterson’s Algorithm', 'Semaphores, Mutex & Classical Sync Problems (Producer-Consumer, Dining Philosophers)', 'Deadlock Necessary Conditions & Banker’s Algorithm']
      },
      {
        title: 'Module 3: Memory Management & Storage',
        subtopics: ['Paging, Multi-level Paging & TLB', 'Page Replacement (FIFO, LRU, Optimal)', 'Disk Scheduling (SSTF, SCAN, C-SCAN)']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
      cheatSheetUrl: 'https://github.com/remzi-arpacidusseau/ostep-translations',
      pyqUrl: 'https://gateoverflow.in/questions/operating-system',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRitWLDxKyJ5viU45Yb310ZX'
    },
    highlights: ['Banker’s Algorithm Step-by-Step Solver', 'Page Replacement Calculations Sheet', 'Top 50 OS Interview Questions & Answers']
  },
  {
    id: 'dbms',
    title: 'Database Management Systems (DBMS)',
    code: 'CSE206',
    year: '2nd-year',
    semester: 'sem-4',
    description: 'Relational model, SQL queries, ER modeling, Normalization (1NF to BCNF), Transaction management, ACID properties, and Concurrency control.',
    credits: 4,
    badgeColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    tags: ['DBMS', 'SQL', 'Normalization', 'ER Model', 'ACID', 'Transactions', 'Indexing'],
    topics: [
      {
        title: 'Module 1: ER Model & Relational Algebra',
        subtopics: ['Entity Relationship Diagrams & Mapping to Tables', 'Relational Algebra Operators (Select, Project, Join, Division)', 'Keys (Primary, Candidate, Foreign, Super)']
      },
      {
        title: 'Module 2: SQL & Schema Normalization',
        subtopics: ['Complex SQL Queries, Subqueries & Joins', 'Functional Dependencies & Closure Sets', '1NF, 2NF, 3NF, BCNF Normalization & Lossless Decomposition']
      },
      {
        title: 'Module 3: Transactions & Concurrency Control',
        subtopics: ['ACID Properties & Schedules (Serial, Conflict Serializable)', '2-Phase Locking (2PL), Strict 2PL', 'B-Trees & B+ Trees Indexing Mechanism']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://github.com/topics/dbms-notes',
      cheatSheetUrl: 'https://quickref.me/sql',
      pyqUrl: 'https://gateoverflow.in/questions/databases',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRi_CUQ-FXxgzKQ1dwr_ZJWZ'
    },
    highlights: ['Normalization Deciding Algorithm Flowchart', 'SQL Joins & Window Functions Visuals', 'B+ Tree Insertion & Deletion Cheat Sheet']
  },
  {
    id: 'cn',
    title: 'Computer Networks (CN)',
    code: 'CSE207',
    year: '2nd-year',
    semester: 'sem-4',
    description: 'OSI and TCP/IP stack, Flow/Error control (Sliding Window), IP addressing & Subnetting, Routing protocols (OSPF, BGP), and TCP 3-Way Handshake.',
    credits: 4,
    badgeColor: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
    tags: ['Networks', 'OSI Model', 'TCP/IP', 'Subnetting', 'Routing', 'DNS', 'HTTP'],
    topics: [
      {
        title: 'Module 1: Physical & Data Link Layer',
        subtopics: ['OSI 7 Layers vs TCP/IP 4 Layers', 'Framing, CRC Error Detection & Correction', 'Stop & Wait, Go-Back-N, Selective Repeat ARQ']
      },
      {
        title: 'Module 2: Network Layer & IP Addressing',
        subtopics: ['IPv4 vs IPv6 Header Formats', 'CIDR, Subnetting & Supernetting Calculations', 'Distance Vector (RIP) vs Link State Routing (OSPF)']
      },
      {
        title: 'Module 3: Transport & Application Layers',
        subtopics: ['TCP 3-Way Handshake & Connection Teardown', 'TCP Congestion Control (Slow Start, AIMD)', 'DNS, HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS/SSL']
      }
    ],
    resources: {
      handwrittenNotesUrl: 'https://www.geeksforgeeks.org/computer-network-tutorials/',
      cheatSheetUrl: 'https://packetlife.net/library/cheat-sheets/',
      pyqUrl: 'https://gateoverflow.in/questions/computer-networks',
      videoPlaylistUrl: 'https://www.youtube.com/playlist?list=PLBlnK6fEyqRgMCUAG0XRw78UA8qnv6jEx'
    },
    highlights: ['Subnetting in 60 Seconds Cheat Sheet', 'TCP vs UDP Deep Comparison Chart', 'OSI Layer Protocols & Devices Map']
  }
];

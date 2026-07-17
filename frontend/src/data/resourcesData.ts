export type ResourceCategory = 
  | 'free-tools' 
  | 'certifications' 
  | 'courses' 
  | 'dsa' 
  | 'roadmaps' 
  | 'interview-prep' 
  | 'open-source' 
  | 'hackathons' 
  | 'system-design';

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: ResourceCategory;
  isFree: boolean;
  tags: string[];
}

export const resourcesData: Resource[] = [
  // Free Tools
  {
    id: 'free-tools-1',
    title: 'MDN Web Docs',
    description: 'The best place to learn web development. Detailed documentation on HTML, CSS, JavaScript, and Web APIs.',
    url: 'https://developer.mozilla.org/',
    category: 'free-tools',
    isFree: true,
    tags: ['docs', 'web', 'javascript']
  },
  {
    id: 'free-tools-2',
    title: 'DevDocs',
    description: 'Combines multiple API documentations in a fast, organized, and searchable interface.',
    url: 'https://devdocs.io/',
    category: 'free-tools',
    isFree: true,
    tags: ['docs', 'tool', 'api']
  },
  {
    id: 'free-tools-3',
    title: 'Regex101',
    description: 'Online regex tester, debugger with highlighting for PHP, Python, Golang and JavaScript.',
    url: 'https://regex101.com/',
    category: 'free-tools',
    isFree: true,
    tags: ['regex', 'tool']
  },

  // Certifications
  {
    id: 'cert-1',
    title: 'freeCodeCamp Certifications',
    description: 'Earn free verified certifications in Responsive Web Design, JS Algorithms, Front End Libraries, and more.',
    url: 'https://www.freecodecamp.org/',
    category: 'certifications',
    isFree: true,
    tags: ['frontend', 'backend', 'fullstack']
  },
  {
    id: 'cert-2',
    title: 'AWS Certified Cloud Practitioner',
    description: 'A great starting point to validate your overall understanding of the AWS Cloud platform.',
    url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
    category: 'certifications',
    isFree: false,
    tags: ['aws', 'cloud', 'devops']
  },

  // Courses
  {
    id: 'course-1',
    title: 'CS50: Introduction to Computer Science',
    description: 'Harvard University\'s introduction to the intellectual enterprises of computer science and the art of programming.',
    url: 'https://cs50.harvard.edu/x/',
    category: 'courses',
    isFree: true,
    tags: ['cs', 'c', 'python', 'basics']
  },
  {
    id: 'course-2',
    title: 'Full Stack Open',
    description: 'Deep dive into modern web development by University of Helsinki. Covers React, Redux, Node.js, MongoDB, and GraphQL.',
    url: 'https://fullstackopen.com/en/',
    category: 'courses',
    isFree: true,
    tags: ['react', 'node', 'fullstack']
  },
  {
    id: 'course-3',
    title: 'Epic React',
    description: 'Learn React fundamentals to advanced patterns with Kent C. Dodds.',
    url: 'https://epicreact.dev/',
    category: 'courses',
    isFree: false,
    tags: ['react', 'frontend', 'advanced']
  },

  // DSA
  {
    id: 'dsa-1',
    title: 'LeetCode',
    description: 'The gold standard platform to practice algorithmic questions and prepare for coding interviews.',
    url: 'https://leetcode.com/',
    category: 'dsa',
    isFree: true,
    tags: ['algorithms', 'practice', 'interviews']
  },
  {
    id: 'dsa-2',
    title: 'NeetCode',
    description: 'A structured list of 150 LeetCode questions with video explanations to master DSA patterns.',
    url: 'https://neetcode.io/',
    category: 'dsa',
    isFree: true,
    tags: ['patterns', 'video-solutions']
  },
  {
    id: 'dsa-3',
    title: 'Codeforces',
    description: 'Competitive programming platform with high-quality problems and frequent contests.',
    url: 'https://codeforces.com/',
    category: 'dsa',
    isFree: true,
    tags: ['competitive-programming', 'contests']
  },

  // Roadmaps
  {
    id: 'roadmap-1',
    title: 'Roadmap.sh',
    description: 'Community driven roadmaps, articles and resources for developers.',
    url: 'https://roadmap.sh/',
    category: 'roadmaps',
    isFree: true,
    tags: ['frontend', 'backend', 'devops']
  },

  // Interview Prep
  {
    id: 'interview-1',
    title: 'Pramp',
    description: 'Practice mock coding interviews with peers for free. Great for getting over interview anxiety.',
    url: 'https://www.pramp.com/',
    category: 'interview-prep',
    isFree: true,
    tags: ['mock-interview', 'peer-to-peer']
  },
  {
    id: 'interview-2',
    title: 'Tech Interview Handbook',
    description: 'Curated interview preparation materials for busy software engineers.',
    url: 'https://www.techinterviewhandbook.org/',
    category: 'interview-prep',
    isFree: true,
    tags: ['guide', 'behavioral', 'resume']
  },

  // Open Source
  {
    id: 'os-1',
    title: 'Good First Issue',
    description: 'Curated list of issues from popular open-source projects that are easy to fix for beginners.',
    url: 'https://goodfirstissue.dev/',
    category: 'open-source',
    isFree: true,
    tags: ['github', 'contributions']
  },
  {
    id: 'os-2',
    title: 'Open Source Guides',
    description: 'A collection of resources for individuals, communities, and companies who want to learn how to run and contribute to an open source project.',
    url: 'https://opensource.guide/',
    category: 'open-source',
    isFree: true,
    tags: ['guide', 'community']
  },

  // Hackathons
  {
    id: 'hack-1',
    title: 'Devpost',
    description: 'Find hackathons, build software, and win prizes. The best place to find upcoming global hackathons.',
    url: 'https://devpost.com/',
    category: 'hackathons',
    isFree: true,
    tags: ['hackathons', 'projects', 'competition']
  },
  {
    id: 'hack-2',
    title: 'Unstop',
    description: 'Platform for hackathons, competitions, coding challenges, and hiring events.',
    url: 'https://unstop.com/',
    category: 'hackathons',
    isFree: true,
    tags: ['competitions', 'hiring']
  },

  // System Design
  {
    id: 'sys-1',
    title: 'ByteByteGo',
    description: 'Excellent visuals and explanations for modern system design concepts.',
    url: 'https://bytebytego.com/',
    category: 'system-design',
    isFree: false,
    tags: ['architecture', 'scalability']
  },
  {
    id: 'sys-2',
    title: 'System Design Primer',
    description: 'Learn how to design large-scale systems. Prep for the system design interview.',
    url: 'https://github.com/donnemartin/system-design-primer',
    category: 'system-design',
    isFree: true,
    tags: ['github', 'guide', 'interviews']
  }
];

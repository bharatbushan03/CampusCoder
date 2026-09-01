export type ResourceCategory = 
  | 'competitions'
  | 'notes'
  | 'free-tools' 
  | 'certifications' 
  | 'courses' 
  | 'dsa' 
  | 'roadmaps' 
  | 'interview-prep' 
  | 'open-source' 
  | 'hackathons' 
  | 'system-design'
  | 'placement'
  | 'practice'
  | 'general';

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: ResourceCategory;
  isFree: boolean;
  tags: string[];
}

/**
 * Dynamic resource registry.
 * Static mock items removed per user request so that all resources are dynamically managed
 * and added via the website Admin Portal (/admin/resources).
 */
export const resourcesData: Resource[] = [];



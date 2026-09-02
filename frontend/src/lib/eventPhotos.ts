/**
 * Curated high-resolution event photo collections for CampusCoder events,
 * workshops, hackathons, and community sprints.
 */
export const DEFAULT_EVENT_PHOTOS: Record<string, string[]> = {
  // Workshop & Full-Stack Sprints
  workshop: [
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  ],

  // Coding Sessions & Problem Solving Sprints
  coding_session: [
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528901166007-3784c7dd3653?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
  ],

  // Hackathons & Challenges
  challenge: [
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
  ],

  // Webinars & Tech Talks
  webinar: [
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=1200&q=80',
  ],

  // Orientations & Community Meetups
  orientation: [
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
  ],
};

/**
 * Returns event photos for an event, removing photos for excluded events (such as Master DSA in 7 Days)
 * or returning custom uploaded photos.
 */
export function getEventPhotos(
  customPhotos?: string[] | null,
  eventType = 'workshop',
  eventIdentifier = ''
): string[] {
  const idStr = (eventIdentifier || '').toLowerCase().trim();

  // Explicitly remove photos for Master DSA in 7 Days event per user request
  if (
    idStr.includes('master-dsa') ||
    idStr.includes('master dsa') ||
    idStr.includes('7-days') ||
    idStr.includes('7 days') ||
    idStr.includes('dsa-7-days')
  ) {
    return [];
  }

  if (Array.isArray(customPhotos) && customPhotos.length > 0) {
    return customPhotos;
  }

  if (Array.isArray(customPhotos) && customPhotos.length === 0) {
    return [];
  }

  return DEFAULT_EVENT_PHOTOS[eventType] || [];
}

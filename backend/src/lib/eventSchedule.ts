export const EVENT_DATE_LABEL = 'TBC';
export const EVENT_TIME_LABEL = 'Coming soon';
export const EVENT_DEADLINE_LABEL = 'TBC';

/**
 * Formats event date into human readable string (e.g. Saturday, September 5, 2026)
 */
export function formatEventDate(dateStr?: string | null): string {
  if (!dateStr || dateStr.toLowerCase() === 'tbc') return 'Date to be announced';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats start and end times into clean 12-hour AM/PM string (e.g. 06:00 PM – 08:00 PM IST)
 */
export function formatEventTime(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) return 'Time to be announced';

  const formatSingleTime = (t: string) => {
    try {
      const parts = t.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        return `${formattedHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      }
      return t;
    } catch {
      return t;
    }
  };

  const formattedStart = formatSingleTime(startTime);
  if (endTime) {
    const formattedEnd = formatSingleTime(endTime);
    return `${formattedStart} – ${formattedEnd} (IST)`;
  }
  return `${formattedStart} (IST)`;
}

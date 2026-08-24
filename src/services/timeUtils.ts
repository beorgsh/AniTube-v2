/**
 * Converts a date string, timestamp, or relative phrase into YouTube-style relative time:
 * - 1 hr ago / 3 hrs ago
 * - 1 day ago / 4 days ago
 * - 1 week ago / 3 weeks ago
 * - 1 month ago / 5 months ago
 * - 1 year ago / 2 years ago
 */
export function formatRelativeTime(dateInput?: string | number | Date | null): string {
  if (!dateInput && dateInput !== 0) return '';

  // If already a relative string (e.g., "2 days ago", "1 hour ago", "3 months ago")
  if (typeof dateInput === 'string' && /(ago|just now|yesterday)/i.test(dateInput)) {
    let cleaned = dateInput.trim();
    // Normalize YouTube abbreviations and singular/plural:
    cleaned = cleaned.replace(/\b1\s+hr\s+ago\b/i, '1 hour ago');
    cleaned = cleaned.replace(/\b(\d+)\s+hrs\s+ago\b/i, '$1 hours ago');
    cleaned = cleaned.replace(/\b1\s+hours?\s+ago\b/i, '1 hour ago');
    cleaned = cleaned.replace(/\b(\d+)\s+hours?\s+ago\b/i, '$1 hours ago');
    cleaned = cleaned.replace(/\b1\s+days?\s+ago\b/i, '1 day ago');
    cleaned = cleaned.replace(/\b(\d+)\s+days?\s+ago\b/i, '$1 days ago');
    cleaned = cleaned.replace(/\b1\s+weeks?\s+ago\b/i, '1 week ago');
    cleaned = cleaned.replace(/\b(\d+)\s+weeks?\s+ago\b/i, '$1 weeks ago');
    cleaned = cleaned.replace(/\b1\s+months?\s+ago\b/i, '1 month ago');
    cleaned = cleaned.replace(/\b(\d+)\s+months?\s+ago\b/i, '$1 months ago');
    cleaned = cleaned.replace(/\b1\s+years?\s+ago\b/i, '1 year ago');
    cleaned = cleaned.replace(/\b(\d+)\s+years?\s+ago\b/i, '$1 years ago');
    return cleaned;
  }

  // Parse as date
  let parsedDate: Date;
  if (typeof dateInput === 'number') {
    // Check if timestamp in seconds or ms
    parsedDate = dateInput < 10000000000 ? new Date(dateInput * 1000) : new Date(dateInput);
  } else if (dateInput instanceof Date) {
    parsedDate = dateInput;
  } else {
    // string representation
    parsedDate = new Date(String(dateInput));
  }

  if (isNaN(parsedDate.getTime())) {
    return String(dateInput);
  }

  const now = Date.now();
  const diffMs = now - parsedDate.getTime();

  if (diffMs < 0) {
    return 'Recently';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) {
    return 'just now';
  }
  if (hours < 1) {
    return minutes === 1 ? '1 min ago' : `${minutes} mins ago`;
  }
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (days < 7) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (weeks < 4) {
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (months < 12) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

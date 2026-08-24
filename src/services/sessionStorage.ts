import { Video } from '../types';

export interface LikedEpisodeItem {
  key: string; // unique key `${animeId || slug}_ep_${episodeNumber}`
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle?: string;
  formattedTitle: string;
  thumbnail: string;
  slug?: string;
  malId?: string | number;
  streamUrl?: string;
  channel?: {
    name: string;
    avatar: string;
    subscribers?: string;
  };
  likedAt: number;
}

const WATCH_LATER_KEY = 'anitube_watch_later_session';
const LIKED_EPISODES_KEY = 'anitube_liked_episodes_session';

// Helper to set cookie for current session
function setSessionCookie(name: string, value: string) {
  try {
    // Session cookie without explicit max-age/expires ends when browser session ends
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Could not set cookie:', e);
  }
}

// Helper to get cookie
function getSessionCookie(name: string): string | null {
  try {
    const nameEQ = encodeURIComponent(name) + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  } catch (e) {
    console.warn('Could not read cookie:', e);
  }
  return null;
}

/* ================= WATCH LATER (Session Persisted) ================= */

export function getWatchLaterList(): Video[] {
  try {
    const raw = sessionStorage.getItem(WATCH_LATER_KEY) || getSessionCookie(WATCH_LATER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading watch later from session:', e);
  }
  return [];
}

export function saveWatchLaterList(list: Video[]): void {
  try {
    const jsonStr = JSON.stringify(list);
    sessionStorage.setItem(WATCH_LATER_KEY, jsonStr);
    // Sync to session cookie (truncate to avoid cookie size limit if needed)
    setSessionCookie(WATCH_LATER_KEY, JSON.stringify(list.slice(0, 30)));
    // Dispatch custom event for real-time reactivity across components
    window.dispatchEvent(new CustomEvent('anitube_storage_update', { detail: { type: 'watch_later' } }));
  } catch (e) {
    console.warn('Error saving watch later:', e);
  }
}

export function isInWatchLater(videoIdOrSlug: string): boolean {
  const list = getWatchLaterList();
  return list.some(item => item.id === videoIdOrSlug || item.slug === videoIdOrSlug);
}

export function toggleWatchLater(video: Video): boolean {
  const list = getWatchLaterList();
  const index = list.findIndex(item => item.id === video.id || (video.slug && item.slug === video.slug));

  if (index >= 0) {
    // Remove
    list.splice(index, 1);
    saveWatchLaterList(list);
    return false; // un-saved
  } else {
    // Add
    const updated = [video, ...list];
    saveWatchLaterList(updated);
    return true; // saved
  }
}

export function removeFromWatchLater(videoId: string): void {
  const list = getWatchLaterList();
  const updated = list.filter(item => item.id !== videoId && item.slug !== videoId);
  saveWatchLaterList(updated);
}

/* ================= LIKED EPISODES (Specific Episode Session Persisted) ================= */

export function getLikedEpisodesList(): LikedEpisodeItem[] {
  try {
    const raw = sessionStorage.getItem(LIKED_EPISODES_KEY) || getSessionCookie(LIKED_EPISODES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading liked episodes from session:', e);
  }
  return [];
}

export function saveLikedEpisodesList(list: LikedEpisodeItem[]): void {
  try {
    const jsonStr = JSON.stringify(list);
    sessionStorage.setItem(LIKED_EPISODES_KEY, jsonStr);
    // Sync to session cookie
    setSessionCookie(LIKED_EPISODES_KEY, JSON.stringify(list.slice(0, 30)));
    window.dispatchEvent(new CustomEvent('anitube_storage_update', { detail: { type: 'liked_episodes' } }));
  } catch (e) {
    console.warn('Error saving liked episodes:', e);
  }
}

export function isEpisodeLiked(animeIdOrSlug: string, episodeNumber: number): boolean {
  const key = `${animeIdOrSlug}_ep_${episodeNumber}`;
  const list = getLikedEpisodesList();
  return list.some(item => item.key === key || (item.animeId === animeIdOrSlug && item.episodeNumber === episodeNumber));
}

export function toggleLikedEpisode(item: {
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
  episodeTitle?: string;
  formattedTitle: string;
  thumbnail: string;
  slug?: string;
  malId?: string | number;
  streamUrl?: string;
  channel?: { name: string; avatar: string; subscribers?: string };
}): boolean {
  const key = `${item.slug || item.animeId}_ep_${item.episodeNumber}`;
  const list = getLikedEpisodesList();
  const index = list.findIndex(i => i.key === key || (i.animeId === item.animeId && i.episodeNumber === item.episodeNumber));

  if (index >= 0) {
    // Remove like
    list.splice(index, 1);
    saveLikedEpisodesList(list);
    return false;
  } else {
    // Add like for this specific episode
    const newItem: LikedEpisodeItem = {
      key,
      animeId: item.animeId,
      animeTitle: item.animeTitle,
      episodeNumber: item.episodeNumber,
      episodeTitle: item.episodeTitle,
      formattedTitle: item.formattedTitle,
      thumbnail: item.thumbnail,
      slug: item.slug,
      malId: item.malId,
      streamUrl: item.streamUrl,
      channel: item.channel,
      likedAt: Date.now(),
    };
    const updated = [newItem, ...list];
    saveLikedEpisodesList(updated);
    return true;
  }
}

export function removeLikedEpisode(key: string): void {
  const list = getLikedEpisodesList();
  const updated = list.filter(item => item.key !== key);
  saveLikedEpisodesList(updated);
}

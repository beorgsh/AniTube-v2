// Shared AniList Rate Limit Manager & Cooldown Engine

export interface RateLimitState {
  remaining: number;
  limit: number;
  resetTime: number; // Unix timestamp in ms
  isCoolingDown: boolean;
  cooldownSource: 'AniNews' | 'AniTrail' | null;
  cooldownSeconds: number;
}

let currentState: RateLimitState = {
  remaining: 90,
  limit: 90,
  resetTime: 0,
  isCoolingDown: false,
  cooldownSource: null,
  cooldownSeconds: 0,
};

type Listener = (state: RateLimitState) => void;
const listeners = new Set<Listener>();

export function subscribeRateLimit(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...currentState }));
}

/**
 * Update rate limit state from AniList response headers
 */
export function updateAniListRateLimit(headers: Headers, source: 'AniNews' | 'AniTrail') {
  const limitHeader = headers.get('x-ratelimit-limit');
  const remainingHeader = headers.get('x-ratelimit-remaining');
  const resetHeader = headers.get('x-ratelimit-reset');

  if (remainingHeader !== null) {
    const rem = parseInt(remainingHeader, 10);
    const lim = limitHeader ? parseInt(limitHeader, 10) : 90;
    
    // Reset timestamp from AniList is usually in seconds
    let resetMs = Date.now() + 60000;
    if (resetHeader) {
      const parsedReset = parseInt(resetHeader, 10);
      if (parsedReset > 0) {
        resetMs = parsedReset > 10000000000 ? parsedReset : parsedReset * 1000;
      }
    }

    currentState = {
      ...currentState,
      remaining: isNaN(rem) ? currentState.remaining : rem,
      limit: isNaN(lim) ? currentState.limit : lim,
      resetTime: resetMs,
    };

    notifyListeners();
  }
}

/**
 * Proactively check rate limit before making an AniList GraphQL API request.
 * If remaining requests <= 5 or reset window is active, wait and notify UI.
 */
export async function guardAniListRateLimit(source: 'AniNews' | 'AniTrail'): Promise<void> {
  const now = Date.now();
  
  // If reset time has passed, restore remaining quota estimate
  if (currentState.resetTime > 0 && now >= currentState.resetTime) {
    currentState.remaining = currentState.limit;
    currentState.isCoolingDown = false;
    currentState.cooldownSource = null;
    currentState.cooldownSeconds = 0;
    notifyListeners();
  }

  // If remaining requests <= 4 or rate limit cooldown is required
  if (currentState.remaining <= 4 || currentState.isCoolingDown) {
    const rawDiff = currentState.resetTime > now ? currentState.resetTime - now : 10000;
    const waitMs = Math.max(3000, Math.min(60000, rawDiff));
    const waitSeconds = Math.ceil(waitMs / 1000);

    currentState = {
      ...currentState,
      isCoolingDown: true,
      cooldownSource: source,
      cooldownSeconds: waitSeconds,
    };
    notifyListeners();

    console.warn(`[AniList Rate Limit Protection] Low remaining quota (${currentState.remaining}). Cooling down for ${waitSeconds}s in ${source}...`);

    // Countdown interval for smooth UI feedback
    const startTime = Date.now();
    while (Date.now() - startTime < waitMs) {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const remainingSec = Math.max(0, waitSeconds - elapsedSec);
      
      currentState.cooldownSeconds = remainingSec;
      notifyListeners();

      await new Promise((r) => setTimeout(r, 1000));
    }

    // Reset cooldown state
    currentState = {
      ...currentState,
      remaining: currentState.limit,
      isCoolingDown: false,
      cooldownSource: null,
      cooldownSeconds: 0,
    };
    notifyListeners();
  }
}

/**
 * Handle HTTP 429 Too Many Requests error
 */
export async function handleAniList429(source: 'AniNews' | 'AniTrail', retryAfterSec = 10): Promise<void> {
  currentState = {
    ...currentState,
    remaining: 0,
    resetTime: Date.now() + retryAfterSec * 1000,
    isCoolingDown: true,
    cooldownSource: source,
    cooldownSeconds: retryAfterSec,
  };
  notifyListeners();

  console.warn(`[AniList HTTP 429] Rate limit hit in ${source}. Pausing for ${retryAfterSec}s to refresh limit...`);

  for (let sec = retryAfterSec; sec > 0; sec--) {
    currentState.cooldownSeconds = sec;
    notifyListeners();
    await new Promise((r) => setTimeout(r, 1000));
  }

  currentState = {
    ...currentState,
    remaining: currentState.limit,
    isCoolingDown: false,
    cooldownSource: null,
    cooldownSeconds: 0,
  };
  notifyListeners();
}

export function getCurrentRateLimitState(): RateLimitState {
  return currentState;
}

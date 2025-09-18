// Simple in-memory sliding window rate limiter per key
type Entry = { count: number; expiresAt: number };
const store = new Map<string, Entry>();
const WINDOW_MS = 60_000; // 1 minute
const MAX = 10; // 10 reqs / min per key

export const rateLimit = {
  allow(key: string) {
    const now = Date.now();
    const e = store.get(key);
    if (!e || e.expiresAt < now) {
      store.set(key, { count: 1, expiresAt: now + WINDOW_MS });
      return true;
    }
    if (e.count >= MAX) return false;
    e.count += 1;
    return true;
  },
};


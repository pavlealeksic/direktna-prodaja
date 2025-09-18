type Entry = { slug: string; expiresAt: number };
const cache = new Map<string, Entry>();
const TTL = 5 * 60_000; // 5 minutes

export function getDomainSlugFromCache(host: string): string | null {
  const k = host.toLowerCase();
  const e = cache.get(k);
  if (e && e.expiresAt > Date.now()) return e.slug;
  return null;
}

export function setDomainSlugInCache(host: string, slug: string) {
  cache.set(host.toLowerCase(), { slug, expiresAt: Date.now() + TTL });
}


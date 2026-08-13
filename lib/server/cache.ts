type Entry<T> = { value: T; expiresAt: number };
export class MemoryCache { private readonly values = new Map<string, Entry<unknown>>(); get<T>(key: string): T | undefined { const entry = this.values.get(key); if (!entry) return undefined; if (entry.expiresAt <= Date.now()) { this.values.delete(key); return undefined; } return entry.value as T; } set<T>(key: string, value: T, ttlMs: number) { this.values.set(key, { value, expiresAt: Date.now() + ttlMs }); } delete(key: string) { this.values.delete(key); } clear() { this.values.clear(); } }
export const characterCache = new MemoryCache();
export const itemCache = new MemoryCache();
export const realmCache = new MemoryCache();
export const CACHE_TTL = { characterMs: 5 * 60 * 1000, itemMs: 24 * 60 * 60 * 1000, realmMs: 24 * 60 * 60 * 1000, tokenSafetyMs: 60 * 1000 } as const;

export const PUBLIC_LOOKUP_BOUNDS = {
  maxUrlLength: 512,
  maxRealmInputLength: 80,
  maxRealmSlugLength: 64,
  maxCharacterNameLength: 32,
} as const;

export const PUBLIC_LOOKUP_CACHE_TTL = {
  foundMs: 10 * 60 * 1000,
  notFoundMs: 45 * 1000,
} as const;

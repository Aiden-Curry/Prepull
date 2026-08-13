import type { CharacterRealmType, Region } from "../types.ts";
import { CharacterProviderError } from "../providers/character-provider.ts";

export type BlizzardContext = {
  apiRegion: Region;
  profileNamespace: string;
  dynamicNamespace: string;
  staticNamespace: string;
  locale: string;
};

// Blizzard's product namespace is selected by the realm ecosystem, never by the
// page's content version. Anniversary remains disabled until its live mapping is
// verified against current Blizzard responses.
const realmContexts: Partial<Record<CharacterRealmType, (region: Region) => BlizzardContext>> = {
  era: (region) => ({
    apiRegion: region,
    profileNamespace: `profile-classic1x-${region}`,
    dynamicNamespace: `dynamic-classic1x-${region}`,
    staticNamespace: `static-classic1x-${region}`,
    locale: region === "eu" ? "en_GB" : "en_US",
  }),
};

export function getBlizzardContext(realmType: CharacterRealmType, region: Region): BlizzardContext {
  const factory = realmContexts[realmType];
  if (!factory) {
    throw new CharacterProviderError("UnsupportedRealmType", `Blizzard profile data is not currently verified for ${realmType.toUpperCase()} realms.`);
  }
  return factory(region);
}

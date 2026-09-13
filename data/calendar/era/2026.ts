import type { GameCalendarEvent } from "../../../lib/calendar/types";

const whitemane = { label: "Whitemane Times — live Classic Era calendar", url: "https://whitemanetimes.com/", verifiedAt: "2026-09-13" };
const pyrewood = { label: "Pyrewood — live EU Classic Era calendar", url: "https://www.pyrewood.eu/", verifiedAt: "2026-09-13" };
const harvest = { label: "Warcraft Wiki — Harvest Festival", url: "https://warcraft.wiki.gg/wiki/Harvest_Festival", verifiedAt: "2026-09-13" };
const hallowsEnd = { label: "Warcraft Wiki — Hallow's End", url: "https://warcraft.wiki.gg/wiki/Hallow%27s_End", verifiedAt: "2026-09-13" };
const winterVeil = { label: "Warcraft Wiki — Feast of Winter Veil", url: "https://warcraft.wiki.gg/wiki/Feast_of_Winter_Veil", verifiedAt: "2026-09-13" };

export const era2026Calendar: readonly GameCalendarEvent[] = [
  { id: "darkmoon-faire-era-us-2026-09", familyId: "darkmoon-faire", contentVersion: "era", title: "Darkmoon Faire", category: "darkmoon-faire", region: "us", timing: { kind: "date-range", startsOn: "2026-09-07", endsOn: "2026-09-13" }, locationLabel: "Elwynn Forest", shortDescription: "The monthly faire is open near Goldshire.", source: whitemane },
  { id: "darkmoon-faire-era-eu-2026-09", familyId: "darkmoon-faire", contentVersion: "era", title: "Darkmoon Faire", category: "darkmoon-faire", region: "eu", timing: { kind: "date-range", startsOn: "2026-09-07", endsOn: "2026-09-13" }, locationLabel: "Elwynn Forest", shortDescription: "The monthly faire is open near Goldshire.", source: pyrewood },
  ...(["eu", "us"] as const).flatMap((region) => {
    const source = region === "eu" ? pyrewood : whitemane;
    return [
      { id: `arathi-basin-era-${region}-2026-09`, familyId: "arathi-basin-weekend", contentVersion: "era", title: "Arathi Basin Bonus Weekend", category: "battleground", region, timing: { kind: "date-range", startsOn: "2026-09-11", endsOn: "2026-09-14" }, locationLabel: "Arathi Basin", source },
      { id: `alterac-valley-era-${region}-2026-09`, familyId: "alterac-valley-weekend", contentVersion: "era", title: "Alterac Valley Bonus Weekend", category: "battleground", region, timing: { kind: "date-range", startsOn: "2026-09-18", endsOn: "2026-09-21" }, locationLabel: "Alterac Valley", source },
      { id: `warsong-gulch-era-${region}-2026-09`, familyId: "warsong-gulch-weekend", contentVersion: "era", title: "Warsong Gulch Bonus Weekend", category: "battleground", region, timing: { kind: "date-range", startsOn: "2026-09-25", endsOn: "2026-09-28" }, locationLabel: "Warsong Gulch", source },
    ] as GameCalendarEvent[];
  }),
  { id: "harvest-festival-era-global-2026", familyId: "harvest-festival", contentVersion: "era", title: "Harvest Festival", category: "seasonal", region: "global", timing: { kind: "date-range", startsOn: "2026-09-21", endsOn: "2026-09-28" }, shortDescription: "Honor the fallen heroes of the Horde and Alliance.", source: harvest },
  { id: "hallows-end-era-global-2026", familyId: "hallows-end", contentVersion: "era", title: "Hallow's End", category: "holiday", region: "global", timing: { kind: "date-range", startsOn: "2026-10-18", endsOn: "2026-11-01" }, source: hallowsEnd },
  { id: "winter-veil-era-global-2026", familyId: "winter-veil", contentVersion: "era", title: "Feast of Winter Veil", category: "holiday", region: "global", timing: { kind: "date-range", startsOn: "2026-12-16", endsOn: "2027-01-02" }, source: winterVeil },
] satisfies readonly GameCalendarEvent[];

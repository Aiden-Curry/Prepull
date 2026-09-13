import type { ContentVersion } from "../types";

export const calendarCategories = ["battleground", "darkmoon-faire", "holiday", "seasonal", "world-event", "special", "other"] as const;
export const calendarRegions = ["eu", "us", "kr", "tw", "global"] as const;
export type GameCalendarEventCategory = (typeof calendarCategories)[number];
export type GameCalendarRegion = (typeof calendarRegions)[number];
export type CalendarDisplayRegion = Extract<GameCalendarRegion, "eu" | "us">;

export type GameCalendarTiming =
  | { kind: "date-range"; startsOn: string; endsOn?: string }
  | { kind: "instant-range"; startsAt: string; endsAt?: string };

export type GameCalendarEvent = {
  id: string;
  familyId: string;
  contentVersion: ContentVersion;
  title: string;
  shortDescription?: string;
  category: GameCalendarEventCategory;
  region: GameCalendarRegion;
  timing: GameCalendarTiming;
  locationLabel?: string;
  source: { label: string; url?: string; verifiedAt: string };
};

export type GameCalendarStatus = "active" | "upcoming" | "ended";
export type CalendarCategoryFilter = "all" | "battlegrounds" | "holidays" | "darkmoon-faire" | "world-seasonal";

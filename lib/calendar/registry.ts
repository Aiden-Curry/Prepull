import { era2026Calendar } from "../../data/calendar/era/2026.ts";
import { tbc2026Calendar } from "../../data/calendar/tbc/2026.ts";
import type { ContentVersion } from "../types";
import type { GameCalendarEvent } from "./types";

const calendarRegistry: Record<ContentVersion, readonly GameCalendarEvent[]> = {
  era: era2026Calendar,
  tbc: tbc2026Calendar,
};

export function getCalendarEvents(version: ContentVersion): readonly GameCalendarEvent[] {
  return calendarRegistry[version];
}

export function getAllCalendarEvents(): readonly GameCalendarEvent[] {
  return Object.values(calendarRegistry).flat();
}

import { getAllCalendarEvents } from "../lib/calendar/registry.ts";
import { validateCalendarEvents } from "../lib/calendar/validate.ts";

const events = getAllCalendarEvents(); const errors = validateCalendarEvents(events);
if (errors.length) { console.error(`Calendar validation failed (${errors.length}):\n${errors.map((error) => `- ${error}`).join("\n")}`); process.exitCode = 1; }
else console.log(`Calendar validation passed: ${events.length} explicit occurrences, 0 structural errors.`);

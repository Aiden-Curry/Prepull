import { Temporal } from "@js-temporal/polyfill";
import { GuildDomainError } from "./errors.ts";

export const DEFAULT_GUILD_TIME_ZONE = "UTC";

export type GuildLocalDateTimeInput = {
  localDate: string;
  localTime: string;
  offsetChoice?: string;
};
export type LocalDateTimeAnalysis =
  | { kind: "valid"; instant: string; offset: string }
  | {
      kind: "ambiguous";
      choices: Array<{ instant: string; offset: string; label: string }>;
    }
  | { kind: "nonexistent"; message: string }
  | { kind: "invalid"; message: string };

export function isValidIanaTimeZone(value: string) {
  const zone = value.trim();
  if (
    zone !== "UTC" &&
    (!zone.includes("/") || /^(?:Etc\/GMT|GMT|UTC[+-])/i.test(zone))
  )
    return false;
  try {
    Temporal.Instant.from("2026-01-01T00:00:00Z").toZonedDateTimeISO(zone);
    return true;
  } catch {
    return false;
  }
}

export function validateTimeZone(value?: string) {
  const zone = value?.trim() || DEFAULT_GUILD_TIME_ZONE;
  if (!isValidIanaTimeZone(zone))
    throw new GuildDomainError(
      "CONFLICT",
      "Choose a valid IANA timezone, such as Europe/Oslo.",
    );
  return zone;
}

function fields(localDate: string, localTime: string, timeZone: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(localDate) ||
    !/^\d{2}:\d{2}$/.test(localTime)
  )
    throw new Error("invalid local fields");
  const plain = Temporal.PlainDateTime.from(`${localDate}T${localTime}`);
  return {
    plain,
    value: {
      timeZone,
      year: plain.year,
      month: plain.month,
      day: plain.day,
      hour: plain.hour,
      minute: plain.minute,
    },
  };
}

export function analyzeGuildLocalDateTime(
  localDate: string,
  localTime: string,
  timeZoneValue: string,
): LocalDateTimeAnalysis {
  let timeZone: string;
  try {
    timeZone = validateTimeZone(timeZoneValue);
  } catch (error) {
    return {
      kind: "invalid",
      message: error instanceof Error ? error.message : "Timezone is invalid.",
    };
  }
  try {
    const { plain, value } = fields(localDate, localTime, timeZone);
    const earlier = Temporal.ZonedDateTime.from(value, {
      disambiguation: "earlier",
    });
    const later = Temporal.ZonedDateTime.from(value, {
      disambiguation: "later",
    });
    const earlierMatches = earlier.toPlainDateTime().equals(plain),
      laterMatches = later.toPlainDateTime().equals(plain);
    if (!earlierMatches || !laterMatches)
      return {
        kind: "nonexistent",
        message:
          "That local time does not exist because the clocks change on this date. Choose another time.",
      };
    if (earlier.epochNanoseconds !== later.epochNanoseconds) {
      return {
        kind: "ambiguous",
        choices: [earlier, later].map((zoned) => ({
          instant: zoned.toInstant().toString(),
          offset: zoned.offset,
          label: `${localTime} ${zoned.offset}`,
        })),
      };
    }
    return {
      kind: "valid",
      instant: earlier.toInstant().toString(),
      offset: earlier.offset,
    };
  } catch {
    return { kind: "invalid", message: "Enter a valid local date and time." };
  }
}

export function guildLocalDateTimeToUtc(
  input: GuildLocalDateTimeInput,
  timeZone: string,
) {
  const analysis = analyzeGuildLocalDateTime(
    input.localDate,
    input.localTime,
    timeZone,
  );
  if (analysis.kind === "nonexistent" || analysis.kind === "invalid")
    throw new GuildDomainError("CONFLICT", analysis.message);
  if (analysis.kind === "ambiguous") {
    const selected = analysis.choices.find(
      (choice) => choice.offset === input.offsetChoice,
    );
    if (!selected)
      throw new GuildDomainError(
        "CONFLICT",
        "That local time occurs twice because the clocks change. Choose the intended UTC offset.",
      );
    return Temporal.Instant.from(selected.instant).toString();
  }
  return Temporal.Instant.from(analysis.instant).toString();
}

export function instantToGuildLocalInput(
  instant: string | Date,
  timeZoneValue: string,
) {
  const timeZone = validateTimeZone(timeZoneValue);
  const zoned = Temporal.Instant.from(
    instant instanceof Date ? instant.toISOString() : instant,
  ).toZonedDateTimeISO(timeZone);
  return {
    localDate: zoned.toPlainDate().toString(),
    localTime: `${String(zoned.hour).padStart(2, "0")}:${String(zoned.minute).padStart(2, "0")}`,
    offset: zoned.offset,
  };
}

export function getGuildToday(
  timeZoneValue: string,
  now: string | Date = new Date(),
) {
  return instantToGuildLocalInput(now, timeZoneValue).localDate;
}

export function describeRelativeGuildDate(
  instant: string | Date,
  timeZoneValue: string,
  now: string | Date = new Date(),
) {
  const timeZone = validateTimeZone(timeZoneValue);
  const target = Temporal.PlainDate.from(
    instantToGuildLocalInput(instant, timeZone).localDate,
  );
  const today = Temporal.PlainDate.from(getGuildToday(timeZone, now));
  const days = today.until(target, { largestUnit: "day" }).days;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  const date = new Date(`${target.toString()}T12:00:00Z`);
  if (days > 1 && days < 7)
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      timeZone: "UTC",
    }).format(date);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

export function formatInGuildTimeZone(
  instant: string | Date,
  timeZoneValue: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  const timeZone = validateTimeZone(timeZoneValue);
  return new Intl.DateTimeFormat("en-GB", { timeZone, ...options }).format(
    instant instanceof Date ? instant : new Date(instant),
  );
}

export function formatGuildScheduleTime(
  instant: string | Date,
  timeZone: string,
  now: string | Date = new Date(),
) {
  const date = describeRelativeGuildDate(instant, timeZone, now);
  const time = formatInGuildTimeZone(instant, timeZone, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${date} · ${time}`;
}

export function currentTimeZoneOffset(
  timeZone: string,
  now: string | Date = new Date(),
) {
  const instant = Temporal.Instant.from(
    now instanceof Date ? now.toISOString() : now,
  );
  return instant.toZonedDateTimeISO(validateTimeZone(timeZone)).offset;
}

export function timeZoneCatalog() {
  const supported =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [];
  return ["UTC", ...supported.filter((zone) => !zone.startsWith("Etc/GMT"))];
}

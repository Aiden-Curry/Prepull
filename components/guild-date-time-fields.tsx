"use client";

import { useMemo, useState } from "react";
import { analyzeGuildLocalDateTime } from "../lib/guilds/time";

export function GuildDateTimeFields({
  timeZone,
  optional = false,
  defaultDate = "",
  defaultTime = "",
  defaultOffset,
  dateName = "localDate",
  timeName = "localTime",
}: {
  timeZone: string;
  optional?: boolean;
  defaultDate?: string;
  defaultTime?: string;
  defaultOffset?: string;
  dateName?: string;
  timeName?: string;
}) {
  const [date, setDate] = useState(defaultDate),
    [time, setTime] = useState(defaultTime);
  const analysis = useMemo(
    () =>
      date && time
        ? analyzeGuildLocalDateTime(date, time, timeZone)
        : undefined,
    [date, time, timeZone],
  );
  return (
    <fieldset className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
      <legend className="sr-only">Guild-local schedule</legend>
      <label className="text-sm">
        {optional ? "Optional date" : "Date"}
        <input
          className="field mt-1 w-full"
          type="date"
          name={dateName}
          value={date}
          required={!optional}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <label className="text-sm">
        {optional ? "Optional time" : "Time"}
        <input
          className="field mt-1 w-full"
          type="time"
          name={timeName}
          value={time}
          required={!optional}
          onChange={(event) => setTime(event.target.value)}
        />
      </label>
      <p className="text-xs text-[var(--muted)] sm:col-span-2">
        Timezone: <strong>{timeZone}</strong>
      </p>
      {analysis?.kind === "nonexistent" || analysis?.kind === "invalid" ? (
        <p role="alert" className="text-sm text-amber-200 sm:col-span-2">
          {analysis.message}
        </p>
      ) : null}
      {analysis?.kind === "ambiguous" ? (
        <fieldset className="rounded-xl border border-[var(--line)] p-3 sm:col-span-2">
          <legend className="px-1 text-sm font-semibold">
            This time occurs twice. Choose the intended offset.
          </legend>
          {analysis.choices.map((choice) => (
            <label
              className="mt-2 flex items-center gap-2 text-sm"
              key={choice.instant}
            >
              <input
                type="radio"
                name="offsetChoice"
                value={choice.offset}
                defaultChecked={choice.offset === defaultOffset}
                required
              />
              {choice.label}
            </label>
          ))}
        </fieldset>
      ) : null}
    </fieldset>
  );
}

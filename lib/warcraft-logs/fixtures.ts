import { emptyLogs, type LogsBoss, type LogsSummary } from "./model.ts";

// Synthetic DISPLAY fixtures. IDs/values are test-only, not observed WCL IDs or
// raw ranking fixtures. Production context mapping must never import these IDs.
export const LOGS_FIXTURE_NAMES = ["logsfull", "logspartial", "logshealer", "logsmulti", "logshidden", "logsempty", "logsmissing", "logserror", "logszoneerror"] as const;
export const EXISTING_CHARACTER_FIXTURES: Record<string, string> = {
  "eu:firemaw:aidy": "logsfull", "eu:firemaw:freshfury": "logsmulti",
  "us:whitemane:lyria": "logspartial", "us:whitemane:lyriaprogress": "logszoneerror",
  "us:whitemane:pyra": "logshidden", "eu:firemaw:rivyn": "logsempty",
  "us:whitemane:talan": "logserror", "eu:firemaw:elowen": "logshealer",
};
export function logsFixture(name: string, now = new Date()): LogsSummary {
  const state = name === "logshidden" ? "hidden" : name === "logsempty" ? "no-public-logs" : name === "logsmissing" ? "not-found" : name === "logserror" ? "temporary-error" : "available";
  const summary = emptyLogs(state, now); summary.fixture = true;
  if (state !== "available") return summary;
  const healer = name === "logshealer";
  const performance = { spec: healer ? "Holy" : "Fury", role: healer ? "Healer" : "Damage", metric: healer ? "HPS" : "DPS" };
  const boss = (name: string, index: number, killed: boolean): LogsBoss => ({ encounterId: 900_000 + index, name, progression: true,
    performances: [{ ...performance, kills: killed ? 7 : 0, ...(killed ? { best: 93, median: 81, lastKillAt: now.toISOString() } : {}) }],
  });
  const mc = ["Lucifron", "Magmadar", "Gehennas", "Garr", "Shazzrah", "Baron Geddon", "Sulfuron Harbinger", "Golemagg the Incinerator", "Majordomo Executus", "Ragnaros"];
  const aq = ["The Prophet Skeram", "Silithid Royalty", "Battleguard Sartura", "Fankriss the Unyielding", "Viscidus", "Princess Huhuran", "Twin Emperors", "Ouro", "C'Thun"];
  summary.raids = [{ zoneId: 900_001, name: "Molten Core", order: 1, status: "available", bosses: mc.map((name, index) => boss(name, index, true)),
    aggregates: [{ ...performance, label: "Best Performance Avg", value: 92.4 }, { ...performance, label: "Median Performance Avg", value: 79.2 }] }];
  if (name === "logspartial") summary.raids.push({ zoneId: 900_002, name: "Temple of Ahn'Qiraj", order: 2, status: "available", bosses: aq.map((name, index) => boss(name, index + 20, index < 6)), aggregates: [] });
  if (name === "logsmulti") summary.raids[0].bosses[9].performances.push({ spec: "Protection", role: "Tank", metric: "DPS", kills: 2, best: 86 });
  if (name === "logszoneerror") summary.raids.push({ zoneId: 900_003, name: "Naxxramas", order: 3, status: "temporary-error", bosses: [], aggregates: [] });
  summary.reports = [{ code: "TESTREPORT000001", zoneName: "Molten Core", startedAt: now.toISOString() }];
  return summary;
}

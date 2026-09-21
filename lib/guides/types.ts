import type { ContentVersion } from "../types.ts";

export type GuideStatus = "published" | "draft" | "unavailable";
export type GuideSource = { title: string; publisher: string; url: string; accessedAt: string };
export type GuideBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "callout"; label: "Important" | "Common strategy" | "Preparation"; text: string }
  | { kind: "wowhead"; entries: { type: "item" | "spell"; id: number; name: string; note: string }[] }
  | { kind: "links"; guideIds: string[] }
  | { kind: "gear"; specKey: string; phases: number[] }
  | { kind: "talent-build"; buildId: string }
  | { kind: "bosses"; raidId: number };
export type GuideSection = { id: string; title: string; blocks: GuideBlock[] };
export type GuideContent = { summary: string; sections: GuideSection[]; sources: GuideSource[]; tags?: string[]; quick?: { before: string; during: string; watch: string } };
type GuideBase = { id: string; contentVersion: ContentVersion; slug: string; status: GuideStatus; title: string; updatedAt: string };
export type Guide = GuideBase & (
  | { type: "spec"; className: string; specName: string }
  | { type: "raid"; raidId: number }
  | { type: "boss"; raidId: number; encounterId: number }
);

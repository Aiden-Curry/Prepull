import type { GuideBlock, GuideSection, GuideSource } from "../../lib/guides/types.ts";
export const p = (text: string): GuideBlock => ({ kind: "paragraph", text });
export const list = (...items: string[]): GuideBlock => ({ kind: "list", items });
export const section = (id: string, title: string, ...blocks: GuideBlock[]): GuideSection => ({ id, title, blocks });
export const source = (title: string, publisher: string, url: string): GuideSource => ({ title, publisher, url, accessedAt: "2026-09-20" });
export const icy = (title: string, slug: string) => source(title, "Icy Veins", `https://www.icy-veins.com/wow-classic/${slug}`);
export const wowhead = (title: string, slug: string) => source(title, "Wowhead Classic", `https://www.wowhead.com/classic/guide/${slug}`);

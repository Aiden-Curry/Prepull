import { fury } from "../../content/guides/era/fury.ts";
import { frost } from "../../content/guides/era/frost.ts";
import { moltenCoreContent } from "../../content/guides/era/molten-core.ts";
import { moltenCoreBossContent } from "../../content/guides/era/molten-core-bosses.ts";
import type { GuideContent } from "./types.ts";
export const guideContent: Readonly<Record<string, GuideContent>> = { "era-fury": fury, "era-frost": frost, "era-molten-core": moltenCoreContent, ...moltenCoreBossContent };

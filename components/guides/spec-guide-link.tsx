import Link from "next/link";
import type { ContentVersion } from "../../lib/types";
import { guideHref, specGuide } from "../../lib/guides/registry";
export function SpecGuideLink({ version, realmType, className, specialization }: { version: ContentVersion; realmType: string; className: string; specialization: string }) {
  const guide = realmType === "era" ? specGuide(version, className, specialization) : undefined;
  return guide ? <Link className="focus-ring mt-3 inline-flex min-h-11 items-center text-sm text-[var(--accent-hover)] underline underline-offset-4" href={guideHref(guide)}>View {guide.title} guide</Link> : null;
}

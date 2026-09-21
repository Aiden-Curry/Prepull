import { notFound } from "next/navigation";
import { GuideArticle, GuideIndex } from "../../../../components/guides/guide-page";
import { guideIndexPaths, publicGuidePaths, resolveGuide } from "../../../../lib/guides/registry";
import { guideContent } from "../../../../lib/guides/content";
import { guideMetadata } from "../../../../lib/guides/metadata";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() { return publicGuidePaths().map(path => { const [, version, , ...segments] = path.split("/"); return { version, segments }; }); }
type Props = { params: Promise<{ version: string; segments?: string[] }> };
function resolve(version: string, segments: string[] = []) {
  if (version !== "era" && version !== "tbc") notFound();
  const slug = segments.join("/"); const path = `/${version}/guides${slug ? `/${slug}` : ""}`;
  const guide = resolveGuide(version, slug);
  if (!guide && !guideIndexPaths(version).includes(path)) notFound();
  return { version, slug, path, guide } as const;
}
export async function generateMetadata({ params }: Props) { const { version, segments } = await params; const route = resolve(version, segments); return guideMetadata(route.guide ? `${route.guide.title} — Classic Era` : `${version === "era" ? "Classic Era" : "TBC"} Guides`, route.guide ? guideContent[route.guide.id].summary : version === "era" ? "Class, raid and boss preparation guides for Classic Era." : "TBC guides are coming later. No TBC guides are published yet.", route.path); }
export default async function Page({ params }: Props) { const { version, segments } = await params; const route = resolve(version, segments); return route.guide ? <GuideArticle guide={route.guide} /> : <GuideIndex version={route.version} index={route.slug} />; }

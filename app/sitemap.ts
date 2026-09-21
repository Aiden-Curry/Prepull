import type { MetadataRoute } from "next";
import { guideHref, publicGuidePaths, publishedGuides } from "../lib/guides/registry";
import { siteOrigin } from "../lib/guides/metadata";
export default function sitemap(): MetadataRoute.Sitemap { return publicGuidePaths().map(path => ({ url: `${siteOrigin()}${path}`, lastModified: publishedGuides().find(guide => guideHref(guide) === path)?.updatedAt })); }

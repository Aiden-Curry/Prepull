"use client";
import Link from "next/link";
import { useState } from "react";
import type { Guide } from "../../lib/guides/types";
import { guideHref } from "../../lib/guides/registry";

export function GuideDiscovery({ guides }: { guides: Guide[] }) {
  const [query, setQuery] = useState("");
  const visible = guides.filter(guide => `${guide.title} ${guide.type === "boss" ? "Molten Core boss" : guide.type}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="mt-8"><label htmlFor="guide-filter" className="block text-sm font-semibold">Find a guide</label><input id="guide-filter" type="search" className="home-field focus-ring mt-2 max-w-lg" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try Fury, Garr or Molten Core" /><p role="status" className="my-4 text-sm text-[var(--text-muted)]">{visible.length} published guides</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(guide => <article key={guide.id} className="panel min-w-0 rounded-2xl p-5"><p className="eyebrow">{guide.type === "spec" ? "Class & Spec Guides" : "Raid & Boss Guides"}</p><h2 className="display mt-3 text-2xl"><Link className="focus-ring inline-block py-2" href={guideHref(guide)}>{guide.title}</Link></h2><p className="text-sm text-[var(--text-muted)]">{guide.type === "boss" ? "Molten Core · Boss guide" : guide.type === "raid" ? "Raid preparation and boss guides" : "Talents, priorities and gear"}</p></article>)}</div>{!visible.length && <p>No published guides match this search.</p>}</div>;
}

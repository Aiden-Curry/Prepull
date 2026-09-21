"use client";
import Image from "next/image";
import { useState } from "react";
import type { ClassicTalentClass, GuideTalentBuild } from "../../lib/talents/types";
import { wowheadLink } from "../../lib/armory/wowhead";

export function ClassicTalentTree({ metadata, build }: { metadata: ClassicTalentClass; build: GuideTalentBuild }) {
  const [activeTree, setActiveTree] = useState(metadata.trees[0].id);
  const [focusedId, setFocusedId] = useState<string>();
  const totals = metadata.trees.map(tree => metadata.talents.filter(t => t.tree === tree.id).reduce((sum, t) => sum + (build.selectedRanks[t.id] ?? 0), 0));
  const focused = metadata.talents.find(t => t.id === focusedId);
  const rank = focused ? build.selectedRanks[focused.id] ?? 0 : 0;
  const detailsId = `${build.id}-details`;
  return <div className="classic-talents" data-guide-talent-build={build.id}>
    <header className="mb-4"><h3 className="display text-2xl">{build.name}</h3><p className="mt-2 font-semibold" data-talent-allocation>{totals.join("/")} · {totals.reduce((a, b) => a + b, 0)} points</p><p className="mt-2 text-sm">Guide build — not your character&apos;s current talents. Selected ranks are highlighted; dimmed icons have no points. Hover for Wowhead details, or select a talent for its rank and prerequisite.</p></header>
    <div className="talent-tree-picker mb-4 font-semibold"><label htmlFor={`${build.id}-tree-choice`}>Talent tree</label><select id={`${build.id}-tree-choice`} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3" value={activeTree} onChange={event => { setActiveTree(event.target.value); setFocusedId(undefined); }}>{metadata.trees.map((tree, i) => <option key={tree.id} value={tree.id}>{tree.name} · {totals[i]} points</option>)}</select></div>
    <div className="talent-trees">{metadata.trees.map((tree, i) => <section key={tree.id} className="talent-tree-panel" data-active={tree.id === activeTree} data-talent-tree={tree.id} aria-label={`${tree.name} guide talents`}>
      <h4 className="mb-3 text-center text-lg font-semibold">{tree.name} <span className="text-[var(--accent-hover)]">{totals[i]}</span></h4>
      <div className="talent-grid">
        <svg className="talent-connectors" viewBox="0 0 256 504" aria-hidden="true">{metadata.talents.filter(t => t.tree === tree.id && t.prerequisite).map(t => { const from = metadata.talents.find(other => other.id === t.prerequisite)!; const x1 = (from.column - 1) * 64 + 32, y1 = (from.row - 1) * 72 + 58, x2 = (t.column - 1) * 64 + 32, y2 = (t.row - 1) * 72 + 5; return <g key={t.id} data-prerequisite={`${from.id}:${t.id}`} data-selected={(build.selectedRanks[t.id] ?? 0) > 0}><path d={`M${x1} ${y1} V${y2 - 8} H${x2} V${y2}`} /><path d={`M${x2 - 4} ${y2 - 5} L${x2} ${y2} L${x2 + 4} ${y2 - 5}`} /></g>; })}</svg>
        {metadata.talents.filter(t => t.tree === tree.id).map(t => { const selected = build.selectedRanks[t.id] ?? 0; const spellId = t.spellIds[Math.max(0, selected - 1)]; return <a key={t.id} className="talent-node focus-ring" data-talent-id={t.id} data-selected={selected > 0} data-rank={selected} style={{ left: (t.column - 1) * 64 + 10, top: (t.row - 1) * 72 + 8 }} href={wowheadLink("era", "era", "spell", spellId)} data-wowhead={`domain=classic&spell=${spellId}`} data-wh-rename-link="false" aria-label={`${t.name}, ${selected}/${t.maxRank}, ${selected ? "selected" : "unselected"}. Show talent details`} aria-controls={detailsId} onFocus={() => setFocusedId(t.id)} onClick={event => { event.preventDefault(); setFocusedId(t.id); }}>
          <Image unoptimized src={`https://wow.zamimg.com/images/wow/icons/large/${t.icon}.jpg`} width={44} height={44} alt="" loading="lazy" /><span className="talent-rank">{selected}/{t.maxRank}</span>
        </a>; })}
      </div>
    </section>)}</div>
    <div id={detailsId} className="mt-4 rounded-xl border border-[var(--border)] p-4 text-sm" aria-live="polite" aria-atomic="true">{focused ? <><p className="font-semibold">{focused.name} — {rank}/{focused.maxRank}</p><p>{rank ? "Selected in this guide build." : "Not selected in this guide build."} Row {focused.row} · Column {focused.column} · Requires {(focused.row - 1) * 5} points in earlier rows.</p>{focused.prerequisite && <p>Prerequisite: {metadata.talents.find(t => t.id === focused.prerequisite)?.name} at maximum rank.</p>}<a className="focus-ring mt-2 inline-flex min-h-11 items-center text-[var(--accent-hover)] underline" href={wowheadLink("era", "era", "spell", focused.spellIds[Math.max(0, rank - 1)])} target="_blank" rel="noopener noreferrer">View {focused.name} on Wowhead (opens in a new tab)</a></> : <p>Select a talent to read its name, allocation and requirements. Unselected talents link to rank 1 on Wowhead.</p>}</div>
  </div>;
}

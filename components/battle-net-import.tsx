"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BattleNetImportCharacter } from "../lib/battle-net/types";
import { BATTLE_NET_LIMITS } from "../lib/battle-net/config";

const labels: Record<string, string> = { pending: "Ready", importing: "Importing…", imported: "Imported", already_added: "Already added", failed: "Temporarily failed", unsupported: "Not currently supported" };

export function BattleNetImport({ sessionId, version, initialCharacters }: { sessionId: string; version: "era" | "tbc"; initialCharacters: BattleNetImportCharacter[] }) {
  const [characters, setCharacters] = useState(initialCharacters);
  const [selected, setSelected] = useState(() => new Set(initialCharacters.filter((character) => character.contentSupport === "supported" && character.importStatus === "pending").map((character) => character.id)));
  const [running, setRunning] = useState(false);
  const [batchTotal, setBatchTotal] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const supported = characters.filter((character) => character.contentSupport === "supported");
  const unavailable = characters.filter((character) => character.contentSupport !== "supported");
  const complete = characters.filter((character) => ["imported", "already_added", "failed"].includes(character.importStatus)).length;
  const summary = useMemo(() => ({ imported: characters.filter((item) => item.importStatus === "imported").length, existing: characters.filter((item) => item.importStatus === "already_added").length, failed: characters.filter((item) => item.importStatus === "failed").length }), [characters]);

  async function importOne(characterId: string) {
    setCharacters((items) => items.map((item) => item.id === characterId ? { ...item, importStatus: "importing" } : item));
    try {
      const response = await fetch("/api/battle-net/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, characterId }) });
      const body = await response.json() as { character?: BattleNetImportCharacter };
      if (!response.ok || !body.character) throw new Error("import failed");
      setCharacters((items) => items.map((item) => item.id === characterId ? body.character! : item));
    } catch { setCharacters((items) => items.map((item) => item.id === characterId ? { ...item, importStatus: "failed", failureCode: "ImportFailed" } : item)); }
    finally { setSelected((current) => { const next = new Set(current); next.delete(characterId); return next; }); }
  }

  async function run(ids: string[]) {
    if (!ids.length) return; setBatchTotal(ids.length); setRunning(true);
    const queue = [...ids];
    await Promise.all(Array.from({ length: Math.min(BATTLE_NET_LIMITS.importConcurrency, queue.length) }, async () => { while (queue.length) await importOne(queue.shift()!); }));
    setRunning(false);
  }

  const retryIds = characters.filter((item) => item.importStatus === "failed").map((item) => item.id);
  return <>
    <section className="panel mt-8 rounded-2xl p-6" aria-labelledby="supported-heading">
      <h2 id="supported-heading" className="display text-2xl">Supported Era characters</h2>
      {supported.length ? <div className="mt-4 grid gap-3">{supported.map((character) => <label key={character.id} className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-4"><input type="checkbox" className="mt-1" aria-label={`Import ${character.name}`} disabled={running || character.importStatus !== "pending"} checked={selected.has(character.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); event.target.checked ? next.add(character.id) : next.delete(character.id); return next; })} /><span className="min-w-0 flex-1"><strong>{character.name}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{character.level ? `Level ${character.level} ` : ""}{character.className ?? "Character"} · {character.realmName} · {character.region.toUpperCase()}</span></span><span className="text-xs text-[var(--accent-hover)]">{labels[character.importStatus]}</span></label>)}</div> : <p className="mt-4 text-sm text-[var(--muted)]">No supported Era characters were returned by Battle.net.</p>}
      <button type="button" disabled={!hydrated || running || selected.size === 0} className="button-primary mt-5 w-full sm:w-auto" onClick={() => void run([...selected])}>{running ? "Importing your characters…" : `Add ${selected.size || "selected"} character${selected.size === 1 ? "" : "s"}`}</button>
      <p className="mt-3 text-sm text-[var(--muted)]" role="status" aria-live="polite">{running ? `${Math.min(complete, batchTotal)} of ${batchTotal} complete` : summary.imported || summary.existing || summary.failed ? `${summary.imported} imported · ${summary.existing} already added · ${summary.failed} failed` : "Select the characters you want to add."}</p>
      {retryIds.length > 0 && !running && <button className="button-secondary mt-3" onClick={() => void run(retryIds)}>Retry failed {retryIds.length === 1 ? "character" : "characters"}</button>}
    </section>
    {unavailable.length > 0 && <section className="panel mt-5 rounded-2xl p-6"><h2 className="display text-2xl">Unsupported or unavailable</h2><div className="mt-4 grid gap-3">{unavailable.map((character) => <div key={character.id} className="rounded-xl border border-[var(--line)] p-4"><strong>{character.name}</strong><p className="mt-1 text-xs text-[var(--muted)]">{character.realmName} · {character.realmType === "anniversary" ? "TBC Anniversary" : "Unknown ecosystem"}</p><p className="mt-2 text-sm">Live syncing is not currently available.</p></div>)}</div></section>}
    <div className="mt-6 flex flex-wrap gap-3"><Link className="button-primary" href={`/${version}/dashboard`}>Go to dashboard</Link><Link className="button-secondary" href={`/${version}/characters/connect`}>Use manual character finder</Link></div>
  </>;
}

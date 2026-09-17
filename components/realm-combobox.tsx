"use client";
import { useEffect, useId, useRef, useState } from "react";
import { REALM_CATALOG, searchRealms, selectedRealm, type RealmEntry } from "../lib/realms/catalog";
import type { CharacterRealmType, Region } from "../lib/types";

// Parent keys this control by region/ecosystem, so incompatible selection cannot survive.
export function RealmCombobox({ region, realmType, initial = "", onSelect }: { region: Region; realmType: CharacterRealmType; initial?: string; onSelect?: (slug: string) => void }) {
  const id = useId(); const [entries, setEntries] = useState(REALM_CATALOG);
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => selectedRealm(REALM_CATALOG, region, realmType, initial)?.name ?? "");
  const [open, setOpen] = useState(false); const [active, setActive] = useState(-1);
  const results = searchRealms(entries, region, realmType, text); const selected = selectedRealm(entries, region, realmType, text);
  useEffect(() => { input.current?.setCustomValidity(text && !selected ? "Select a realm from the list." : ""); }, [text, selected]);
  useEffect(() => { if (open && active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" }); }, [open, active, id]);
  useEffect(() => { const controller = new AbortController(); fetch(`/api/realms?${new URLSearchParams({ region, realmType })}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : undefined).then((data) => { if (Array.isArray(data?.realms) && data.realms.length) setEntries(data.realms); }).catch(() => {}); return () => controller.abort(); }, [region, realmType]);
  function choose(realm: RealmEntry) { setText(realm.name); onSelect?.(realm.slug); setOpen(false); setActive(-1); }
  return <div className="relative min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); onSelect?.(selected?.slug ?? ""); } }}>
    <label htmlFor={id} className="field-label">Realm</label>
    <input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open && active >= 0 && results[active] ? `${id}-${active}` : undefined} aria-describedby={`${id}-status`} autoComplete="off" className="home-field field focus-ring w-full" placeholder="Search realms" required value={text}
      onFocus={() => { setOpen(true); setActive(-1); }} onClick={() => setOpen(true)}
      onChange={(event) => { setText(event.target.value); setOpen(true); setActive(-1); onSelect?.(selectedRealm(entries, region, realmType, event.target.value)?.slug ?? ""); event.target.setCustomValidity(""); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActive((index) => event.key === "ArrowDown" ? Math.min(index + 1, results.length - 1) : Math.max(index - 1, 0)); }
        else if (event.key === "Escape") { event.preventDefault(); setOpen(false); setActive(-1); }
        else if (event.key === "Enter" && open && active >= 0 && results[active]) { event.preventDefault(); choose(results[active]); }
        else if (event.key === "Enter" && !selected) { event.preventDefault(); event.currentTarget.setCustomValidity("Select a realm from the list."); event.currentTarget.reportValidity(); }
      }} />
    <input type="hidden" name="realm" value={selected?.slug ?? ""} />
    {open && <ul id={`${id}-list`} role="listbox" aria-label="Realms" className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-xl">{results.map((realm, index) => <li key={`${realm.region}:${realm.realmType}:${realm.slug}`} id={`${id}-${index}`} role="option" aria-selected={selected?.slug === realm.slug} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(realm)} className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${active === index ? "bg-[var(--surface-raised)] outline outline-1 outline-[var(--accent)]" : ""}`}><span>{realm.name}{selected?.slug === realm.slug ? " ✓" : ""}</span><span className="block text-xs text-[var(--text-muted)]">{region.toUpperCase()} · {realmType === "era" ? "Era" : "Anniversary"}</span></li>)}</ul>}
    <span id={`${id}-status`} role="status" aria-live="polite" className="sr-only">{open ? `${results.length} realms available. Use arrow keys and Enter to select.` : selected ? `${selected.name} selected` : "Choose a realm from the list."}</span>
  </div>;
}

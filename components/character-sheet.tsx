import Image from "next/image";
import { SpecGuideLink } from "./guides/spec-guide-link";
import type { ReactNode } from "react";
import type { CharacterArmory, CharacterTalentState } from "../lib/armory/types";
import { relevantStatistics } from "../lib/armory/normalize";
import { wowheadItemParams, wowheadLink } from "../lib/armory/wowhead";
import { WowheadTooltips } from "./wowhead-tooltips";

export function CharacterSheet({ armory, saved = false, headingLevel = 1, adviceHref, progressHref, logs }: { armory: CharacterArmory; saved?: boolean; headingLevel?: 1 | 2; adviceHref?: string; progressHref?: string; logs?: ReactNode }) {
  return <section className="character-sheet mt-8" aria-label="Character sheet" data-armory-source={saved ? "persisted" : "public"}>
    <WowheadTooltips refreshKey={armory.character.realmType + ":" + armory.equipment.map(({ item }) => item ? `${item.itemId}:${item.enchantIds.join(",")}:${item.gemIds.join(",")}` : "empty").join(";")} />
    <CharacterHeader armory={armory} saved={saved} headingLevel={headingLevel} />
    <nav aria-label="Character sections" className="my-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
      <a className="button-secondary focus-ring" href="#character-equipment">Character</a><a className="button-secondary focus-ring" href="#character-talents">Talents</a>
      {logs && <a className="button-secondary focus-ring" href="#character-logs">Logs</a>}{adviceHref && <a className="button-secondary focus-ring" href={adviceHref}>Advice</a>}{progressHref && <a className="button-secondary focus-ring" href={progressHref}>Progress</a>}
    </nav>
    <CharacterEquipment armory={armory} />
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[.8fr_1.2fr]"><CharacterStatistics armory={armory} /><CharacterTalents talents={armory.talents} armory={armory} saved={saved} /></div>
    {logs}
  </section>;
}
export function CharacterHeader({ armory, saved, headingLevel }: { armory: CharacterArmory; saved: boolean; headingLevel: 1 | 2 }) {
  const character = armory.character; const Heading = headingLevel === 1 ? "h1" : "h2";
  return <header className="panel rounded-3xl border-t-2 border-t-[var(--accent)] p-6 sm:p-9"><div className="eyebrow">{saved ? "Saved character" : "Public character"} · {armory.source === "mock" ? "Deterministic preview" : "Battle.net"}</div>
    <Heading className="display mt-3 break-words text-5xl sm:text-6xl">{character.name}</Heading><p className="mt-3 text-lg">Level {character.level} {character.race} {character.className}</p>
    <p className="mt-2 text-sm text-[var(--text-muted)]">{character.realm} · {character.region.toUpperCase()} · {character.realmType === "era" ? "Classic Era" : "Anniversary"} · {character.faction}</p>
    <p className="mt-4 font-semibold text-[var(--accent-hover)]">{character.specialization !== "Unavailable" ? character.specialization : "Specialization unavailable"}</p><CharacterFreshness armory={armory} saved={saved} />
    <SpecGuideLink version={character.contentVersion} realmType={character.realmType} className={character.className} specialization={character.specialization} />
  </header>;
}
export function CharacterFreshness({ armory, saved }: { armory: CharacterArmory; saved: boolean }) {
  return <p className="mt-4 text-xs text-[var(--text-muted)]">{saved ? "Last synced" : "Retrieved"}: <time dateTime={armory.retrievedAt}>{new Date(armory.retrievedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</time></p>;
}
export function CharacterEquipment({ armory }: { armory: CharacterArmory }) {
  return <section id="character-equipment" aria-labelledby="equipment-heading" className="panel rounded-3xl p-4 sm:p-7"><div className="mb-6 flex flex-wrap items-end justify-between gap-2"><h2 id="equipment-heading" className="display text-3xl">Equipment</h2><p className="text-xs text-[var(--text-muted)]">{armory.equipment.filter((slot) => slot.item).length} equipped · Select an item for details</p></div>
    {armory.equipmentStatus === "unavailable" && <p className="mb-4 text-sm">Equipment is unavailable for this profile.</p>}
    <div className="armory-equipment">{armory.equipment.map((slot) => <CharacterEquipmentSlot key={slot.slot} equipment={slot} armory={armory} />)}<div className="armory-center" aria-hidden="true"><span className="display text-7xl text-[var(--accent)] opacity-30">{armory.character.className.slice(0, 1)}</span><span className="mt-4 text-xs uppercase tracking-[.25em] text-[var(--text-muted)]">{armory.character.className}</span></div></div>
  </section>;
}
export function CharacterEquipmentSlot({ equipment, armory }: { equipment: CharacterArmory["equipment"][number]; armory: CharacterArmory }) {
  const { slot, label, item } = equipment; const { contentVersion, realmType } = armory.character;
  const href = item ? wowheadLink(contentVersion, realmType, "item", item.itemId) : undefined;
  return <article className={`armory-slot armory-${slot}`} data-slot={slot} data-quality={item?.quality ?? "Unknown"}>
    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
    {item && href ? <a key={`${realmType}:${item.itemId}:${item.enchantIds.join(",")}:${item.gemIds.join(",")}`} className="armory-item focus-ring" href={href} target="_blank" rel="noopener noreferrer" data-wowhead={wowheadItemParams(contentVersion, realmType, item)} data-wh-icon-size={item.iconUrl ? undefined : "large"} data-wh-rename-link="false">
      <span className="armory-icon" aria-hidden="true">{item.iconUrl ? <Image unoptimized src={item.iconUrl} alt="" width={48} height={48} loading="lazy" referrerPolicy="no-referrer" /> : <span className="text-xl">◇</span>}</span>
      <span className="min-w-0"><span className="armory-item-name block break-words font-semibold">{item.name}</span><span className="mt-1 block text-xs text-[var(--text-muted)]">{item.quality ?? "Quality unavailable"}{item.itemLevel ? ` · Item level ${item.itemLevel}` : ""}</span></span>
      <span className="armory-focus-details">{item.name} · {label}{item.enchantments.length ? ` · ${item.enchantments.join(" · ")}` : ""}. Open Wowhead for item details.</span>
    </a> : <div className="armory-item"><span className="armory-icon" aria-hidden="true">—</span><span className="text-sm text-[var(--text-muted)]">{armory.equipmentStatus === "unavailable" ? "Unavailable" : "Empty"}</span></div>}
    {item?.enchantments.map((enchantment, index) => <p className="mt-1 text-xs text-[var(--text-muted)]" key={index}>{enchantment}</p>)}
  </article>;
}
export function CharacterStatistics({ armory }: { armory: CharacterArmory }) {
  const statistics = armory.statistics;
  return <section className="panel rounded-3xl p-6" aria-labelledby="statistics-heading"><h2 id="statistics-heading" className="display text-3xl">Statistics</h2>{statistics.status === "available" ? <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">{relevantStatistics(statistics.values, armory.character.className).map((stat) => <div key={stat.key}><dt className="text-xs text-[var(--text-muted)]">{stat.label}</dt><dd className="mt-1 text-lg font-semibold">{stat.value.toLocaleString("en-GB", { maximumFractionDigits: stat.unit ? 2 : 0 })}{stat.unit}</dd></div>)}</dl> : <p className="mt-4 text-sm text-[var(--text-muted)]">{statistics.status === "temporary-error" ? "Statistics are temporarily unavailable. Other character data is still available." : "Character statistics are not available in this snapshot. Refresh a saved character to check again."}</p>}</section>;
}
export function CharacterTalents({ talents, armory, saved }: { talents: CharacterTalentState; armory: CharacterArmory; saved: boolean }) {
  return <section id="character-talents" className="panel rounded-3xl p-6" aria-labelledby="talents-heading"><h2 id="talents-heading" className="display text-3xl">Talents</h2>{talents.status === "available" ? <><p className="mt-3 text-xs text-[var(--text-muted)]">{talents.source === "mock" ? "Deterministic fixture" : "Source: Blizzard"} · {saved ? "Last synced" : "Retrieved"} <time dateTime={talents.retrievedAt}>{new Date(talents.retrievedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</time></p><div className="mt-5 space-y-5">{talents.trees.map((tree) => <div key={tree.name}><h3 className="flex justify-between border-b border-[var(--border)] pb-2 font-semibold"><span>{tree.name}</span><span>{tree.points} points</span></h3><ul className="mt-3 space-y-2">{tree.selections.map((talent, index) => { const href = talent.spellId ? wowheadLink(armory.character.contentVersion, armory.character.realmType, "spell", talent.spellId) : undefined; return <li key={`${talent.name}:${index}`} className="flex justify-between gap-4 text-sm">{href ? <a className="focus-ring underline decoration-dotted underline-offset-4" href={href} target="_blank" rel="noopener noreferrer">{talent.name}</a> : <span>{talent.name}</span>}<span className="shrink-0 text-[var(--text-muted)]">Rank {talent.rank}</span></li>; })}</ul></div>)}</div></> : <p className="mt-4 text-sm text-[var(--text-muted)]">{talents.status === "temporary-error" ? "Talent data is temporarily unavailable." : "Talent data isn't currently available from the source for this character."} A specialization name does not establish a talent build.</p>}</section>;
}

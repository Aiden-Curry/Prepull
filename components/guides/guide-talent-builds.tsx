"use client";
import { useId, useState } from "react";
import type { ClassicTalentClass, GuideTalentBuild } from "../../lib/talents/types";
import { ClassicTalentTree } from "./classic-talent-tree";

// Selection only: tree rendering and interaction remain in ClassicTalentTree.
export function GuideTalentBuilds({ choices }: { choices: { metadata: ClassicTalentClass; build: GuideTalentBuild }[] }) {
  const id = useId();
  const [selected, setSelected] = useState(choices[0].build.id);
  const choice = choices.find(choice => choice.build.id === selected) ?? choices[0];
  return <div>
    {choices.length > 1 && <div className="mb-4"><label className="font-semibold" htmlFor={id}>Guide build</label><select id={id} className="mt-2 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3" value={selected} onChange={event => setSelected(event.target.value)}>{choices.map(({ build }) => <option key={build.id} value={build.id}>{build.name} ({build.expectedAllocation.join("/")})</option>)}</select></div>}
    <ClassicTalentTree key={choice.build.id} {...choice} />
  </div>;
}

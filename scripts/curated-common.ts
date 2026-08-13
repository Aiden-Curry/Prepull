import fs from "node:fs";
import path from "node:path";
import { eraFuryCuratedProfile, curatedReferenceProfiles, referenceSlots } from "../lib/curated-gear/data.ts";
import { authoringHeaders, rowsToCsv, setToRows, type AuthoringRow } from "../lib/curated-gear/authoring.ts";

export const arg = (name: string) => { const value = process.argv.find((entry) => entry.startsWith(`--${name}=`)); return value?.slice(name.length + 3); };
export const hasArg = (name: string) => process.argv.includes(`--${name}`);
export const writeJson = (file: string, data: unknown) => { const target = path.resolve(file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8"); };
export const currentRows = (): AuthoringRow[] => curatedReferenceProfiles.flatMap((profile) => profile.sets.flatMap((set) => setToRows(set)));
export const filteredRows = (): AuthoringRow[] => currentRows().filter((row) => (!arg("class") || row.class.toLowerCase() === arg("class")!.toLowerCase()) && (!arg("spec") || row.spec.toLowerCase() === arg("spec")!.toLowerCase()) && (!arg("phase") || row.phase === arg("phase")));
export { authoringHeaders, eraFuryCuratedProfile, curatedReferenceProfiles, referenceSlots, rowsToCsv };

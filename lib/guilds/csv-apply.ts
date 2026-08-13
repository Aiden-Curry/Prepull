import { previewGuildCsv } from "./csv.ts";
import { GuildDomainError } from "./errors.ts";
import { applyMainAltImport, previewMainAltImport } from "./main-alt-service.ts";

type Actor={id:string}; type Policy="mark-inactive"|"leave-unchanged";
export type CsvImportSummary={added:number;updated:number;unchanged:number;markedInactive:number;conflicts:number;invalidRows:number;duplicateRows:number;mainAltConflicts:number;linkedCharacterConflicts:number};
export function previewImport(csv:string){return previewGuildCsv(csv)}
export { previewMainAltImport };
export async function applyCsvImport(actor:Actor,guildId:string,csv:string,policy:Policy,expectedVersion?:number,previewToken?:string,decisions:any={}) {
  if(expectedVersion === undefined || !previewToken) { const preview=await previewMainAltImport(actor,guildId,csv); expectedVersion=preview.rosterVersion; previewToken=preview.token; if(preview.conflicts.some((conflict)=>conflict.blocking)) throw new GuildDomainError("UNRESOLVED_IMPORT_CONFLICT","Generate a preview and resolve all blocking main/alt conflicts before applying this import."); }
  const result=await applyMainAltImport(actor,guildId,csv,policy,expectedVersion,previewToken,decisions);
  const parsed=previewGuildCsv(csv); return {added:0,updated:0,unchanged:0,markedInactive:result.markedInactive??0,conflicts:0,invalidRows:parsed.issues.length,duplicateRows:parsed.duplicateNames.length,mainAltConflicts:0,linkedCharacterConflicts:0};
}

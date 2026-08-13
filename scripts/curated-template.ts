import { authoringHeaders, referenceSlots, rowsToCsv } from "./curated-common.ts";
const className = process.argv.find((entry) => entry.startsWith("--class="))?.split("=")[1] ?? "warrior";
const spec = process.argv.find((entry) => entry.startsWith("--spec="))?.split("=")[1] ?? (className === "priest" ? "holy" : "fury");
const contexts = className === "warrior" && spec === "protection" ? ["balanced", "threat", "mitigation", "fire-resistance", "nature-resistance", "frost-resistance"] : className === "priest" && spec === "holy" ? ["general", "throughput", "sustain"] : ["general"];
const rows = referenceSlots.map((slot) => ({ contentVersion: "era", class: className, spec, role: spec === "holy" ? "healer" : spec === "protection" ? "tank" : "DPS", phase: "pre-raid", context: contexts[0], setId: `era-${className}-${spec}-pre-raid`, slot, itemId: "", tier: "", rank: "", sourceType: "", sourceName: "", activity: "", boss: "", faction: "", race: "", profession: "", notes: "Template row — supply reviewed data before import.", provenanceId: "", verificationStatus: "unreviewed" }));
process.stdout.write(rowsToCsv(rows));
console.error(`Template for ${className} ${spec}. Valid contexts: ${contexts.join(", ")}. Valid phases: pre-raid, phase-1, phase-2, phase-3, phase-4, phase-5, phase-6.`);

import { validateGuides } from "../lib/guides/validate.ts";
import { publishedGuides } from "../lib/guides/registry.ts";
const errors = validateGuides();
console.log(JSON.stringify({ published: publishedGuides().length, moltenCore: `${publishedGuides("era").filter(guide => guide.type === "boss" && guide.raidId === 2000).length}/10`, blackwingLair: `${publishedGuides("era").filter(guide => guide.type === "boss" && guide.raidId === 2002).length}/8`, errors }, null, 2));
if (errors.length) process.exitCode = 1;

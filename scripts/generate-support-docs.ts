import fs from "node:fs";
import path from "node:path";
import { generatedSupportMarkdown } from "../lib/recommendations/support-matrix.ts";

const target = "docs/generated/recommendation-support.md";
const content = generatedSupportMarkdown("era");
if (!process.argv.includes("--write")) { process.stdout.write(content); process.exit(0); }
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, content, "utf8");
console.log(`Generated ${target}`);

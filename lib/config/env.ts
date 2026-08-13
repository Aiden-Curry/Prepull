import fs from "node:fs";
import path from "node:path";

export type ProjectEnvStatus = { loaded: boolean; clientIdPresent: boolean; clientSecretPresent: boolean; file: string };
export function loadProjectEnv(): ProjectEnvStatus { const file = path.resolve(".env.local"); if (fs.existsSync(file)) { for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if (!match || process.env[match[1]]) continue; let value = match[2]; if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1); process.env[match[1]] = value; } } return { loaded: fs.existsSync(file), clientIdPresent: Boolean(process.env.BATTLENET_CLIENT_ID), clientSecretPresent: Boolean(process.env.BATTLENET_CLIENT_SECRET), file }; }

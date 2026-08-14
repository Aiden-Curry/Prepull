import { URL } from "node:url";
export type ProductionConfigIssue = { field: string; message: string };
export function guildFeatureEnabled(env: NodeJS.ProcessEnv = process.env) { return env.GUILD_FEATURE_ENABLED === "true"; }
export function validateProductionConfig(env: NodeJS.ProcessEnv = process.env): ProductionConfigIssue[] {
  const issues: ProductionConfigIssue[] = [], localTest = env.PREPULL_PRODUCTION_TEST_MODE === "true";
  if (env.NODE_ENV !== "production") issues.push({ field: "NODE_ENV", message: "must be production" });
  if (env.GUILD_FEATURE_ENABLED !== "true" && env.GUILD_FEATURE_ENABLED !== "false") issues.push({ field: "GUILD_FEATURE_ENABLED", message: "must be explicitly true or false" });
  if (env.GUILD_REPOSITORY_DRIVER !== "postgres") issues.push({ field: "GUILD_REPOSITORY_DRIVER", message: "must be postgres" });
  if (!env.DATABASE_URL) issues.push({ field: "DATABASE_URL", message: "is required" }); else try { const url = new URL(env.DATABASE_URL); if (!["postgres:", "postgresql:"].includes(url.protocol)) issues.push({ field: "DATABASE_URL", message: "must use a PostgreSQL URL" }); if (env.TEST_DATABASE_URL && env.DATABASE_URL === env.TEST_DATABASE_URL) issues.push({ field: "DATABASE_URL", message: "must not equal TEST_DATABASE_URL" }); if (env.E2E_DATABASE_URL && env.DATABASE_URL === env.E2E_DATABASE_URL) issues.push({ field: "DATABASE_URL", message: "must not equal E2E_DATABASE_URL" }); } catch { issues.push({ field: "DATABASE_URL", message: "must be a valid PostgreSQL URL" }); }
  if (!env.NEXTAUTH_SECRET || env.NEXTAUTH_SECRET.length < 32) issues.push({ field: "NEXTAUTH_SECRET", message: "must be at least 32 characters" });
  if (!env.NEXTAUTH_URL) issues.push({ field: "NEXTAUTH_URL", message: "is required" }); else try { const url = new URL(env.NEXTAUTH_URL); if (!["http:", "https:"].includes(url.protocol)) issues.push({ field: "NEXTAUTH_URL", message: "must be an absolute HTTP(S) URL" }); if (!localTest && url.protocol !== "https:") issues.push({ field: "NEXTAUTH_URL", message: "must use HTTPS outside production-test mode" }); } catch { issues.push({ field: "NEXTAUTH_URL", message: "must be an absolute HTTP(S) URL" }); }
  if (env.PREPULL_SEED_MODE === "true") issues.push({ field: "PREPULL_SEED_MODE", message: "must be disabled" });
  if (env.GUILD_REPOSITORY_DRIVER === "memory") issues.push({ field: "GUILD_REPOSITORY_DRIVER", message: "memory repository is forbidden in production" });
  return issues;
}

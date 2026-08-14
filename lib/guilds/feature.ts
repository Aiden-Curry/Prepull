import { guildFeatureEnabled } from "../config/production.ts";
import { GuildDomainError } from "./errors.ts";
export function assertGuildFeatureEnabled() { if (process.env.NODE_ENV === "production" && !guildFeatureEnabled()) throw new GuildDomainError("UNAVAILABLE", "Guild workspaces are currently unavailable."); }

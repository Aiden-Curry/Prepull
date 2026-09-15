import { query, withTransaction } from "../guilds/db.ts";
import type { ContentVersion, Region } from "../types.ts";
import type { BattleNetDiscoveredCharacter, BattleNetDiscoveryStatus, BattleNetIdentity, BattleNetImportCharacter, BattleNetImportSession, BattleNetIntent, BattleNetOAuthState } from "./types.ts";

type Row = Record<string, any>;
const iso = (value: any) => value?.toISOString?.() ?? String(value);

export class BattleNetDomainError extends Error {
  readonly code: "invalid_state" | "collision" | "region_linked" | "not_found" | "expired" | "forbidden" | "busy";
  constructor(code: "invalid_state" | "collision" | "region_linked" | "not_found" | "expired" | "forbidden" | "busy", message: string) { super(message); this.code = code; this.name = "BattleNetDomainError"; }
}

function importCharacter(row: Row): BattleNetImportCharacter {
  return { id: row.id, providerCharacterId: row.provider_character_id ?? undefined, name: row.character_name, normalizedName: row.normalized_character_name, realmName: row.realm_name, realmSlug: row.realm_slug, region: row.region, realmType: row.character_realm_type, contentSupport: row.content_support, className: row.class_name ?? undefined, race: row.race ?? undefined, level: row.level ?? undefined, importStatus: row.import_status, failureCode: row.failure_code ?? undefined, attemptCount: row.attempt_count, savedCharacterId: row.saved_character_id ?? undefined };
}

export class BattleNetRepository {
  async createOAuthState(state: BattleNetOAuthState, now = new Date()) {
    await withTransaction(async (client) => {
      await client.query("DELETE FROM battle_net_oauth_states WHERE expires_at<$1", [now]);
      await client.query("DELETE FROM battle_net_login_grants WHERE expires_at<$1", [now]);
      await client.query("DELETE FROM battle_net_import_sessions WHERE expires_at<$1", [now]);
      await client.query(`INSERT INTO battle_net_oauth_states(state_hash,browser_binding_hash,provider_region,intent,initiating_user_id,content_version,callback_url,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [state.stateHash, state.browserBindingHash, state.region, state.intent, state.initiatingUserId ?? null, state.contentVersion, state.callbackUrl, state.expiresAt]);
    });
  }

  async consumeOAuthState(stateHash: string, browserBindingHash: string, now = new Date()) {
    const result = await query<Row>(`UPDATE battle_net_oauth_states SET consumed_at=$3 WHERE state_hash=$1 AND browser_binding_hash=$2 AND consumed_at IS NULL AND expires_at>$3 RETURNING state_hash,browser_binding_hash,provider_region,intent,initiating_user_id,content_version,callback_url,expires_at`, [stateHash, browserBindingHash, now]);
    const row = result.rows[0];
    if (!row) throw new BattleNetDomainError("invalid_state", "This Battle.net connection has expired or was already used.");
    return { stateHash: row.state_hash, browserBindingHash: row.browser_binding_hash, region: row.provider_region as Region, intent: row.intent as BattleNetIntent, initiatingUserId: row.initiating_user_id ?? undefined, contentVersion: row.content_version as ContentVersion, callbackUrl: row.callback_url, expiresAt: row.expires_at as Date };
  }

  async connectIdentity(input: { intent: BattleNetIntent; initiatingUserId?: string; region: Region; identity: BattleNetIdentity; now?: Date }) {
    const now = input.now ?? new Date();
    return withTransaction(async (client) => {
      const linked = (await client.query<Row>("SELECT id,user_id FROM battle_net_connections WHERE provider_region=$1 AND provider_subject=$2 FOR UPDATE", [input.region, input.identity.subject])).rows[0];
      if (input.intent === "link") {
        if (!input.initiatingUserId) throw new BattleNetDomainError("forbidden", "Sign in before connecting Battle.net.");
        if (linked && linked.user_id !== input.initiatingUserId) throw new BattleNetDomainError("collision", "That Battle.net account is already connected to another PrePull account.");
        const other = (await client.query<Row>("SELECT id FROM battle_net_connections WHERE user_id=$1 AND provider_region=$2 AND provider_subject<>$3 FOR UPDATE", [input.initiatingUserId, input.region, input.identity.subject])).rows[0];
        if (other) throw new BattleNetDomainError("region_linked", "A different Battle.net account is already connected for this region.");
        if (linked) {
          const updated = (await client.query<Row>("UPDATE battle_net_connections SET battle_tag=$2,provider_account_id=$3,last_authorized_at=$4,updated_at=$4 WHERE id=$1 RETURNING id", [linked.id, input.identity.battleTag, input.identity.accountId ?? null, now])).rows[0];
          return { userId: input.initiatingUserId, connectionId: updated.id, createdUser: false, reauthorized: true };
        }
        const connection = (await client.query<Row>(`INSERT INTO battle_net_connections(user_id,provider_region,provider_subject,provider_account_id,battle_tag,linked_at,last_authorized_at,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$6,$6,$6) RETURNING id`, [input.initiatingUserId, input.region, input.identity.subject, input.identity.accountId ?? null, input.identity.battleTag, now])).rows[0];
        return { userId: input.initiatingUserId, connectionId: connection.id, createdUser: false, reauthorized: false };
      }
      if (linked) {
        await client.query("UPDATE battle_net_connections SET battle_tag=$2,provider_account_id=$3,last_authorized_at=$4,updated_at=$4 WHERE id=$1", [linked.id, input.identity.battleTag, input.identity.accountId ?? null, now]);
        return { userId: linked.user_id as string, connectionId: linked.id as string, createdUser: false, reauthorized: true };
      }
      const user = (await client.query<Row>("INSERT INTO users(email,password_hash,name,active,created_at,updated_at) VALUES(NULL,NULL,$1,true,$2,$2) RETURNING id", [input.identity.battleTag, now])).rows[0];
      const connection = (await client.query<Row>(`INSERT INTO battle_net_connections(user_id,provider_region,provider_subject,provider_account_id,battle_tag,linked_at,last_authorized_at,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$6,$6,$6) RETURNING id`, [user.id, input.region, input.identity.subject, input.identity.accountId ?? null, input.identity.battleTag, now])).rows[0];
      return { userId: user.id as string, connectionId: connection.id as string, createdUser: true, reauthorized: false };
    });
  }

  async createImportSession(input: { userId: string; connectionId: string; contentVersion: ContentVersion; callbackUrl: string; discoveryStatus: BattleNetDiscoveryStatus; expiresAt: Date; characters: BattleNetDiscoveredCharacter[] }) {
    return withTransaction(async (client) => {
      const session = (await client.query<Row>(`INSERT INTO battle_net_import_sessions(user_id,connection_id,content_version,callback_url,discovery_status,expires_at) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`, [input.userId, input.connectionId, input.contentVersion, input.callbackUrl, input.discoveryStatus, input.expiresAt])).rows[0];
      for (const character of input.characters) await client.query(`INSERT INTO battle_net_import_characters(import_session_id,provider_character_id,character_name,normalized_character_name,realm_name,realm_slug,region,character_realm_type,content_support,class_name,race,level,import_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT DO NOTHING`, [session.id, character.providerCharacterId ?? null, character.name, character.normalizedName, character.realmName, character.realmSlug, character.region, character.realmType, character.contentSupport, character.className ?? null, character.race ?? null, character.level ?? null, character.contentSupport === "supported" ? "pending" : "unsupported"]);
      return session.id as string;
    });
  }

  async createLoginGrant(tokenHash: string, userId: string, importSessionId: string, expiresAt: Date) {
    await query("INSERT INTO battle_net_login_grants(token_hash,user_id,import_session_id,expires_at) VALUES($1,$2,$3,$4)", [tokenHash, userId, importSessionId, expiresAt]);
  }

  async consumeLoginGrant(tokenHash: string, now = new Date()) {
    const result = await query<Row>(`UPDATE battle_net_login_grants grants SET consumed_at=$2 FROM users WHERE grants.token_hash=$1 AND grants.consumed_at IS NULL AND grants.expires_at>$2 AND users.id=grants.user_id AND users.active=true RETURNING users.id,users.email,users.name,grants.import_session_id`, [tokenHash, now]);
    return result.rows[0] ? { id: result.rows[0].id as string, email: result.rows[0].email as string | null, name: result.rows[0].name as string, importSessionId: result.rows[0].import_session_id as string } : undefined;
  }

  async getImportSession(userId: string, sessionId: string, now = new Date()): Promise<BattleNetImportSession> {
    const session = (await query<Row>("SELECT * FROM battle_net_import_sessions WHERE id=$1 AND user_id=$2", [sessionId, userId])).rows[0];
    if (!session) throw new BattleNetDomainError("not_found", "Battle.net import session not found.");
    if (new Date(session.expires_at) <= now) throw new BattleNetDomainError("expired", "This character discovery session has expired.");
    const characters = await query<Row>("SELECT * FROM battle_net_import_characters WHERE import_session_id=$1 ORDER BY content_support,character_name,realm_name", [sessionId]);
    return { id: session.id, userId: session.user_id, connectionId: session.connection_id, contentVersion: session.content_version, callbackUrl: session.callback_url, discoveryStatus: session.discovery_status, expiresAt: iso(session.expires_at), completedAt: session.completed_at ? iso(session.completed_at) : undefined, characters: characters.rows.map(importCharacter) };
  }

  async claimImportCharacter(userId: string, sessionId: string, characterId: string, now = new Date()) {
    return withTransaction(async (client) => {
      const row = (await client.query<Row>(`SELECT characters.* FROM battle_net_import_characters characters JOIN battle_net_import_sessions sessions ON sessions.id=characters.import_session_id WHERE characters.id=$1 AND sessions.id=$2 AND sessions.user_id=$3 AND sessions.expires_at>$4 FOR UPDATE OF characters`, [characterId, sessionId, userId, now])).rows[0];
      if (!row) throw new BattleNetDomainError("not_found", "Discovered character not found.");
      if (row.content_support !== "supported") return importCharacter(row);
      if (["imported", "already_added"].includes(row.import_status)) return importCharacter(row);
      if (row.import_status === "importing") throw new BattleNetDomainError("busy", "This character is already importing.");
      const claimed = (await client.query<Row>("UPDATE battle_net_import_characters SET import_status='importing',failure_code=NULL,attempt_count=attempt_count+1,updated_at=$2 WHERE id=$1 RETURNING *", [characterId, now])).rows[0];
      return importCharacter(claimed);
    });
  }

  async completeImportCharacter(characterId: string, status: "imported" | "already_added" | "failed", savedCharacterId?: string, failureCode?: string) {
    const result = await query<Row>("UPDATE battle_net_import_characters SET import_status=$2,saved_character_id=$3,failure_code=$4,updated_at=now() WHERE id=$1 RETURNING *", [characterId, status, savedCharacterId ?? null, failureCode ?? null]);
    if (!result.rows[0]) throw new BattleNetDomainError("not_found", "Discovered character not found.");
    return importCharacter(result.rows[0]);
  }

  async markSessionComplete(userId: string, sessionId: string) { await query("UPDATE battle_net_import_sessions SET completed_at=now() WHERE id=$1 AND user_id=$2", [sessionId, userId]); }

  async listConnections(userId: string) {
    const result = await query<Row>("SELECT id,provider_region,battle_tag,linked_at,last_authorized_at FROM battle_net_connections WHERE user_id=$1 ORDER BY provider_region", [userId]);
    return result.rows.map((row) => ({ id: row.id as string, region: row.provider_region as Region, battleTag: row.battle_tag as string, linkedAt: iso(row.linked_at), lastAuthorizedAt: iso(row.last_authorized_at) }));
  }
}

export const battleNetRepository = new BattleNetRepository();

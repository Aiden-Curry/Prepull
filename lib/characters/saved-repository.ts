import { query, withTransaction } from "../guilds/db.ts";
import { GuildDomainError } from "../guilds/errors.ts";
import { normalizeLookup } from "./normalization.ts";
import type { SaveCharacterInput, SavedCharacter } from "./saved-types.ts";

type Row = Record<string, any>;
const iso = (value: any) => value?.toISOString?.() ?? value ?? undefined;
const fromRow = (row: Row): SavedCharacter => ({
  id: row.id, userId: row.user_id, region: row.region, realmSlug: row.realm_slug, realmName: row.realm_name,
  characterName: row.character_name, normalizedCharacterName: row.normalized_character_name,
  characterRealmType: row.character_realm_type, contentVersion: row.content_version, className: row.class_name,
  level: row.level, race: row.race, faction: row.faction, lastSyncedAt: iso(row.last_synced_at),
  isPrimary: row.is_primary, createdAt: iso(row.created_at)!, updatedAt: iso(row.updated_at)!, archivedAt: iso(row.archived_at),
});

const select = `SELECT id,user_id,region,realm_slug,realm_name,character_name,normalized_character_name,character_realm_type,content_version,class_name,level,race,faction,last_synced_at,is_primary,created_at,updated_at,archived_at FROM user_characters`;

export class SavedCharacterRepository {
  async listSavedCharacters(userId: string) {
    const result = await query<Row>(`${select} WHERE user_id=$1 AND archived_at IS NULL ORDER BY is_primary DESC, character_name ASC`, [userId]);
    return result.rows.map(fromRow);
  }
  async getSavedCharacter(userId: string, characterId: string) {
    const result = await query<Row>(`${select} WHERE user_id=$1 AND id=$2 AND archived_at IS NULL`, [userId, characterId]);
    return result.rows[0] ? fromRow(result.rows[0]) : undefined;
  }
  async saveCharacter(userId: string, input: SaveCharacterInput) {
    return withTransaction(async (client) => {
      const existing = await client.query<Row>(`${select} WHERE user_id=$1 AND region=$2 AND realm_slug=$3 AND normalized_character_name=$4 AND character_realm_type=$5 AND archived_at IS NULL`, [userId, input.region, input.realmSlug, input.normalizedCharacterName, input.characterRealmType]);
      if (existing.rows[0]) return fromRow(existing.rows[0]);
      const count = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM user_characters WHERE user_id=$1 AND archived_at IS NULL`, [userId]);
      const result = await client.query<Row>(`INSERT INTO user_characters(user_id,region,realm_slug,realm_name,character_name,normalized_character_name,character_realm_type,content_version,class_name,level,race,faction,last_synced_at,is_primary) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [userId, input.region, input.realmSlug, input.realmName, input.characterName, input.normalizedCharacterName, input.characterRealmType, input.contentVersion, input.className, input.level, input.race, input.faction, input.lastSyncedAt ?? null, count.rows[0].count === "0"]);
      return fromRow(result.rows[0]);
    });
  }
  async removeSavedCharacter(userId: string, characterId: string) {
    return withTransaction(async (client) => {
      const result = await client.query<Row>(`${select} WHERE user_id=$1 AND id=$2 AND archived_at IS NULL FOR UPDATE`, [userId, characterId]);
      if (!result.rows[0]) throw new GuildDomainError("NOT_FOUND", "Saved character not found.");
      const wasPrimary = result.rows[0].is_primary;
      await client.query(`UPDATE user_characters SET archived_at=now(), is_primary=false, updated_at=now() WHERE user_id=$1 AND id=$2`, [userId, characterId]);
      if (wasPrimary) await client.query(`UPDATE user_characters SET is_primary=true, updated_at=now() WHERE id=(SELECT id FROM user_characters WHERE user_id=$1 AND archived_at IS NULL ORDER BY created_at ASC LIMIT 1)`, [userId]);
    });
  }
  async setPrimaryCharacter(userId: string, characterId: string) {
    return withTransaction(async (client) => {
      const target = await client.query<Row>(`${select} WHERE user_id=$1 AND id=$2 AND archived_at IS NULL FOR UPDATE`, [userId, characterId]);
      if (!target.rows[0]) throw new GuildDomainError("NOT_FOUND", "Saved character not found.");
      await client.query(`UPDATE user_characters SET is_primary=false, updated_at=now() WHERE user_id=$1 AND archived_at IS NULL`, [userId]);
      const result = await client.query<Row>(`UPDATE user_characters SET is_primary=true, updated_at=now() WHERE user_id=$1 AND id=$2 RETURNING *`, [userId, characterId]);
      return fromRow(result.rows[0]);
    });
  }
  async getPrimaryCharacter(userId: string) {
    const result = await query<Row>(`${select} WHERE user_id=$1 AND is_primary=true AND archived_at IS NULL`, [userId]);
    return result.rows[0] ? fromRow(result.rows[0]) : undefined;
  }
}

export const normalizeSavedCharacterInput = (input: SaveCharacterInput): SaveCharacterInput => ({ ...input, realmSlug: normalizeLookup(input.realmSlug), normalizedCharacterName: normalizeLookup(input.characterName) });
export const savedCharacterRepository = new SavedCharacterRepository();

import bcrypt from "bcryptjs";
import { withTransaction } from "../lib/guilds/db.ts";
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production environment.");
await withTransaction(async (client) => {
  const email = process.env.PREPULL_SEED_EMAIL ?? "owner@prepull.local";
  const passwordHash = await bcrypt.hash(process.env.PREPULL_SEED_PASSWORD ?? "dev-only-change-me", 12);
  const user = await client.query("INSERT INTO users(email,password_hash,name) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET name=excluded.name RETURNING id", [email, passwordHash, "PrePull Development Owner"]);
  const userId = user.rows[0].id;
  await client.query("INSERT INTO user_profiles(user_id,display_name) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING", [userId, "PrePull Development Owner"]);
  const existing = await client.query("SELECT id FROM guilds WHERE owner_user_id=$1 AND name=$2 AND archived_at IS NULL", [userId, "PrePull Development Guild"]);
  const guild = existing.rows[0] ?? (await client.query("INSERT INTO guilds(name,region,realm_slug,realm_name,character_realm_type,content_version,faction,description,owner_user_id) VALUES('PrePull Development Guild','eu','firemaw','Firemaw','era','era','Horde','Development-only seeded guild.',$1) RETURNING id", [userId])).rows[0];
  await client.query("INSERT INTO guild_workspace_memberships(guild_id,user_id,role,capabilities) VALUES($1,$2,'owner',$3) ON CONFLICT(guild_id,user_id) DO UPDATE SET active=true,role='owner'", [guild.id, userId, JSON.stringify(["import-roster", "manage-roster", "manage-raid", "manage-assignments", "manage-signup-overrides"])]);
  console.log(`Seeded development user ${email} and guild ${guild.id}.`);
});

"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "../auth.ts";
import { disableReadinessShare, enableReadinessShare } from "./readiness-service.ts";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const refresh = (version: string, guildId: string) => {
  revalidatePath(`/${version}/profile`);
  revalidatePath(`/${version}/guilds/${guildId}/raids`);
};

export async function enableReadinessShareAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const guildId = text(form, "guildId");
  const guildCharacterId = text(form, "guildCharacterId");
  const userCharacterId = text(form, "userCharacterId");
  if (!guildId || !guildCharacterId || !userCharacterId) throw new Error("Readiness sharing could not be enabled.");
  await enableReadinessShare(user.id, guildId, guildCharacterId, userCharacterId);
  refresh(text(form, "version") || "era", guildId);
}

export async function disableReadinessShareAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const shareId = text(form, "shareId");
  if (!shareId) throw new Error("Readiness sharing could not be disabled.");
  await disableReadinessShare(user.id, shareId);
  refresh(text(form, "version") || "era", text(form, "guildId"));
}

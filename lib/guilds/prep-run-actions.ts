"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "../auth.ts";
import { prepRunService } from "./prep-run-service.ts";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const versionFrom = (form: FormData) => text(form, "version") === "tbc" ? "tbc" : "era";
const listPath = (version: string, guildId: string) => `/${version}/guilds/${guildId}/prep`;
const runPath = (version: string, guildId: string, runId: string) => `${listPath(version, guildId)}/${runId}`;
const safeFailure = (path: string) => `${path}?prepError=${encodeURIComponent("The Prep Run request could not be completed.")}`;

export async function createPrepRunAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const version = versionFrom(form), guildId = text(form, "guildId"), raidId = text(form, "raidId");
  let runId: string;
  try { runId = await prepRunService.create(user.id, guildId, raidId, text(form, "activityKey"), text(form, "scheduledFor"), text(form, "note")); }
  catch { redirect(safeFailure(`/${version}/guilds/${guildId}/raids/${raidId}/prep`)); }
  revalidatePath(listPath(version, guildId));
  revalidatePath(`/${version}/guilds/${guildId}/raids/${raidId}/prep`);
  redirect(runPath(version, guildId, runId));
}

export async function updatePrepRunAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const version = versionFrom(form), guildId = text(form, "guildId"), runId = text(form, "runId");
  try { await prepRunService.update(user.id, guildId, runId, text(form, "scheduledFor"), text(form, "note")); }
  catch { redirect(safeFailure(listPath(version, guildId))); }
  revalidatePath(runPath(version, guildId, runId)); revalidatePath(listPath(version, guildId));
  redirect(`${runPath(version, guildId, runId)}?prepNotice=${encodeURIComponent("Prep Run updated.")}`);
}

export async function setPrepRunStatusAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const version = versionFrom(form), guildId = text(form, "guildId"), runId = text(form, "runId");
  const status = text(form, "status") as "cancelled" | "completed";
  try { await prepRunService.setStatus(user.id, guildId, runId, status); }
  catch { redirect(safeFailure(listPath(version, guildId))); }
  revalidatePath(runPath(version, guildId, runId)); revalidatePath(listPath(version, guildId));
  redirect(`${runPath(version, guildId, runId)}?prepNotice=${encodeURIComponent(status === "completed" ? "Prep Run marked complete." : "Prep Run cancelled.")}`);
}

export async function setMyPrepRunSignupAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const version = versionFrom(form), guildId = text(form, "guildId"), runId = text(form, "runId");
  const status = text(form, "status") as "going" | "maybe" | "leave";
  try { await prepRunService.setMySignup(user.id, guildId, runId, status); }
  catch { redirect(safeFailure(listPath(version, guildId))); }
  revalidatePath(runPath(version, guildId, runId)); revalidatePath(listPath(version, guildId));
  redirect(`${runPath(version, guildId, runId)}?prepNotice=${encodeURIComponent(status === "leave" ? "You left this Prep Run." : `Your response is ${status}.`)}`);
}

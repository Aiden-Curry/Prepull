"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "../auth.ts";
import { prepRunService } from "./prep-run-service.ts";
import { GuildDomainError } from "./errors.ts";

const text = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();
const versionFrom = (form: FormData) =>
  text(form, "version") === "tbc" ? "tbc" : "era";
const listPath = (version: string, guildId: string) =>
  `/${version}/guilds/${guildId}/prep`;
const runPath = (version: string, guildId: string, runId: string) =>
  `${listPath(version, guildId)}/${runId}`;
const safeFailure = (path: string, error?: unknown) => {
  const message =
    error instanceof GuildDomainError && error.code === "CONFLICT"
      ? error.message
      : "The Prep Run request could not be completed.";
  return `${path}?prepError=${encodeURIComponent(message)}`;
};

export async function createPrepRunAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const version = versionFrom(form),
    guildId = text(form, "guildId"),
    raidId = text(form, "raidId");
  let runId: string;
  try {
    runId = await prepRunService.create(
      user.id,
      guildId,
      raidId,
      text(form, "activityKey"),
      {
        localDate: text(form, "localDate"),
        localTime: text(form, "localTime"),
        offsetChoice: text(form, "offsetChoice"),
      },
      text(form, "note"),
    );
  } catch (error) {
    redirect(
      safeFailure(`/${version}/guilds/${guildId}/raids/${raidId}/prep`, error),
    );
  }
  revalidatePath(listPath(version, guildId));
  revalidatePath(`/${version}/guilds/${guildId}`);
  revalidatePath(`/${version}/guilds/${guildId}/schedule`);
  revalidatePath(`/${version}/guilds/${guildId}/raids/${raidId}/prep`);
  redirect(runPath(version, guildId, runId));
}

export async function updatePrepRunAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const version = versionFrom(form),
    guildId = text(form, "guildId"),
    runId = text(form, "runId");
  try {
    await prepRunService.update(
      user.id,
      guildId,
      runId,
      {
        localDate: text(form, "localDate"),
        localTime: text(form, "localTime"),
        offsetChoice: text(form, "offsetChoice"),
      },
      text(form, "note"),
    );
  } catch (error) {
    redirect(safeFailure(runPath(version, guildId, runId), error));
  }
  revalidatePath(runPath(version, guildId, runId));
  revalidatePath(listPath(version, guildId));
  revalidatePath(`/${version}/guilds/${guildId}`);
  revalidatePath(`/${version}/guilds/${guildId}/schedule`);
  redirect(
    `${runPath(version, guildId, runId)}?prepNotice=${encodeURIComponent("Prep Run updated.")}`,
  );
}

export async function setPrepRunStatusAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const version = versionFrom(form),
    guildId = text(form, "guildId"),
    runId = text(form, "runId");
  const status = text(form, "status") as "cancelled" | "completed";
  try {
    await prepRunService.setStatus(user.id, guildId, runId, status);
  } catch {
    redirect(safeFailure(listPath(version, guildId)));
  }
  revalidatePath(runPath(version, guildId, runId));
  revalidatePath(listPath(version, guildId));
  revalidatePath(`/${version}/guilds/${guildId}`);
  revalidatePath(`/${version}/guilds/${guildId}/schedule`);
  redirect(
    `${runPath(version, guildId, runId)}?prepNotice=${encodeURIComponent(status === "completed" ? "Prep Run marked complete." : "Prep Run cancelled.")}`,
  );
}

export async function setMyPrepRunSignupAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const version = versionFrom(form),
    guildId = text(form, "guildId"),
    runId = text(form, "runId");
  const status = text(form, "status") as "going" | "maybe" | "leave";
  try {
    await prepRunService.setMySignup(user.id, guildId, runId, status);
  } catch {
    redirect(safeFailure(listPath(version, guildId)));
  }
  revalidatePath(runPath(version, guildId, runId));
  revalidatePath(listPath(version, guildId));
  redirect(
    `${runPath(version, guildId, runId)}?prepNotice=${encodeURIComponent(status === "leave" ? "You left this Prep Run." : `Your response is ${status}.`)}`,
  );
}

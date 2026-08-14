import { notFound } from "next/navigation";
import {
  createGuildAction, importGuildAction, addMemberAction, createRaidAction, signupAction,
  selectRosterAction, saveGroupAction, saveAssignmentAction, reorderAssignmentAction,
  duplicateAssignmentAction, duplicateSectionAction, reorderSectionAction, deleteSectionAction,
  saveSignupOverrideAction, clearSignupOverrideAction, saveRosterStateAction, toggleRosterLockAction,
  previewCsvImportAction, applyCsvImportAction, saveMainAltAction, updateGuildSettingsAction,
  changeMemberRoleAction, setCapabilityOverrideAction, deactivateMemberAction, activateMemberAction,
  removeMemberAction, transferOwnershipAction, decideClaimAction, submitClaimAction,
} from "../../../../lib/guilds/actions";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ actionName: string }> };
type FormAction = (form: FormData) => Promise<void>;
const Field = ({ name, value = "00000000-0000-0000-0000-000000000000" }: { name: string; value?: string }) => <input type="hidden" name={name} value={value} />;
const Form = ({ actionName, action, children }: { actionName: string; action: FormAction; children: React.ReactNode }) => <main><h1>Server Action acceptance harness</h1><form action={action} data-testid="server-action-form" data-action={actionName}>{children}<button type="submit">Submit {actionName}</button></form></main>;
const previewAsFormAction: FormAction = async (form) => { "use server"; await previewCsvImportAction(form); };

export default async function ActionHarnessPage({ params }: Props) {
  if (process.env.E2E_SERVER_ACTION_HARNESS_ENABLED !== "true") notFound();
  const { actionName } = await params;
  switch (actionName) {
    case "createGuildAction": return <Form actionName={actionName} action={createGuildAction}><label>Name<input name="name" defaultValue="Harness Guild" /></label><Field name="region" value="eu" /><Field name="realmSlug" value="firemaw" /><Field name="realmName" value="Firemaw" /><Field name="characterRealmType" value="era" /><Field name="contentVersion" value="era" /><Field name="faction" value="Horde" /><Field name="description" value="Acceptance-only guild" /></Form>;
    case "importGuildAction": return <Form actionName={actionName} action={importGuildAction}><Field name="payload" value="{}" /></Form>;
    case "addMemberAction": return <Form actionName={actionName} action={addMemberAction}><Field name="guildId" /><Field name="characterId" value="harness-character" /><Field name="characterName" value="Harness Character" /><Field name="className" value="Warrior" /><Field name="spec" value="Fury" /><Field name="level" value="60" /><Field name="race" value="Orc" /><Field name="faction" value="Horde" /><Field name="realm" value="Firemaw" /><Field name="region" value="eu" /><Field name="realmType" value="era" /><Field name="contentVersion" value="era" /><Field name="role" value="DPS" /><Field name="readiness" value="unknown" /></Form>;
    case "createRaidAction": return <Form actionName={actionName} action={createRaidAction}><Field name="guildId" /><Field name="name" value="Harness Raid" /><Field name="instance" value="Molten Core" /><Field name="startsAt" value="2030-01-01T20:00" /><Field name="durationMinutes" value="180" /></Form>;
    case "signupAction": return <Form actionName={actionName} action={signupAction}><Field name="guildId" /><Field name="eventId" /><Field name="characterId" /><Field name="status" value="confirmed" /><Field name="preferredRole" value="DPS" /><Field name="alternateRole" value="" /><Field name="note" value="" /></Form>;
    case "selectRosterAction": return <Form actionName={actionName} action={selectRosterAction}><Field name="guildId" /><Field name="eventId" /><Field name="characterId" /></Form>;
    case "saveGroupAction": return <Form actionName={actionName} action={saveGroupAction}><Field name="guildId" /><Field name="eventId" /><Field name="groupId" value="Group 1" /><Field name="groupName" value="Group 1" /><Field name="memberCharacterId" /></Form>;
    case "saveAssignmentAction": return <Form actionName={actionName} action={saveAssignmentAction}><Field name="guildId" /><Field name="eventId" /><Field name="assignmentVersion" value="1" /><Field name="operation" value="create" /><Field name="assignmentId" /><Field name="category" value="custom" /><Field name="section" value="raid-wide" /><Field name="label" value="Harness assignment" /><Field name="detail" value="" /><Field name="assigneeId" /></Form>;
    case "reorderAssignmentAction": return <Form actionName={actionName} action={reorderAssignmentAction}><Field name="guildId" /><Field name="eventId" /><Field name="assignmentVersion" value="1" /><Field name="section" value="raid-wide" /><Field name="assignmentId" /><Field name="direction" value="up" /></Form>;
    case "duplicateAssignmentAction": return <Form actionName={actionName} action={duplicateAssignmentAction}><Field name="guildId" /><Field name="eventId" /><Field name="assignmentVersion" value="1" /><Field name="assignmentId" /><Field name="copyAssignees" value="true" /></Form>;
    case "duplicateSectionAction": return <Form actionName={actionName} action={duplicateSectionAction}><Field name="guildId" /><Field name="eventId" /><Field name="assignmentVersion" value="1" /><Field name="section" value="raid-wide" /><Field name="copyAssignees" value="true" /></Form>;
    case "reorderSectionAction": return <Form actionName={actionName} action={reorderSectionAction}><Field name="guildId" /><Field name="eventId" /><Field name="assignmentVersion" value="1" /><Field name="section" value="raid-wide" /><Field name="direction" value="up" /></Form>;
    case "deleteSectionAction": return <Form actionName={actionName} action={deleteSectionAction}><Field name="guildId" /><Field name="eventId" /><Field name="assignmentVersion" value="1" /><Field name="section" value="raid-wide" /></Form>;
    case "saveSignupOverrideAction": return <Form actionName={actionName} action={saveSignupOverrideAction}><Field name="guildId" /><Field name="eventId" /><Field name="memberId" /><Field name="effectiveStatus" value="accepted" /><Field name="reason" value="Harness" /></Form>;
    case "clearSignupOverrideAction": return <Form actionName={actionName} action={clearSignupOverrideAction}><Field name="guildId" /><Field name="eventId" /><Field name="memberId" /></Form>;
    case "saveRosterStateAction": return <Form actionName={actionName} action={saveRosterStateAction}><Field name="guildId" /><Field name="eventId" /><Field name="rosterVersion" value="1" /><Field name="selectedId" /><Field name="groupEntry" value="Group 1:00000000-0000-0000-0000-000000000000" /><Field name="roleEntry" value="00000000-0000-0000-0000-000000000000:DPS" /></Form>;
    case "toggleRosterLockAction": return <Form actionName={actionName} action={toggleRosterLockAction}><Field name="guildId" /><Field name="eventId" /><Field name="rosterVersion" value="1" /><Field name="locked" value="true" /></Form>;
    case "previewCsvImportAction": return <Form actionName={actionName} action={previewAsFormAction}><Field name="guildId" /><Field name="csv" value="name,region,realm,class,level,faction\nHarness,eu,Firemaw,Warrior,60,Horde" /></Form>;
    case "applyCsvImportAction": return <Form actionName={actionName} action={applyCsvImportAction}><Field name="guildId" /><Field name="csv" value="name,region,realm,class,level,faction\nHarness,eu,Firemaw,Warrior,60,Horde" /><Field name="policy" value="leave-unchanged" /><Field name="rosterVersion" value="1" /><Field name="previewToken" value="invalid" /><Field name="decisions" value="{}" /></Form>;
    case "saveMainAltAction": return <Form actionName={actionName} action={saveMainAltAction}><Field name="guildId" /><Field name="altMemberId" /><Field name="mainMemberId" /><Field name="reason" value="Harness" /></Form>;
    case "updateGuildSettingsAction": return <Form actionName={actionName} action={updateGuildSettingsAction}><Field name="guildId" /><Field name="name" value="Harness guild" /><Field name="description" value="Harness" /><Field name="raidTimezone" value="UTC" /><Field name="defaultContentVersion" value="era" /><Field name="defaultAvailabilityPhase" value="6" /><Field name="internalNotes" value="" /></Form>;
    case "changeMemberRoleAction": return <Form actionName={actionName} action={changeMemberRoleAction}><Field name="guildId" /><Field name="targetUserId" /><Field name="role" value="member" /></Form>;
    case "setCapabilityOverrideAction": return <Form actionName={actionName} action={setCapabilityOverrideAction}><Field name="guildId" /><Field name="targetUserId" /><Field name="capability" value="manage-roster" /><Field name="mode" value="inherit" /></Form>;
    case "deactivateMemberAction": return <Form actionName={actionName} action={deactivateMemberAction}><Field name="guildId" /><Field name="targetUserId" /></Form>;
    case "activateMemberAction": return <Form actionName={actionName} action={activateMemberAction}><Field name="guildId" /><Field name="targetUserId" /></Form>;
    case "removeMemberAction": return <Form actionName={actionName} action={removeMemberAction}><Field name="guildId" /><Field name="targetUserId" /></Form>;
    case "transferOwnershipAction": return <Form actionName={actionName} action={transferOwnershipAction}><Field name="guildId" /><Field name="targetUserId" /><Field name="confirmation" value="wrong" /></Form>;
    case "decideClaimAction": return <Form actionName={actionName} action={decideClaimAction}><Field name="guildId" /><Field name="claimId" /><Field name="decision" value="approved" /><Field name="reason" value="Harness" /></Form>;
    case "submitClaimAction": return <Form actionName={actionName} action={submitClaimAction}><Field name="guildId" /><Field name="memberId" /></Form>;
    default: notFound();
  }
}

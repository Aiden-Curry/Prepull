import {
  createGuildAction, importGuildAction, addMemberAction, createRaidAction, signupAction,
  selectRosterAction, saveGroupAction, saveAssignmentAction, reorderAssignmentAction,
  duplicateAssignmentAction, duplicateSectionAction, reorderSectionAction, deleteSectionAction,
  saveSignupOverrideAction, clearSignupOverrideAction, saveRosterStateAction, toggleRosterLockAction,
  previewCsvImportAction, applyCsvImportAction, saveMainAltAction, updateGuildSettingsAction,
  changeMemberRoleAction, setCapabilityOverrideAction, deactivateMemberAction, activateMemberAction,
  removeMemberAction, transferOwnershipAction, decideClaimAction, submitClaimAction,
} from "../../../lib/guilds/actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const value = (params: Record<string, string | string[] | undefined>, key: string) => String(params[key] ?? "00000000-0000-0000-0000-000000000000");
const Field = ({ name, value: fieldValue }: { name: string; value: string }) => <input type="hidden" name={name} value={fieldValue} />;
type Action = (form: FormData) => Promise<void>;
const Form = ({ name, action, children }: { name: string; action: Action; children: React.ReactNode }) => <form action={action} data-action={name}>{children}<button type="submit">Run {name}</button></form>;

export default async function ActionHarness({ searchParams }: Props) {
  if ((await headers()).get("x-prepull-acceptance") !== "true") notFound();
  const p = await searchParams;
  const a = value(p, "guildA"); const b = value(p, "guildB"); const raidA = value(p, "raidA"); const raidB = value(p, "raidB");
  const memberA = value(p, "memberA"); const memberB = value(p, "memberB"); const userB = value(p, "userB"); const claimB = value(p, "claimB");
  const assignmentA = value(p, "assignmentA"); const sectionA = value(p, "sectionA");
  return <main><h1>Acceptance action harness</h1>
    <Form name="createGuildAction" action={createGuildAction}><Field name="name" value=""/><Field name="region" value="invalid"/></Form>
    <Form name="importGuildAction" action={importGuildAction}><Field name="payload" value="not-json"/></Form>
    <Form name="addMemberAction" action={addMemberAction}><Field name="guildId" value={b}/><Field name="characterId" value={memberB}/><Field name="characterName" value="cross-guild"/><Field name="className" value="Warrior"/><Field name="level" value="not-a-number"/><Field name="faction" value="Unknown"/></Form>
    <Form name="createRaidAction" action={createRaidAction}><Field name="guildId" value={b}/><Field name="name" value="cross-guild"/><Field name="instance" value="Unknown"/><Field name="startsAt" value=""/></Form>
    <Form name="signupAction" action={signupAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="characterId" value={memberB}/><Field name="status" value="unsupported"/></Form>
    <Form name="selectRosterAction" action={selectRosterAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="characterId" value={memberB}/></Form>
    <Form name="saveGroupAction" action={saveGroupAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="groupId" value={"bad-group"}/><Field name="groupName" value="cross-guild"/><Field name="memberCharacterId" value={memberB}/></Form>
    <Form name="saveAssignmentAction" action={saveAssignmentAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="assignmentVersion" value="-1"/><Field name="operation" value="invalid"/><Field name="assignmentId" value={assignmentA}/><Field name="category" value="unknown"/><Field name="section" value={sectionA}/><Field name="label" value="cross-guild"/><Field name="detail" value="private hidden marker"/><Field name="assigneeId" value={memberB}/></Form>
    <Form name="reorderAssignmentAction" action={reorderAssignmentAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="assignmentVersion" value="999999999"/><Field name="section" value={sectionA}/><Field name="assignmentId" value={assignmentA}/><Field name="direction" value="invalid"/></Form>
    <Form name="duplicateAssignmentAction" action={duplicateAssignmentAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="assignmentVersion" value="-1"/><Field name="assignmentId" value={assignmentA}/><Field name="copyAssignees" value="maybe"/></Form>
    <Form name="duplicateSectionAction" action={duplicateSectionAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="assignmentVersion" value="-1"/><Field name="section" value={sectionA}/></Form>
    <Form name="reorderSectionAction" action={reorderSectionAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="assignmentVersion" value="-1"/><Field name="section" value={sectionA}/><Field name="direction" value="invalid"/></Form>
    <Form name="deleteSectionAction" action={deleteSectionAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="assignmentVersion" value="-1"/><Field name="section" value={sectionA}/></Form>
    <Form name="saveSignupOverrideAction" action={saveSignupOverrideAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="memberId" value={memberB}/><Field name="effectiveStatus" value="invalid"/><Field name="reason" value="private hidden marker"/></Form>
    <Form name="clearSignupOverrideAction" action={clearSignupOverrideAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="memberId" value={memberB}/></Form>
    <Form name="saveRosterStateAction" action={saveRosterStateAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="rosterVersion" value="-1"/><Field name="selectedId" value={memberB}/><Field name="groupEntry" value={"Group 1:" + memberB}/></Form>
    <Form name="toggleRosterLockAction" action={toggleRosterLockAction}><Field name="guildId" value={b}/><Field name="eventId" value={raidB}/><Field name="rosterVersion" value="-1"/><Field name="locked" value="not-boolean"/></Form>
    <Form name="previewCsvImportAction" action={async (form) => { await previewCsvImportAction(form); }}><Field name="guildId" value={b}/><Field name="csv" value="private hidden marker"/></Form>
    <Form name="applyCsvImportAction" action={applyCsvImportAction}><Field name="guildId" value={b}/><Field name="csv" value="not persisted"/><Field name="policy" value="invalid"/><Field name="rosterVersion" value="-1"/><Field name="previewToken" value="invalid"/><Field name="decisions" value="[]"/></Form>
    <Form name="saveMainAltAction" action={saveMainAltAction}><Field name="guildId" value={b}/><Field name="altMemberId" value={memberB}/><Field name="mainMemberId" value={memberB}/><Field name="reason" value="private hidden marker"/></Form>
    <Form name="updateGuildSettingsAction" action={updateGuildSettingsAction}><Field name="guildId" value={b}/><Field name="name" value="cross-guild"/><Field name="defaultContentVersion" value="invalid"/><Field name="defaultAvailabilityPhase" value="-1"/><Field name="internalNotes" value="private hidden marker"/></Form>
    <Form name="changeMemberRoleAction" action={changeMemberRoleAction}><Field name="guildId" value={b}/><Field name="targetUserId" value={userB}/><Field name="role" value="invalid"/></Form>
    <Form name="setCapabilityOverrideAction" action={setCapabilityOverrideAction}><Field name="guildId" value={b}/><Field name="targetUserId" value={userB}/><Field name="capability" value="invalid"/><Field name="mode" value="invalid"/></Form>
    <Form name="deactivateMemberAction" action={deactivateMemberAction}><Field name="guildId" value={b}/><Field name="targetUserId" value={userB}/></Form>
    <Form name="activateMemberAction" action={activateMemberAction}><Field name="guildId" value={b}/><Field name="targetUserId" value={userB}/></Form>
    <Form name="removeMemberAction" action={removeMemberAction}><Field name="guildId" value={b}/><Field name="targetUserId" value={userB}/></Form>
    <Form name="transferOwnershipAction" action={transferOwnershipAction}><Field name="guildId" value={b}/><Field name="targetUserId" value={userB}/><Field name="confirmation" value="wrong"/></Form>
    <Form name="decideClaimAction" action={decideClaimAction}><Field name="guildId" value={b}/><Field name="claimId" value={claimB}/><Field name="decision" value="invalid"/><Field name="reason" value="private hidden marker"/></Form>
    <Form name="submitClaimAction" action={submitClaimAction}><Field name="guildId" value={b}/><Field name="memberId" value={memberB}/></Form>
  </main>;
}
import { notFound } from "next/navigation";
import { headers } from "next/headers";

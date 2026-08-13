import { eraFuryCandidates } from "../dataset.ts";
import { eraFuryWarriorProfile } from "../profiles.ts";
import { scoreLoadout } from "../engine.ts";
import { furyCalibrationCases, furyCalibrationFixtures } from "./fixtures.ts";
import { manualFuryReferences } from "./references.ts";
import type { CalibrationCase, CalibrationComparison, CalibrationReference, CalibrationReport, CalibrationSeverity, CalibrationThresholds } from "./types.ts";
import { validateCalibrationCase } from "./validate.ts";

export const calibrationThresholds: CalibrationThresholds = { negligible: 0.5, small: 2, material: 5, severe: 10 };
const fixtureMap = new Map(furyCalibrationFixtures.map((fixture) => [fixture.name, fixture]));
const candidateMap = new Map(eraFuryCandidates.map((candidate) => [candidate.itemId, candidate]));
const preferenceFrom = (scoreA: number, scoreB: number): "itemA" | "itemB" | "tie" => Math.abs(scoreA - scoreB) < 0.01 ? "tie" : scoreA > scoreB ? "itemA" : "itemB";
const severityFor = (difference: number): CalibrationSeverity => difference <= calibrationThresholds.negligible ? "Negligible" : difference <= calibrationThresholds.small ? "Small" : difference <= calibrationThresholds.severe ? "Material" : "Severe";
const compatible = (caseData: CalibrationCase, item: (typeof eraFuryCandidates)[number]) => item.slot === caseData.slot || Boolean(item.weapon && ["Main Hand", "Off Hand / Shield"].includes(caseData.slot));
const requiredReferenceFields = (reference: CalibrationReference) => reference.loadoutADps !== undefined && reference.loadoutBDps !== undefined && reference.iterations !== undefined && Boolean(reference.capturedAt || reference.enteredAt) && Boolean(reference.toolVersion) && Boolean(reference.preference);
const comparableScenario = (fixtureScenario: CalibrationReference["scenario"], referenceScenario: CalibrationReference["scenario"]) => {
  const fields: Array<keyof CalibrationReference["scenario"]> = ["level", "targetLevel", "race", "faction", "talents", "buffs", "debuffs", "consumables", "weaponImbues", "fightDuration", "worldBuffs", "weaponSkill", "mainHand", "offHand", "mainHandWeaponSkill", "offHandWeaponSkill", "hit", "crit", "attackPower", "strength", "agility", "activeSetBonuses"];
  const differences = fields.filter((field) => referenceScenario[field] !== undefined && fixtureScenario[field] !== referenceScenario[field]).map((field) => `${String(field)} differs (fixture: ${String(fixtureScenario[field])}; reference: ${String(referenceScenario[field])})`);
  return differences;
};

export function getCalibrationCases() { return furyCalibrationCases.map((caseData) => manualFuryReferences[caseData.id] ? { ...caseData, reference: manualFuryReferences[caseData.id] } : caseData); }

export function evaluateCalibrationCase(caseData: CalibrationCase): CalibrationComparison {
  const fixture = fixtureMap.get(caseData.characterFixture); const itemA = candidateMap.get(caseData.itemA); const itemB = candidateMap.get(caseData.itemB); const base = { caseId: caseData.id, characterFixture: caseData.characterFixture, slot: caseData.slot, itemA: caseData.itemA, itemB: caseData.itemB, category: caseData.tags };
  const readiness = validateCalibrationCase(caseData);
  if (!fixture || !itemA || !itemB || !compatible(caseData, itemA) || !compatible(caseData, itemB) || !readiness.ready) return { ...base, agreement: "invalid", readiness, notes: readiness.issues.map((issue) => issue.message).join(" ") || "Fixture or candidate item is missing or incompatible with the calibration slot." };
  const loadout = Object.fromEntries(fixture.character.equipment.map((item) => [item.slot, item]));
  const scoreItem = (item: (typeof eraFuryCandidates)[number]) => scoreLoadout({ ...loadout, [caseData.slot]: { ...item, slot: caseData.slot } }, eraFuryWarriorProfile).score;
  const scoreA = scoreItem(itemA); const scoreB = scoreItem(itemB); const prepullPreference = preferenceFrom(scoreA, scoreB); const reference = caseData.reference;
  if (!reference || reference.status === "pending" || !reference.preference) return { ...base, prepullPreference, prepullScoreDelta: scoreA - scoreB, agreement: "missing-reference", readiness, notes: reference?.notes ?? "Reference simulation data has not been entered." };
  if (!requiredReferenceFields(reference)) return { ...base, prepullPreference, prepullScoreDelta: scoreA - scoreB, agreement: "not-comparable", notes: "Reference is entered but missing required DPS, iteration, timestamp, tool-version, or preference fields.", comparableReason: "Incomplete reference record." };
  const scenarioDifferences = comparableScenario(fixture.scenario, reference.scenario);
  if (scenarioDifferences.length) return { ...base, prepullPreference, prepullScoreDelta: scoreA - scoreB, referencePreference: reference.preference, agreement: "not-comparable", difference: reference.difference, notes: reference.notes, comparableReason: scenarioDifferences.join("; ") };
  const agreement = prepullPreference === reference.preference ? "agreement" : "disagreement";
  return { ...base, prepullPreference, prepullScoreDelta: scoreA - scoreB, referencePreference: reference.preference, agreement, severity: agreement === "disagreement" ? severityFor(Math.abs(reference.difference ?? 0)) : undefined, difference: reference.difference, notes: reference.notes };
}

export function calibrateFury(cases = getCalibrationCases()): CalibrationReport {
  const comparisons = cases.map(evaluateCalibrationCase); const entered = comparisons.filter((comparison) => comparison.agreement === "agreement" || comparison.agreement === "disagreement"); const disagreements = entered.filter((comparison) => comparison.agreement === "disagreement"); const disagreementCategories = disagreements.reduce<Record<string, number>>((counts, comparison) => { for (const category of comparison.category ?? ["Uncategorized"]) counts[category] = (counts[category] ?? 0) + 1; return counts; }, {});
  return { profileVersion: eraFuryWarriorProfile.id, generatedAt: new Date().toISOString(), totalCases: cases.length, enteredComparisons: entered.length, pendingReferences: comparisons.filter((comparison) => comparison.agreement === "missing-reference").length, comparableCases: entered.length, notComparableCases: comparisons.filter((comparison) => comparison.agreement === "not-comparable").length, agreements: entered.filter((comparison) => comparison.agreement === "agreement").length, disagreements: disagreements.length, closeDisagreements: disagreements.filter((comparison) => comparison.severity === "Negligible" || comparison.severity === "Small").length, materialDisagreements: disagreements.filter((comparison) => comparison.severity === "Material").length, severeDisagreements: disagreements.filter((comparison) => comparison.severity === "Severe").length, invalidCases: comparisons.filter((comparison) => comparison.agreement === "invalid").length, disagreementCategories, comparisons };
}

export function calibrationReviewRows(report: CalibrationReport) { return report.comparisons.map((comparison) => ({ characterFixture: comparison.characterFixture, slot: comparison.slot, currentItem: comparison.itemA, candidateItem: comparison.itemB, prepullPreference: comparison.prepullPreference ?? "pending", reason: comparison.notes, profileScoreDelta: comparison.prepullScoreDelta ?? "pending", referenceResult: comparison.referencePreference ?? "pending", agreement: comparison.agreement, severity: comparison.severity ?? "pending", category: comparison.category?.join(",") ?? "Uncategorized", comparableReason: comparison.comparableReason ?? "" })); }

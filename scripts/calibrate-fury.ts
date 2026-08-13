import { calibrateFury, calibrationReviewRows, getCalibrationCases } from "../lib/gear-analysis/calibration/evaluator.ts";
import { formatPendingCase, pendingCases } from "../lib/gear-analysis/calibration/template.ts";
import { validateCalibrationCase } from "../lib/gear-analysis/calibration/validate.ts";
import { furyCalibrationFixtures } from "../lib/gear-analysis/calibration/fixtures.ts";
import { formatCalibrationDiagnostic } from "../lib/gear-analysis/calibration/diagnostic.ts";

const cases = getCalibrationCases();
const requestedCase = process.argv.find((argument) => argument.startsWith("--case="))?.slice("--case=".length);
if (process.argv.includes("--explain")) {
  const selected = requestedCase ? cases.find((caseData) => caseData.id === requestedCase) : undefined;
  if (!selected) { console.error("A valid --case=<id> is required with --explain."); process.exitCode = 1; } else console.log(formatCalibrationDiagnostic(selected));
  process.exit(0);
}
if (process.argv.includes("--pending") || requestedCase) {
  const selected = requestedCase ? cases.filter((caseData) => caseData.id === requestedCase) : pendingCases(cases);
  if (!selected.length) { console.error(requestedCase ? `No calibration case found for ${requestedCase}.` : "No pending calibration cases."); process.exitCode = 1; } else {
    for (const caseData of selected) console.log(`${formatPendingCase(caseData)}\n\n---\n`);
    console.log("CALIBRATION READINESS SUMMARY");
    console.log("Case ID | Mechanic | Candidate A | Candidate B | Race | MH/OH | Hit | Skill | Ready");
    for (const caseData of selected) { const scenario = furyCalibrationFixtures.find((entry) => entry.name === caseData.characterFixture)?.scenario; const readiness = validateCalibrationCase(caseData); console.log(`${caseData.id} | ${caseData.tags.join(",")} | #${caseData.itemA} | #${caseData.itemB} | ${scenario?.race ?? "?"} | ${scenario?.mainHand ?? "?"} / ${scenario?.offHand ?? "?"} | ${scenario?.hit ?? "?"} | ${scenario ? `MH ${scenario.mainHandWeaponSkill}/OH ${scenario.offHandWeaponSkill}` : "?"} | ${readiness.ready ? "YES" : "NO"}`); }
  }
  process.exit(0);
}
const report = calibrateFury(cases);
if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ report, review: calibrationReviewRows(report) }, null, 2));
} else {
  console.log("ERA FURY WARRIOR CALIBRATION");
  console.log(`Profile: ${report.profileVersion}`);
  console.log(`Cases: ${report.totalCases}`);
  console.log(`Entered comparisons: ${report.enteredComparisons}`);
  console.log(`Pending reference simulations: ${report.pendingReferences}`);
  console.log(`Comparable cases: ${report.comparableCases}`);
  console.log(`Not comparable: ${report.notComparableCases}`);
  console.log(`Agreement: ${report.agreements}`);
  console.log(`Disagreements: ${report.disagreements}`);
  console.log(`Close disagreements: ${report.closeDisagreements}`);
  console.log(`Material disagreements: ${report.materialDisagreements}`);
  console.log(`Severe disagreements: ${report.severeDisagreements}`);
  console.log(`Invalid cases: ${report.invalidCases}`);
  if (Object.keys(report.disagreementCategories).length) console.log(`Disagreement categories: ${JSON.stringify(report.disagreementCategories)}`);
  if (report.pendingReferences) console.log("Reference results are intentionally pending manual entry from a permitted simulator run; pending cases are not counted as agreement.");
  for (const comparison of report.comparisons.filter((item) => item.agreement === "disagreement" || item.agreement === "invalid")) console.log(`${comparison.slot} / ${comparison.caseId}: ${comparison.notes}`);
  const material = report.comparisons.filter((item) => item.severity === "Material" || item.severity === "Severe");
  if (material.length) {
    console.log("\nMATERIAL / SEVERE REVIEW");
    for (const comparison of material) {
      console.log(`Case: ${comparison.caseId}`);
      console.log(`Fixture: ${comparison.characterFixture}`);
      console.log(`Slot: ${comparison.slot}`);
      console.log(`Items: ${comparison.itemA} vs ${comparison.itemB}`);
      console.log(`PrePull: ${comparison.prepullPreference}`);
      console.log(`Reference: ${comparison.referencePreference}`);
      console.log(`Reference difference: ${comparison.difference ?? "missing"}`);
      console.log(`Likely cause: ${comparison.notes}`);
      console.log("Proposed action: review the mechanic/category before changing the profile.");
    }
  }
}

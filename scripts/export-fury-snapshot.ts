import { analyzeGear } from "../lib/gear-analysis/engine.ts";
import { eraFuryCandidates } from "../lib/gear-analysis/dataset.ts";
import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";
import { createAnalysisSnapshot } from "../lib/gear-analysis/calibration/snapshot.ts";
import { eraFuryWarriorProfile } from "../lib/gear-analysis/profiles.ts";

const analysis = analyzeGear({ character: eraFuryFixtures.bwlAq, profile: eraFuryWarriorProfile, candidates: eraFuryCandidates });
console.log(JSON.stringify(createAnalysisSnapshot(eraFuryFixtures.bwlAq, analysis), null, 2));

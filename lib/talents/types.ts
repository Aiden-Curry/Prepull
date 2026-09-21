export type ClassicTalent = {
  id: string;
  name: string;
  tree: string;
  row: number; // One-based Classic row; five points in earlier rows unlock each row.
  column: number; // One-based, four columns.
  maxRank: number;
  spellIds: readonly number[]; // Actual spell ID for each rank, in order.
  icon: string;
  prerequisite?: string; // Stable talent ID; requires all ranks.
};
export type ClassicTalentClass = {
  id: string;
  className: string;
  contentVersion: "era";
  trees: readonly { id: string; name: string }[];
  talents: readonly ClassicTalent[];
  source: string;
};
export type GuideTalentBuild = {
  id: string;
  classId: string;
  name: string;
  selectedRanks: Readonly<Record<string, number>>;
  expectedAllocation: readonly number[];
  source: string;
};

import { simulatePath, type PathResult } from "@/lib/engine";
import { buildPathInput, type PathSelection } from "@/services/catalog";

export interface DemoPath {
  key: string;
  label: string;
  short: string;
  selection: PathSelection;
}

export const HERO_PATHS: DemoPath[] = [
  { key: "ucla-econ", label: "Economics at UCLA", short: "UCLA", selection: { collegeId: "ucla", majorId: "economics" } },
  { key: "nyu-finance", label: "Finance at NYU", short: "NYU", selection: { collegeId: "nyu", majorId: "finance" } },
  {
    key: "gt-cs",
    label: "Computer Science at Georgia Tech",
    short: "Georgia Tech",
    selection: { collegeId: "georgia-tech", majorId: "computer-science" },
  },
];

export const BRANCH_PATHS: (DemoPath & { place: string })[] = [
  { key: "gt-cs", label: "Computer Science", short: "Georgia Tech", place: "Atlanta", selection: { collegeId: "georgia-tech", majorId: "computer-science" } },
  { key: "nyu-fin", label: "Finance", short: "NYU", place: "New York", selection: { collegeId: "nyu", majorId: "finance" } },
  { key: "ucf-nurse", label: "Nursing", short: "UCF", place: "Orlando", selection: { collegeId: "ucf", majorId: "nursing" } },
  { key: "ucla-econ", label: "Economics", short: "UCLA", place: "Los Angeles", selection: { collegeId: "ucla", majorId: "economics" } },
  { key: "unc-edu", label: "Secondary Education", short: "UNC", place: "Raleigh", selection: { collegeId: "unc", majorId: "secondary-education", cityId: "raleigh" } },
];

export function runDemo(p: DemoPath): PathResult {
  return simulatePath(buildPathInput(p.selection));
}

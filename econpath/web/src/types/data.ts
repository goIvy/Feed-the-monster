export type Region = "Northeast" | "Midwest" | "South" | "West";

export interface State {
  code: string;
  fips: string;
  name: string;
  region: Region;
  rpp: number;
  medianHouseholdIncome: number;
  medianRent: number;
  unemploymentRate: number;
  youthUnemploymentRate: number;
  jobGrowth5yr: number;
  wageIndex: number;
  wageGrowth: number;
  publicTuitionInState: number;
  stateIncomeTaxRate: number;
}

export interface City {
  id: string;
  name: string;
  state: string;
  region: Region;
  lat: number;
  lon: number;
  metroPopulationM: number;
  rpp: number;
  medianRent1br: number;
  medianHomePrice: number;
  medianHouseholdIncome: number;
  meanWage: number;
  unemploymentRate: number;
  youthUnemploymentRate: number;
  jobGrowth5yr: number;
  wageGrowth: number;
  localIncomeTaxRate: number;
  transportMonthly: number;
}

export type Control = "public" | "private";

export interface College {
  id: string;
  name: string;
  shortName: string;
  cityId: string;
  state: string;
  control: Control;
  undergradSize: number;
  acceptanceRate: number | null;
  tuitionInState: number;
  tuitionOutOfState: number;
  costOfAttendance: number;
  avgNetPrice: number;
  pctReceivingGrants: number;
  avgGrantAid: number;
  gradRate: number;
  retentionRate: number;
  medianEarnings10yr: number;
  medianDebt: number;
  lat: number;
  lon: number;
}

export interface Major {
  id: string;
  name: string;
  category: string;
  cipCode: string;
  startSalary: number;
  midCareerSalary: number;
  unemploymentRate: number;
  underemploymentRate: number;
  gradSchoolRate: number;
  jobGrowth: number;
  midCareerP25: number;
  midCareerP75: number;
  topOccupations: string[];
  industries: string[];
}

export interface Occupation {
  id: string;
  socCode: string;
  title: string;
  category: string;
  medianWage: number;
  p10Wage: number;
  p90Wage: number;
  employment: number;
  growthPct: number;
  annualOpenings: number;
  education: string;
  automationExposure: number;
  relatedMajors: string[];
}

export interface DataSource {
  id: string;
  name: string;
  publisher: string;
  url: string;
  dataset: string;
  vintage: string;
  updateFrequency: string;
  usedFor: string;
  methodology: string;
  lastUpdated: string;
}

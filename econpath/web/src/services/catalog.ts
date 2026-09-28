/**
 * Read-only access to reference data. Today this reads the validated seed
 * JSON bundled with the app; swapping in the FastAPI backend only requires
 * reimplementing these functions against `NEXT_PUBLIC_API_URL`.
 */
import citiesJson from "@/data/generated/cities.json";
import collegesJson from "@/data/generated/colleges.json";
import dataSourcesJson from "@/data/generated/dataSources.json";
import majorsJson from "@/data/generated/majors.json";
import occupationsJson from "@/data/generated/occupations.json";
import statesJson from "@/data/generated/states.json";
import type { PathInput, Residency } from "@/lib/engine";
import type { City, College, DataSource, Major, Occupation, State } from "@/types/data";

export const colleges = collegesJson as College[];
export const majors = majorsJson as Major[];
export const occupations = occupationsJson as Occupation[];
export const cities = citiesJson as City[];
export const states = statesJson as State[];
export const dataSources = dataSourcesJson as DataSource[];

const index = <T extends { id: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));
const collegeById = index(colleges);
const majorById = index(majors);
const occupationById = index(occupations);
const cityById = index(cities);
const stateByCode = new Map(states.map((s) => [s.code, s]));
const sourceById = index(dataSources);

export const getCollege = (id: string) => collegeById.get(id);
export const getMajor = (id: string) => majorById.get(id);
export const getOccupation = (id: string) => occupationById.get(id);
export const getCity = (id: string) => cityById.get(id);
export const getState = (code: string) => stateByCode.get(code);
export const getSource = (id: string) => sourceById.get(id);

export function cityForCollege(college: College): City {
  const city = cityById.get(college.cityId);
  if (!city) throw new Error(`Unknown city ${college.cityId} for ${college.id}`);
  return city;
}

export function stateTaxRate(stateCode: string): number {
  return stateByCode.get(stateCode)?.stateIncomeTaxRate ?? 0;
}

export interface PathSelection {
  collegeId: string;
  majorId?: string | null;
  occupationId?: string | null;
  cityId?: string | null;
  residency?: Residency;
}

/** Resolve ids to a PathInput. Unknown optional ids are dropped; an unknown college throws. */
export function buildPathInput(sel: PathSelection): PathInput {
  const college = collegeById.get(sel.collegeId);
  if (!college) throw new Error(`Unknown college ${sel.collegeId}`);
  const collegeCity = cityForCollege(college);
  const city = (sel.cityId && cityById.get(sel.cityId)) || collegeCity;
  return {
    college,
    collegeCity,
    city,
    major: sel.majorId ? (majorById.get(sel.majorId) ?? null) : null,
    occupation: sel.occupationId ? (occupationById.get(sel.occupationId) ?? null) : null,
    residency: sel.residency ?? "in-state",
    stateTaxRate: stateTaxRate(city.state),
  };
}

export function cityLabel(city: City) {
  return `${city.name}, ${city.state}`;
}

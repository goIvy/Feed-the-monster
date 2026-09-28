import "server-only";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import statesTopo from "us-atlas/states-albers-10m.json";

export interface StateShape {
  fips: string;
  name: string;
  d: string;
  centroid: [number, number];
}

export interface UsShapes {
  width: number;
  height: number;
  states: StateShape[];
  borders: string;
}

let cached: UsShapes | null = null;

/** Pre-projected (Albers USA, 975×610) state outlines, computed on the server so the topology never ships to the client. */
export function getUsShapes(): UsShapes {
  if (cached) return cached;
  const topo = statesTopo as unknown as Topology<{ states: GeometryCollection<{ name: string }> }>;
  const path = geoPath();
  const fc = feature(topo, topo.objects.states);
  const states = fc.features.map((f) => ({
    fips: String(f.id).padStart(2, "0"),
    name: f.properties?.name ?? "",
    d: path(f) ?? "",
    centroid: path.centroid(f) as [number, number],
  }));
  const borders = path(mesh(topo, topo.objects.states, (a, b) => a !== b)) ?? "";
  cached = { width: 975, height: 610, states, borders };
  return cached;
}

/** Projection matching the pre-projected us-atlas files, for placing city points. */
export function projectPoint(lon: number, lat: number): [number, number] | null {
  return geoAlbersUsa().scale(1300).translate([487.5, 305])([lon, lat]);
}

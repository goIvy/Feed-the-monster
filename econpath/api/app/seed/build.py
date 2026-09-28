"""Validate the seed CSVs and emit JSON consumed by the web app and the API.

    python -m app.seed.build            # validate + write JSON
    python -m app.seed.build --check    # validate only (CI)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import pandas as pd

from .schema import TABLES, Col

ROOT = Path(__file__).resolve().parents[3]
SEED_DIR = ROOT / "data" / "seed"
OUT_DIRS = [ROOT / "data" / "generated", ROOT / "web" / "src" / "data" / "generated"]


class SeedError(Exception):
    pass


def camel(name: str) -> str:
    head, *rest = name.split("_")
    return head + "".join(part.capitalize() for part in rest)


def load_table(name: str, cols: list[Col]) -> pd.DataFrame:
    df = pd.read_csv(SEED_DIR / f"{name}.csv", dtype=str, keep_default_na=False)
    expected = [c.name for c in cols]
    if list(df.columns) != expected:
        raise SeedError(f"{name}: columns {list(df.columns)} != contract {expected}")

    for col in cols:
        raw = df[col.name].str.strip()
        missing = raw == ""
        if missing.any() and not col.nullable:
            raise SeedError(f"{name}.{col.name}: {int(missing.sum())} missing values")
        if col.kind in ("int", "float"):
            values = pd.to_numeric(raw.where(~missing), errors="raise")
            if col.lo is not None and (values.dropna() < col.lo).any():
                raise SeedError(f"{name}.{col.name}: value below {col.lo}")
            if col.hi is not None and (values.dropna() > col.hi).any():
                raise SeedError(f"{name}.{col.name}: value above {col.hi}")
            df[col.name] = values.astype("Int64") if col.kind == "int" else values
        elif col.kind == "list":
            df[col.name] = raw.map(lambda s: [p for p in s.split("|") if p])
        else:
            df[col.name] = raw

    if "id" in df.columns:
        dupes = df["id"][df["id"].duplicated()]
        if len(dupes):
            raise SeedError(f"{name}: duplicate ids {list(dupes)}")
        bad = df["id"][~df["id"].str.fullmatch(r"[a-z0-9-]+")]
        if len(bad):
            raise SeedError(f"{name}: ids must be kebab-case: {list(bad)}")
    return df


def check_integrity(t: dict[str, pd.DataFrame]) -> None:
    states = set(t["states"]["code"])
    cities = set(t["cities"]["id"])
    majors = set(t["majors"]["id"])
    occs = set(t["occupations"]["id"])

    def need(refs, pool, label):
        missing = sorted(set(refs) - pool)
        if missing:
            raise SeedError(f"{label}: unknown references {missing}")

    need(t["cities"]["state"], states, "cities.state")
    need(t["colleges"]["state"], states, "colleges.state")
    need(t["colleges"]["city_id"], cities, "colleges.city_id")
    need([o for row in t["majors"]["top_occupations"] for o in row], occs, "majors.top_occupations")
    need([m for row in t["occupations"]["related_majors"] for m in row], majors, "occupations.related_majors")

    occ = t["occupations"]
    if ((occ["p10_wage"] > occ["median_wage"]) | (occ["median_wage"] > occ["p90_wage"])).any():
        raise SeedError("occupations: wage percentiles out of order")
    m = t["majors"]
    if ((m["mid_career_p25"] > m["mid_career_salary"]) | (m["mid_career_salary"] > m["mid_career_p75"])).any():
        raise SeedError("majors: mid-career percentiles out of order")
    if not set(t["colleges"]["control"]) <= {"public", "private"}:
        raise SeedError("colleges.control must be public|private")
    for url in t["data_sources"]["url"]:
        if not re.match(r"https://", url):
            raise SeedError(f"data_sources.url must be https: {url}")


def to_records(df: pd.DataFrame, camel_keys: bool = True) -> list[dict]:
    """Plain-Python records (no numpy/pandas scalars), optionally with camelCase keys."""
    records = []
    for row in df.to_dict(orient="records"):
        clean = {}
        for key, value in row.items():
            if value is pd.NA or (isinstance(value, float) and pd.isna(value)):
                value = None
            elif hasattr(value, "item"):
                value = value.item()
            clean[camel(key) if camel_keys else key] = value
        records.append(clean)
    return records


def build(check_only: bool = False) -> dict[str, pd.DataFrame]:
    tables = {name: load_table(name, cols) for name, cols in TABLES.items()}
    check_integrity(tables)
    if check_only:
        return tables
    for out in OUT_DIRS:
        out.mkdir(parents=True, exist_ok=True)
        for name, df in tables.items():
            path = out / f"{camel(name)}.json"
            path.write_text(json.dumps(to_records(df), indent=1, ensure_ascii=False) + "\n")
    return tables


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        tables = build(check_only=args.check)
    except SeedError as exc:
        print(f"seed validation failed: {exc}", file=sys.stderr)
        return 1
    summary = ", ".join(f"{len(df)} {name}" for name, df in tables.items())
    print(("validated " if args.check else "built ") + summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

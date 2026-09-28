"""Reference-data access. The API never reads CSVs directly: it reads either
the validated JSON build (default, zero setup) or the normalized Postgres
schema, and both produce the same domain objects."""

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from app.core.config import get_settings
from app.domain import City, College, DataSource, Major, Occupation, State
from app.engine.path import PathInput, Residency


@dataclass(frozen=True)
class Catalog:
    states: dict[str, State]
    cities: dict[str, City]
    colleges: dict[str, College]
    majors: dict[str, Major]
    occupations: dict[str, Occupation]
    sources: dict[str, DataSource]

    def state_tax_rate(self, code: str) -> float:
        s = self.states.get(code)
        return s.state_income_tax_rate if s else 0.0

    def path_input(
        self,
        college_id: str,
        major_id: str | None = None,
        occupation_id: str | None = None,
        city_id: str | None = None,
        residency: Residency = "in-state",
    ) -> PathInput:
        college = self.colleges.get(college_id)
        if college is None:
            raise KeyError(f"unknown college {college_id}")
        college_city = self.cities[college.city_id]
        city = self.cities.get(city_id or "", college_city)
        return PathInput(
            college=college,
            college_city=college_city,
            city=city,
            state_tax_rate=self.state_tax_rate(city.state),
            major=self.majors.get(major_id or ""),
            occupation=self.occupations.get(occupation_id or ""),
            residency=residency,
        )


def _load_json(path: Path, model):
    return {(row.get("id") or row["code"]): model.model_validate(row) for row in json.loads(path.read_text())}


def load_json_catalog(data_dir: Path) -> Catalog:
    return Catalog(
        states=_load_json(data_dir / "states.json", State),
        cities=_load_json(data_dir / "cities.json", City),
        colleges=_load_json(data_dir / "colleges.json", College),
        majors=_load_json(data_dir / "majors.json", Major),
        occupations=_load_json(data_dir / "occupations.json", Occupation),
        sources=_load_json(data_dir / "dataSources.json", DataSource),
    )


@lru_cache
def get_catalog() -> Catalog:
    settings = get_settings()
    if settings.data_backend == "postgres":
        from app.db.read import load_sql_catalog

        return load_sql_catalog()
    return load_json_catalog(settings.data_dir)

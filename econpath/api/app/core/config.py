from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ECONPATH_", env_file=".env", extra="ignore")

    #: "json" serves the validated seed files; "postgres" reads the normalized database.
    data_backend: str = "json"
    data_dir: Path = ROOT / "data" / "generated"
    seed_dir: Path = ROOT / "data" / "seed"
    database_url: str = "postgresql+psycopg://econpath:econpath@localhost:5432/econpath"
    cors_origins: list[str] = ["http://localhost:3000"]
    environment: str = "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()

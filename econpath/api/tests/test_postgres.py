"""Round-trip the seed through PostgreSQL. Runs only when ECONPATH_TEST_DATABASE_URL is set."""

import os

import pytest

URL = os.environ.get("ECONPATH_TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not URL, reason="set ECONPATH_TEST_DATABASE_URL to run")


def test_sql_catalog_matches_json(monkeypatch, catalog):
    monkeypatch.setenv("ECONPATH_DATABASE_URL", URL)
    from app.core.config import get_settings
    from app.db.session import get_engine

    get_settings.cache_clear()
    get_engine.cache_clear()
    from app.db.read import load_sql_catalog
    from app.seed.load import load

    load(reset=True)
    sql = load_sql_catalog()
    for name in ("states", "cities", "colleges", "majors", "occupations", "sources"):
        assert getattr(sql, name) == getattr(catalog, name), name

import pytest

from app.core.config import get_settings
from app.repository import Catalog, load_json_catalog


@pytest.fixture(scope="session")
def catalog() -> Catalog:
    return load_json_catalog(get_settings().data_dir)

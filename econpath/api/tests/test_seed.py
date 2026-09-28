import shutil

import pytest

from app.seed import build as seed_build


def test_seed_validates():
    tables = seed_build.build(check_only=True)
    assert len(tables["colleges"]) >= 50
    assert len(tables["majors"]) >= 50
    assert len(tables["occupations"]) >= 100
    assert len(tables["cities"]) >= 50


def _broken_copy(tmp_path, monkeypatch, file, old, new):
    seed = tmp_path / "seed"
    shutil.copytree(seed_build.SEED_DIR, seed)
    path = seed / file
    path.write_text(path.read_text().replace(old, new, 1))
    monkeypatch.setattr(seed_build, "SEED_DIR", seed)


def test_rejects_out_of_range_values(tmp_path, monkeypatch):
    _broken_copy(tmp_path, monkeypatch, "colleges.csv", ",0.92,0.97,82400", ",1.92,0.97,82400")
    with pytest.raises(seed_build.SeedError, match="grad_rate"):
        seed_build.build(check_only=True)


def test_rejects_dangling_references(tmp_path, monkeypatch):
    _broken_copy(tmp_path, monkeypatch, "colleges.csv", "ucla,\"University of California, Los Angeles\",UCLA,los-angeles", "ucla,\"University of California, Los Angeles\",UCLA,atlantis")
    with pytest.raises(seed_build.SeedError, match="city_id"):
        seed_build.build(check_only=True)

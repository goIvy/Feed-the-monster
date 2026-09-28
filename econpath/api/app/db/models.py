"""Normalized relational schema.

Entities (colleges, majors, careers, cities, states) hold stable attributes;
time-varying measurements live in fact tables keyed by entity, year and
source (college_costs, living_costs, salary_data, employment_data), so a new
data release appends rows instead of overwriting history.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


REGION = Enum("Northeast", "Midwest", "South", "West", name="region")
CONTROL = Enum("public", "private", name="college_control")
USER_ROLE = Enum("student", "parent", "counselor", "educator", "admin", name="user_role")
SUBJECT = Enum("career", "major", "college", name="salary_subject")
GEOGRAPHY = Enum("national", "state", "city", name="geography_level")
COMPARISON_KIND = Enum("college", "major", "career", "city", "scenario", name="comparison_kind")


class DataSource(Base):
    __tablename__ = "data_sources"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    publisher: Mapped[str] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(Text)
    dataset: Mapped[str] = mapped_column(Text)
    vintage: Mapped[str] = mapped_column(String(40))
    update_frequency: Mapped[str] = mapped_column(String(40))
    used_for: Mapped[str] = mapped_column(Text)
    methodology: Mapped[str] = mapped_column(Text)
    last_updated: Mapped[date] = mapped_column(Date)


class State(Base):
    __tablename__ = "states"
    code: Mapped[str] = mapped_column(String(2), primary_key=True)
    fips: Mapped[str] = mapped_column(String(2), unique=True)
    name: Mapped[str] = mapped_column(String(64))
    region: Mapped[str] = mapped_column(REGION)
    state_income_tax_rate: Mapped[float] = mapped_column(Float)
    public_tuition_in_state: Mapped[int] = mapped_column(Integer)
    rpp: Mapped[float] = mapped_column(Float)
    wage_index: Mapped[float] = mapped_column(Float)


class City(Base):
    __tablename__ = "cities"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    state_code: Mapped[str] = mapped_column(ForeignKey("states.code"), index=True)
    region: Mapped[str] = mapped_column(REGION)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    metro_population_m: Mapped[float] = mapped_column(Float)
    local_income_tax_rate: Mapped[float] = mapped_column(Float, default=0)

    living_costs: Mapped[list["LivingCost"]] = relationship(back_populates="city")


class LivingCost(Base):
    __tablename__ = "living_costs"
    __table_args__ = (UniqueConstraint("city_id", "year", "source_id"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"))
    source_id: Mapped[str] = mapped_column(ForeignKey("data_sources.id"))
    year: Mapped[int] = mapped_column(SmallInteger)
    rpp: Mapped[float] = mapped_column(Float)
    median_rent_1br: Mapped[int] = mapped_column(Integer)
    median_home_price: Mapped[int] = mapped_column(Integer)
    transport_monthly: Mapped[int] = mapped_column(Integer)

    city: Mapped[City] = relationship(back_populates="living_costs")


class College(Base):
    __tablename__ = "colleges"
    __table_args__ = (
        Index("ix_colleges_state_control", "state_code", "control"),
        CheckConstraint("grad_rate BETWEEN 0 AND 1", name="ck_colleges_grad_rate"),
    )
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    short_name: Mapped[str] = mapped_column(String(80))
    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id"), index=True)
    state_code: Mapped[str] = mapped_column(ForeignKey("states.code"))
    control: Mapped[str] = mapped_column(CONTROL)
    undergrad_size: Mapped[int] = mapped_column(Integer)
    acceptance_rate: Mapped[float | None] = mapped_column(Float)
    grad_rate: Mapped[float] = mapped_column(Float)
    retention_rate: Mapped[float] = mapped_column(Float)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)

    costs: Mapped[list["CollegeCost"]] = relationship(back_populates="college")


class CollegeCost(Base):
    __tablename__ = "college_costs"
    __table_args__ = (UniqueConstraint("college_id", "academic_year", "source_id"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    college_id: Mapped[str] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"))
    source_id: Mapped[str] = mapped_column(ForeignKey("data_sources.id"))
    academic_year: Mapped[str] = mapped_column(String(9))
    tuition_in_state: Mapped[int] = mapped_column(Integer)
    tuition_out_of_state: Mapped[int] = mapped_column(Integer)
    cost_of_attendance: Mapped[int] = mapped_column(Integer)
    avg_net_price: Mapped[int] = mapped_column(Integer)
    pct_receiving_grants: Mapped[float] = mapped_column(Float)
    avg_grant_aid: Mapped[int] = mapped_column(Integer)
    median_debt: Mapped[int] = mapped_column(Integer)

    college: Mapped[College] = relationship(back_populates="costs")


class Major(Base):
    __tablename__ = "majors"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(60), index=True)
    cip_code: Mapped[str] = mapped_column(String(10), index=True)
    industries: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    grad_school_rate: Mapped[float] = mapped_column(Float)


class Career(Base):
    __tablename__ = "careers"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    soc_code: Mapped[str] = mapped_column(String(10), unique=True)
    title: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(60), index=True)
    education: Mapped[str] = mapped_column(String(60))
    automation_exposure: Mapped[int] = mapped_column(SmallInteger)


class MajorCareer(Base):
    """Links majors and careers. `major_rank` orders a major's common careers; `career_rank` orders a career's related majors."""

    __tablename__ = "major_careers"
    major_id: Mapped[str] = mapped_column(ForeignKey("majors.id", ondelete="CASCADE"), primary_key=True)
    career_id: Mapped[str] = mapped_column(ForeignKey("careers.id", ondelete="CASCADE"), primary_key=True, index=True)
    major_rank: Mapped[int | None] = mapped_column(SmallInteger)
    career_rank: Mapped[int | None] = mapped_column(SmallInteger)


class SalaryData(Base):
    """Earnings for exactly one subject (career, major or college) at a geography and year."""

    __tablename__ = "salary_data"
    __table_args__ = (
        CheckConstraint(
            "(career_id IS NOT NULL)::int + (major_id IS NOT NULL)::int + (college_id IS NOT NULL)::int = 1",
            name="ck_salary_one_subject",
        ),
        Index("ix_salary_career", "career_id", "geography", "year"),
        Index("ix_salary_major", "major_id", "year"),
        Index("ix_salary_college", "college_id", "year"),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subject: Mapped[str] = mapped_column(SUBJECT)
    career_id: Mapped[str | None] = mapped_column(ForeignKey("careers.id", ondelete="CASCADE"))
    major_id: Mapped[str | None] = mapped_column(ForeignKey("majors.id", ondelete="CASCADE"))
    college_id: Mapped[str | None] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"))
    geography: Mapped[str] = mapped_column(GEOGRAPHY, default="national")
    geography_code: Mapped[str | None] = mapped_column(String(64))
    source_id: Mapped[str] = mapped_column(ForeignKey("data_sources.id"))
    year: Mapped[int] = mapped_column(SmallInteger)
    p10: Mapped[int | None] = mapped_column(Integer)
    p25: Mapped[int | None] = mapped_column(Integer)
    median: Mapped[int | None] = mapped_column(Integer)
    p75: Mapped[int | None] = mapped_column(Integer)
    p90: Mapped[int | None] = mapped_column(Integer)
    early_career_median: Mapped[int | None] = mapped_column(Integer)
    mid_career_median: Mapped[int | None] = mapped_column(Integer)


class EmploymentData(Base):
    """Labor-market measures for a career, major, city or state in a given year."""

    __tablename__ = "employment_data"
    __table_args__ = (
        Index("ix_employment_city", "city_id", "year"),
        Index("ix_employment_state", "state_code", "year"),
        Index("ix_employment_career", "career_id", "year"),
        Index("ix_employment_major", "major_id", "year"),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    city_id: Mapped[str | None] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"))
    state_code: Mapped[str | None] = mapped_column(ForeignKey("states.code", ondelete="CASCADE"))
    career_id: Mapped[str | None] = mapped_column(ForeignKey("careers.id", ondelete="CASCADE"))
    major_id: Mapped[str | None] = mapped_column(ForeignKey("majors.id", ondelete="CASCADE"))
    source_id: Mapped[str] = mapped_column(ForeignKey("data_sources.id"))
    year: Mapped[int] = mapped_column(SmallInteger)
    unemployment_rate: Mapped[float | None] = mapped_column(Float)
    underemployment_rate: Mapped[float | None] = mapped_column(Float)
    youth_unemployment_rate: Mapped[float | None] = mapped_column(Float)
    job_growth_pct: Mapped[float | None] = mapped_column(Float)
    employment: Mapped[int | None] = mapped_column(Integer)
    annual_openings: Mapped[int | None] = mapped_column(Integer)
    mean_wage: Mapped[int | None] = mapped_column(Integer)
    wage_growth: Mapped[float | None] = mapped_column(Float)
    median_household_income: Mapped[int | None] = mapped_column(Integer)
    median_rent: Mapped[int | None] = mapped_column(Integer)


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auth_subject: Mapped[str] = mapped_column(String(200), unique=True, comment="ID from the auth provider")
    email: Mapped[str] = mapped_column(String(320), unique=True)
    display_name: Mapped[str | None] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(USER_ROLE, default="student")
    profile: Mapped[dict] = mapped_column(JSONB, default=dict, comment="Onboarding answers")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Folder(Base):
    __tablename__ = "folders"
    __table_args__ = (UniqueConstraint("user_id", "name"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Favorite(Base):
    __tablename__ = "favorites"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    entity_type: Mapped[str] = mapped_column(COMPARISON_KIND, primary_key=True)
    entity_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    folder_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("folders.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Scenario(Base):
    __tablename__ = "scenarios"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    folder_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("folders.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(160))
    paths: Mapped[list] = mapped_column(JSONB)
    assumptions: Mapped[dict] = mapped_column(JSONB)
    share_slug: Mapped[str | None] = mapped_column(String(16), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SavedComparison(Base):
    __tablename__ = "saved_comparisons"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    folder_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("folders.id", ondelete="SET NULL"))
    kind: Mapped[str] = mapped_column(COMPARISON_KIND)
    item_ids: Mapped[list[str]] = mapped_column(ARRAY(String(64)))
    lens: Mapped[dict] = mapped_column(JSONB, default=dict, comment="Major, residency and other view settings")
    share_slug: Mapped[str | None] = mapped_column(String(16), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ResearchProject(Base):
    __tablename__ = "research_projects"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    question: Mapped[str] = mapped_column(Text)
    methodology: Mapped[str] = mapped_column(Text)
    dataset: Mapped[str] = mapped_column(Text)
    findings: Mapped[str | None] = mapped_column(Text)
    limitations: Mapped[str] = mapped_column(Text)
    source_ids: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

# EconPath

**Understand the economics behind your future.** EconPath turns public data on colleges, majors, careers and cities into interactive, transparent projections: what a path costs, what it pays, what a paycheck buys, and when an education pays for itself. It shows tradeoffs and assumptions; it never tells anyone what to choose.

```
econpath/
├── web/     Next.js 16 · React 19 · TypeScript · Tailwind 4 · shadcn-style UI · Recharts · D3
├── api/     FastAPI · SQLAlchemy 2 · PostgreSQL · pandas · statsmodels
├── data/
│   ├── seed/       Hand-curated CSVs (source of truth for this release)
│   ├── generated/  Validated JSON built from the CSVs (also copied into web/)
│   └── fixtures/   Cross-language engine parity cases and expected outputs
└── docker-compose.yml
```

## What's in this release

| Area | Status |
| --- | --- |
| Design system (tokens, light/dark, components, chart palette) | Live |
| Homepage: hero with live mini-demo, branching life-paths chart, questions, college preview, US opportunity map, career scatter, scenario simulator, stories, sources, CTA | Live |
| Navigation: mega menu, mobile menu, ⌘K command palette with natural-language commands, global search | Live |
| Personalized onboarding (8 skippable steps) → dashboard | Live |
| Dashboard: up to 3 paths, 8 KPIs, 13 live assumptions, earnings / breakeven / debt / net worth / budget charts, table views, share links, PDF export | Live |
| College ROI Explorer: search, 8 filters, sort, major lens, residency, price-vs-earnings scatter, compare tray | Live |
| College comparison report (up to 5): side-by-side cards, trajectories, percentile radar, net lifetime value, 22-row metrics table with per-row sources, share + print/PDF | Live |
| College detail pages (55, statically generated) | Live |
| Life Path Simulator (timeline 18–40, where-every-dollar-goes chart) | Preview |
| Majors, careers, cities: sortable data tables; Salary Translator; student loan calculator | Preview |
| Methodology, data sources, research roadmap | Live |
| Accounts, AI explainer, counselor mode, admin | Planned (see `/methodology#roadmap`) |

## Run it

**Web** (runs entirely on bundled seed data; no backend needed):

```bash
cd web
npm install
npm run dev          # http://localhost:3000
npm test             # engine unit tests + parity fixture
npm run lint && npm run typecheck && npm run build
```

**API** (optional):

```bash
cd api
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload      # http://localhost:8000/docs
python -m pytest -q
```

**With PostgreSQL:**

```bash
docker compose up -d db
cd api
ECONPATH_DATABASE_URL=postgresql+psycopg://econpath:econpath@localhost:5432/econpath python -m app.seed.load --reset
ECONPATH_DATA_BACKEND=postgres uvicorn app.main:app
```

## Architecture

**One calculation engine, two languages.** `web/src/lib/engine` (TypeScript) powers every number in the UI, instantly and offline. `api/app/engine` is a line-for-line Python port for server use, research and batch jobs. `data/fixtures/engine-parity.*` pins both to identical outputs (to 1e-9) across nine scenarios; CI fails if they drift. After an intentional model change, run `npm run test:update-fixtures` and commit the new expected file.

**Data pipeline.** `data/seed/*.csv` → `python -m app.seed.build` validates every column against a contract (`api/app/seed/schema.py`: types, ranges, kebab-case ids, referential integrity, percentile ordering) and writes camelCase JSON to `data/generated/` and `web/src/data/generated/`. `python -m app.seed.load` loads the same validated rows into the normalized schema. Replacing seed data with live ingestion means producing files that satisfy the same contracts.

**Database.** `api/app/db/models.py` defines the normalized schema; `api/db/schema.sql` is generated from it (`python -m app.db.dump_schema`). Entities (`colleges`, `majors`, `careers`, `cities`, `states`) hold stable attributes; time-varying measures live in fact tables keyed by entity, year and source (`college_costs`, `living_costs`, `salary_data`, `employment_data`), so a new release appends history instead of overwriting it. User-facing tables (`users`, `folders`, `favorites`, `scenarios`, `saved_comparisons`) and `research_projects`, `data_sources` complete the model. A test round-trips the seed through Postgres and asserts the rebuilt catalog equals the JSON one.

**Web app layout.**

```
web/src/
├── app/            Routes (server components by default)
├── components/     ui/ (primitives) · charts/ · layout/ · data/ · brand/
├── features/       home · dashboard · onboarding · colleges · majors · careers · cities · simulator · tools
├── lib/            engine/ (calculations) · format · chart · search · geo (server-only) · nav
├── services/       catalog (data access) · options
├── hooks/          animated numbers, persisted state, element size
├── types/          domain types
└── data/generated  validated JSON (build output — do not edit)
```

`services/catalog.ts` is the only module that touches data files; pointing it at `NEXT_PUBLIC_API_URL` is the path to live data.

**API endpoints.** `GET /health`, `GET /v1/colleges` (filters, sort, major lens, residency), `/v1/colleges/compare`, `/v1/colleges/{id}`, `/v1/majors`, `/v1/careers`, `/v1/cities`, `/v1/states`, `/v1/sources`, `POST /v1/simulate`, `GET /v1/translate`, `GET /v1/research/roi-model` (OLS with HC1 robust errors; toggle covariates). Interactive docs at `/docs`.

## Methodology in brief

Salary profiles come from a chosen career (BLS wage distribution), else a chosen major (New York Fed early/mid-career medians), else the college's own Scorecard earnings, scaled by attenuated college and city factors. Costs use average net price, a typical borrowing share implied by median debt, in-school interest and a ten-year plan. Taxes use 2025 federal brackets, FICA, simplified state rates and local taxes. Purchasing power divides take-home pay by BEA regional price parities. Breakeven, NPV and ROI compare each path with starting work at 18. Full formulas, defaults and limitations: `/methodology`.

**About the data:** this release ships a calibrated seed dataset compiled from published ranges of the listed public sources and rounded. It is realistic, not a live feed; some fields (for example automation exposure) are EconPath estimates. The UI says so wherever it matters.

## Design system

See [`docs/design-system.md`](docs/design-system.md): color tokens, typography, spacing, motion, and the validated chart palette.

## Deploy

- **Web → Vercel:** set the project root to `econpath/web`. Env: `NEXT_PUBLIC_SITE_URL`.
- **API → Render / Railway / Fly.io:** build with `api/Dockerfile` from the `econpath/` context. Env: `ECONPATH_DATA_BACKEND`, `ECONPATH_DATABASE_URL`, `ECONPATH_CORS_ORIGINS`.
- No secrets are committed; see `web/.env.example` and `api/.env.example`.

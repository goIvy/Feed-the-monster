from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.routes import models, reference
from app.core.config import get_settings
from app.repository import get_catalog

settings = get_settings()

app = FastAPI(
    title="EconPath API",
    version="0.1.0",
    description="Reference data and the EconPath calculation engine: college ROI, earnings paths, purchasing power and research models.",
)
app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET", "POST"], allow_headers=["*"])
app.include_router(reference.router)
app.include_router(models.router)


@app.get("/health", tags=["ops"])
def health():
    cat = get_catalog()
    return {
        "status": "ok",
        "backend": settings.data_backend,
        "counts": {
            "colleges": len(cat.colleges),
            "majors": len(cat.majors),
            "careers": len(cat.occupations),
            "cities": len(cat.cities),
            "states": len(cat.states),
            "sources": len(cat.sources),
        },
    }

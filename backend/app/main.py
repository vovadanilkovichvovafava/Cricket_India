from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.router import api_router
from app.api.admin_auth import router as admin_auth_router
from app.api.admin_stats import router as admin_stats_router
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables."""
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered cricket betting analysis for IPL 2026",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware — allow all saturn.ac subdomains + configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.saturn\.ac",
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Admin panel routes (separate auth)
app.include_router(admin_auth_router, prefix=settings.API_V1_PREFIX + "/admin/auth", tags=["admin"])
app.include_router(admin_stats_router, prefix=settings.API_V1_PREFIX + "/admin/stats", tags=["admin-stats"])


@app.get("/", tags=["root"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.api.router import api_router
from app.api.admin_auth import router as admin_auth_router
from app.api.admin_stats import router as admin_stats_router
from app.core.database import init_db
from app.core.rate_limiter import limiter
from app.core.middleware import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables."""
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered cricket betting analysis for IPL 2026",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware — strict whitelist (saturn.ac subdomains + configured origins)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://cricket-india-[a-z0-9]+\.saturn\.ac",
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
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
    }


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}

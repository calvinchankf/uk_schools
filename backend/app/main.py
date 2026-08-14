"""
FastAPI backend for UK Schools Search application.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import requests

from . import queries
from .db import pool
from .models import SchoolSearchResponse, School, StatsResponse

PHASE_PATTERN = "^(primary|secondary)$"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await pool.open()
    yield
    await pool.close()


app = FastAPI(
    title="UK Schools Search API",
    description="Search for UK primary and secondary schools by location with performance rankings",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS: local dev servers + production (custom domain, HTTPS not yet enforced
# there -- see `gh api repos/calvinchankf/uk_schools/pages`) + the GitHub
# Pages fallback origin in case it's still reachable alongside the custom domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://calvinchankf.com",
        "https://calvinchankf.com",
        "https://calvinchankf.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "UK Schools Search API",
        "version": "2.0.0",
        "endpoints": {
            "nearby_search": "/api/schools/nearby",
            "postcode_search": "/api/schools/search",
            "school_details": "/api/schools/{urn}",
            "statistics": "/api/stats",
        },
    }


@app.get("/api/schools/nearby", response_model=SchoolSearchResponse)
async def search_nearby_schools(
    latitude: float = Query(..., ge=49, le=61, description="Search center latitude"),
    longitude: float = Query(..., ge=-8, le=2, description="Search center longitude"),
    radius_km: float = Query(5.0, ge=0.5, le=20, description="Search radius in kilometers"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    phase: str = Query("primary", pattern=PHASE_PATTERN, description="School phase"),
):
    """
    Search for schools near a geographic location.

    Returns schools sorted by performance score, then distance.
    """
    schools = await queries.search_nearby(pool, latitude, longitude, radius_km, limit, phase)

    return {
        "schools": schools,
        "count": len(schools),
        "search_location": {
            "latitude": latitude,
            "longitude": longitude,
            "radius_km": radius_km,
        },
    }


@app.get("/api/schools/search", response_model=SchoolSearchResponse)
async def search_by_postcode(
    postcode: str = Query(..., description="UK postcode"),
    radius_km: float = Query(5.0, ge=0.5, le=20, description="Search radius in kilometers"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    phase: str = Query("primary", pattern=PHASE_PATTERN, description="School phase"),
):
    """
    Search for schools near a UK postcode.

    Returns schools sorted by performance score, then distance.
    """
    try:
        response = requests.get(
            f"https://api.postcodes.io/postcodes/{postcode}",
            timeout=5,
        )

        if response.status_code == 200:
            data = response.json()
            if data.get("result"):
                latitude = data["result"]["latitude"]
                longitude = data["result"]["longitude"]
            else:
                raise HTTPException(status_code=404, detail="Postcode not found")
        else:
            raise HTTPException(status_code=404, detail="Postcode not found")

    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Geocoding service unavailable: {str(e)}")

    schools = await queries.search_nearby(pool, latitude, longitude, radius_km, limit, phase)

    return {
        "schools": schools,
        "count": len(schools),
        "search_location": {
            "postcode": postcode,
            "latitude": latitude,
            "longitude": longitude,
            "radius_km": radius_km,
        },
    }


@app.get("/api/schools/{urn}", response_model=School)
async def get_school_details(
    urn: int,
    phase: str = Query("primary", pattern=PHASE_PATTERN, description="School phase"),
):
    """Get detailed information for a specific school."""
    school = await queries.get_by_urn(pool, urn, phase)

    if school is None:
        raise HTTPException(status_code=404, detail=f"School with URN {urn} not found")

    return school


@app.get("/api/stats", response_model=StatsResponse)
async def get_statistics(
    phase: str = Query("primary", pattern=PHASE_PATTERN, description="School phase"),
):
    """Get dataset statistics."""
    return await queries.get_stats(pool, phase)


@app.get("/health")
async def health_check():
    """Health check endpoint -- a dead DB shows as unhealthy, not just an empty count."""
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("select 1")
                await cur.fetchone()
        return {"status": "healthy"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {str(e)}")

"""
FastAPI backend for UK Schools Search application.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import requests

from .data_loader import school_data_loader
from .spatial import filter_schools_by_distance, sort_schools_by_performance_and_distance
from .models import SchoolSearchResponse, School, StatsResponse

app = FastAPI(
    title="UK Schools Search API",
    description="Search for UK primary schools by location with KS2 performance rankings",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Load schools data on startup."""
    school_data_loader.load_schools()

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "UK Schools Search API",
        "version": "1.0.0",
        "endpoints": {
            "nearby_search": "/api/schools/nearby",
            "postcode_search": "/api/schools/search",
            "school_details": "/api/schools/{urn}",
            "statistics": "/api/stats"
        }
    }

@app.get("/api/schools/nearby", response_model=SchoolSearchResponse)
async def search_nearby_schools(
    latitude: float = Query(..., ge=49, le=61, description="Search center latitude"),
    longitude: float = Query(..., ge=-8, le=2, description="Search center longitude"),
    radius_km: float = Query(5.0, ge=0.5, le=20, description="Search radius in kilometers"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results")
):
    """
    Search for schools near a geographic location.

    Args:
        latitude: Center latitude (UK bounds: 49-61)
        longitude: Center longitude (UK bounds: -8 to 2)
        radius_km: Search radius in kilometers (0.5-20)
        limit: Maximum results to return (1-100)

    Returns:
        List of schools sorted by performance score, then distance
    """
    schools = school_data_loader.get_schools()

    # Filter by distance
    nearby_schools = filter_schools_by_distance(schools, latitude, longitude, radius_km)

    # Sort by performance and distance
    sorted_schools = sort_schools_by_performance_and_distance(nearby_schools)

    # Limit results
    limited_schools = sorted_schools[:limit]

    return {
        "schools": limited_schools,
        "count": len(limited_schools),
        "search_location": {
            "latitude": latitude,
            "longitude": longitude,
            "radius_km": radius_km
        }
    }

@app.get("/api/schools/search", response_model=SchoolSearchResponse)
async def search_by_postcode(
    postcode: str = Query(..., description="UK postcode"),
    radius_km: float = Query(5.0, ge=0.5, le=20, description="Search radius in kilometers"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results")
):
    """
    Search for schools near a UK postcode.

    Args:
        postcode: UK postcode (e.g., "EC1N 2NX")
        radius_km: Search radius in kilometers (0.5-20)
        limit: Maximum results to return (1-100)

    Returns:
        List of schools sorted by performance score, then distance
    """
    # Geocode postcode using postcodes.io
    try:
        response = requests.get(
            f'https://api.postcodes.io/postcodes/{postcode}',
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('result'):
                latitude = data['result']['latitude']
                longitude = data['result']['longitude']
            else:
                raise HTTPException(status_code=404, detail="Postcode not found")
        else:
            raise HTTPException(status_code=404, detail="Postcode not found")

    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Geocoding service unavailable: {str(e)}")

    # Use the nearby search with geocoded coordinates
    schools = school_data_loader.get_schools()
    nearby_schools = filter_schools_by_distance(schools, latitude, longitude, radius_km)
    sorted_schools = sort_schools_by_performance_and_distance(nearby_schools)
    limited_schools = sorted_schools[:limit]

    return {
        "schools": limited_schools,
        "count": len(limited_schools),
        "search_location": {
            "postcode": postcode,
            "latitude": latitude,
            "longitude": longitude,
            "radius_km": radius_km
        }
    }

@app.get("/api/schools/{urn}", response_model=School)
async def get_school_details(urn: int):
    """
    Get detailed information for a specific school.

    Args:
        urn: Unique Reference Number

    Returns:
        School details
    """
    school = school_data_loader.get_school_by_urn(urn)

    if school is None:
        raise HTTPException(status_code=404, detail=f"School with URN {urn} not found")

    return school

@app.get("/api/stats", response_model=StatsResponse)
async def get_statistics():
    """
    Get dataset statistics.

    Returns:
        Statistics about the school dataset
    """
    return school_data_loader.get_stats()

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    schools_count = len(school_data_loader.get_schools())
    return {
        "status": "healthy",
        "schools_loaded": schools_count
    }

"""
Spatial distance calculations using Haversine formula.
"""

import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees).

    Args:
        lat1: Latitude of point 1
        lon1: Longitude of point 1
        lat2: Latitude of point 2
        lon2: Longitude of point 2

    Returns:
        Distance in kilometers
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    # Radius of earth in kilometers
    r = 6371

    return c * r

def filter_schools_by_distance(schools: list, lat: float, lon: float, radius_km: float) -> list:
    """
    Filter schools within a given radius and add distance field.

    Args:
        schools: List of school dictionaries
        lat: Center latitude
        lon: Center longitude
        radius_km: Search radius in kilometers

    Returns:
        List of schools within radius, with distance_km field added
    """
    nearby_schools = []

    for school in schools:
        distance = haversine_distance(
            lat, lon,
            school['latitude'], school['longitude']
        )

        if distance <= radius_km:
            school_copy = school.copy()
            school_copy['distance_km'] = round(distance, 2)
            nearby_schools.append(school_copy)

    return nearby_schools

def sort_schools_by_performance_and_distance(schools: list) -> list:
    """
    Sort schools by performance score (descending), then distance (ascending).

    Args:
        schools: List of school dictionaries with distance_km field

    Returns:
        Sorted list of schools
    """
    return sorted(
        schools,
        key=lambda s: (-s['performance_score'], s.get('distance_km', float('inf')))
    )

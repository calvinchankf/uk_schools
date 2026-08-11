"""
All SQL for the schools API lives here, not in main.py.

Distance calculations force spherical mode (use_spheroid=false) to match the
Haversine-on-a-sphere math used elsewhere in this codebase (the old
spatial.py, the static frontend, regen_feeder.py) -- see
backend/db/migrations/0001_init.sql for why.
"""

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

_COLUMNS = """
    urn, name, postcode, latitude, longitude, school_type, age_low, age_high,
    performance_score, phase, fsm_pct,
    ptrwm_exp, ptrwm_high, read_average, mat_average, gps_average,
    att8_score, l2basics_94, ebacc_94, ebacc_entry,
    street, town, locality, ethnicity, feeder_secondary
"""

NEARBY_SQL = f"""
    select {_COLUMNS},
           ST_Distance(
               location,
               ST_SetSRID(ST_MakePoint(%(lon)s, %(lat)s), 4326)::geography,
               false
           ) / 1000.0 as distance_km
    from schools
    where phase = %(phase)s
      and ST_DWithin(
              location,
              ST_SetSRID(ST_MakePoint(%(lon)s, %(lat)s), 4326)::geography,
              %(radius_m)s,
              false
          )
    order by performance_score desc, distance_km asc
    limit %(limit)s;
"""

BY_URN_SQL = f"""
    select {_COLUMNS}, null::double precision as distance_km
    from schools
    where urn = %(urn)s and phase = %(phase)s;
"""

STATS_SQL = """
    select
        count(*) as total_schools,
        round(min(performance_score), 1) as score_min,
        round(max(performance_score), 1) as score_max,
        round(avg(performance_score), 1) as score_mean,
        count(*) filter (where performance_score >= 75) as excellent_75_plus,
        count(*) filter (where performance_score >= 60 and performance_score < 75) as good_60_74,
        count(*) filter (where performance_score >= 45 and performance_score < 60) as average_45_59,
        count(*) filter (where performance_score < 45) as below_average_under_45
    from schools
    where phase = %(phase)s;
"""


def _row_to_school(row: dict) -> dict:
    """Reshape a flat SQL row into the nested School response shape."""
    return {
        "urn": row["urn"],
        "name": row["name"],
        "postcode": row["postcode"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "school_type": row["school_type"],
        "age_low": row["age_low"],
        "age_high": row["age_high"],
        "performance_score": float(row["performance_score"]),
        "phase": row["phase"],
        "fsm_pct": float(row["fsm_pct"]) if row["fsm_pct"] is not None else None,
        "metrics": {
            "ptrwm_exp": row["ptrwm_exp"],
            "ptrwm_high": row["ptrwm_high"],
            "read_average": row["read_average"],
            "mat_average": row["mat_average"],
            "gps_average": row["gps_average"],
            "att8_score": row["att8_score"],
            "l2basics_94": row["l2basics_94"],
            "ebacc_94": row["ebacc_94"],
            "ebacc_entry": row["ebacc_entry"],
        },
        "address": {
            "street": row["street"],
            "town": row["town"],
            "locality": row["locality"],
        },
        "distance_km": round(row["distance_km"], 2) if row["distance_km"] is not None else None,
        "ethnicity": row["ethnicity"] or [],
        "feeder_secondary": row["feeder_secondary"],
    }


async def search_nearby(pool: AsyncConnectionPool, lat: float, lon: float, radius_km: float, limit: int, phase: str) -> list[dict]:
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                NEARBY_SQL,
                {"lat": lat, "lon": lon, "radius_m": radius_km * 1000, "limit": limit, "phase": phase},
            )
            rows = await cur.fetchall()
    return [_row_to_school(r) for r in rows]


async def get_by_urn(pool: AsyncConnectionPool, urn: int, phase: str) -> dict | None:
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(BY_URN_SQL, {"urn": urn, "phase": phase})
            row = await cur.fetchone()
    return _row_to_school(row) if row else None


async def get_stats(pool: AsyncConnectionPool, phase: str) -> dict:
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(STATS_SQL, {"phase": phase})
            row = await cur.fetchone()
    return {
        "total_schools": row["total_schools"],
        "score_range": {
            "min": float(row["score_min"]) if row["score_min"] is not None else None,
            "max": float(row["score_max"]) if row["score_max"] is not None else None,
            "mean": float(row["score_mean"]) if row["score_mean"] is not None else None,
        },
        "score_distribution": {
            "excellent_75_plus": row["excellent_75_plus"],
            "good_60_74": row["good_60_74"],
            "average_45_59": row["average_45_59"],
            "below_average_under_45": row["below_average_under_45"],
        },
    }

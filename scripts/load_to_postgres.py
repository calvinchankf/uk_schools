"""
Load the pipeline's data_processed/*.json outputs into Supabase Postgres.

Per phase, inside a single transaction: DELETE all existing rows for that
phase, then bulk-insert the freshly generated records. DfE performance data
is republished wholesale each year (not incrementally), so a full replace is
simpler than an upsert and correctly drops schools that closed/merged.
Wrapping each phase in one transaction means readers never see a
half-updated table (Postgres MVCC keeps old rows visible until commit).

Usage:
    DATABASE_URL=postgresql://... python3 scripts/load_to_postgres.py
"""

import json
import os
import sys
from pathlib import Path

import psycopg
from psycopg.types.json import Json

ROOT = Path(__file__).parent.parent
PROCESSED = ROOT / "data_processed"

SOURCES = {
    "primary": PROCESSED / "schools_with_performance.json",
    "secondary": PROCESSED / "secondary_schools.json",
}

COLUMNS = [
    "urn", "name", "postcode", "latitude", "longitude", "school_type",
    "age_low", "age_high", "phase", "performance_score", "fsm_pct",
    "ptrwm_exp", "ptrwm_high", "read_average", "mat_average", "gps_average",
    "att8_score", "l2basics_94", "ebacc_94", "ebacc_entry",
    "street", "town", "locality", "ethnicity", "feeder_secondary",
]

INSERT_SQL = f"""
    insert into schools ({', '.join(COLUMNS)})
    values ({', '.join('%s' for _ in COLUMNS)})
"""


def normalize(school: dict, phase: str) -> tuple:
    """Flatten one school record (either phase's shape) into a COLUMNS-ordered tuple."""
    metrics = school.get("metrics", {})
    address = school.get("address", {})
    return (
        school["urn"],
        school["name"],
        school["postcode"],
        school["latitude"],
        school["longitude"],
        school.get("school_type"),
        school.get("age_low"),
        school.get("age_high"),
        phase,
        school["performance_score"],
        school.get("fsm_pct"),
        metrics.get("ptrwm_exp"),
        metrics.get("ptrwm_high"),
        metrics.get("read_average"),
        metrics.get("mat_average"),
        metrics.get("gps_average"),
        metrics.get("att8_score"),
        metrics.get("l2basics_94"),
        metrics.get("ebacc_94"),
        metrics.get("ebacc_entry"),
        address.get("street"),
        address.get("town"),
        address.get("locality"),
        Json(school.get("ethnicity", [])),
        Json(school["feeder_secondary"]) if school.get("feeder_secondary") else None,
    )


def main():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is not set", file=sys.stderr)
        sys.exit(1)

    with psycopg.connect(database_url, autocommit=False) as conn:
        for phase, path in SOURCES.items():
            with open(path) as f:
                schools = json.load(f)
            rows = [normalize(s, phase) for s in schools]

            with conn.cursor() as cur:
                cur.execute("delete from schools where phase = %s", (phase,))
                cur.executemany(INSERT_SQL, rows)
            conn.commit()
            print(f"{phase}: loaded {len(rows)} schools from {path.name}")

    print("Done.")


if __name__ == "__main__":
    main()

"""
Copy the pipeline's data_processed/ outputs into frontend/public/data/,
replacing the manual `cp` step documented in DEVELOPMENT.md so it's callable
identically from local dev and CI.

Must run after prepare_school_data.py + enrich_schools.py + prepare_secondary_data.py,
and before gen_places.py (which reads the copies this script produces).
"""

import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
PROCESSED = ROOT / "data_processed"
FRONTEND_DATA = ROOT / "frontend" / "public" / "data"

COPIES = {
    "schools_with_performance.json": "schools.json",
    "secondary_schools.json": "secondary.json",
}


def main():
    FRONTEND_DATA.mkdir(parents=True, exist_ok=True)
    for src_name, dest_name in COPIES.items():
        src = PROCESSED / src_name
        dest = FRONTEND_DATA / dest_name
        shutil.copyfile(src, dest)
        print(f"Copied {src.relative_to(ROOT)} -> {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

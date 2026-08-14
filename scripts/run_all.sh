#!/bin/bash
set -euo pipefail

# UK Schools Data Processing Pipeline
#
# Runs the full corrected pipeline in dependency order and ends by
# regenerating docs/ (the built GitHub Pages output), so the static
# VITE_DATA_MODE=static rollback path never goes stale even after this
# script "succeeds". If DATABASE_URL is set, also loads the result into
# Postgres (Supabase) -- otherwise that step is skipped, so local runs
# without DB access still refresh the static data.
#
# Invocable from anywhere -- always operates relative to the repo root.

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

echo "=========================================="
echo "UK Schools Data Processing Pipeline"
echo "=========================================="

if [ ! -d "scripts/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv scripts/venv
fi

echo "Activating virtual environment..."
source scripts/venv/bin/activate

echo "Installing dependencies..."
pip install -q -r scripts/requirements.txt

run_step () {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    shift
    python3 "$@"
}

run_step "Step 1: Geocoding primary school postcodes"    scripts/geocode_schools.py
run_step "Step 2: Geocoding secondary school postcodes"  scripts/geocode_secondary.py
run_step "Step 3: Regenerating feeder-school distances"  scripts/regen_feeder.py
run_step "Step 4: Preparing primary school data"         scripts/prepare_school_data.py
run_step "Step 5: Preparing secondary school data"       scripts/prepare_secondary_data.py
run_step "Step 6: Enriching primary schools (FSM/ethnicity/feeder)" scripts/enrich_schools.py
run_step "Step 7: Validating data"                       scripts/validate_data.py
run_step "Step 8: Syncing data into frontend/public/data" scripts/sync_frontend_data.py
run_step "Step 9: Generating place-name autocomplete"    scripts/gen_places.py

if [ -n "${DATABASE_URL:-}" ]; then
    run_step "Step 10: Loading data into Postgres" scripts/load_to_postgres.py
else
    echo ""
    echo "=========================================="
    echo "Step 10: Loading data into Postgres -- SKIPPED (DATABASE_URL not set)"
    echo "=========================================="
fi

echo ""
echo "=========================================="
echo "Step 11: Rebuilding docs/ (GitHub Pages output)"
echo "=========================================="
npm --prefix "$REPO_ROOT/frontend" run build

echo ""
echo "=========================================="
echo "Data Processing Complete!"
echo "=========================================="
echo ""
echo "Output files:"
echo "  - data_processed/postcode_coordinates.json"
echo "  - data_processed/schools_with_performance.json"
echo "  - data_processed/secondary_schools.json"
echo "  - data_processed/validation_report.txt"
echo "  - frontend/public/data/{schools,secondary,places}.json (synced)"
echo "  - docs/ (rebuilt)"
echo ""

#!/bin/bash

# UK Schools Data Processing Pipeline
# This script runs all data processing steps in sequence

echo "=========================================="
echo "UK Schools Data Processing Pipeline"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "=========================================="
echo "Step 1: Geocoding Postcodes"
echo "=========================================="
echo "This will take approximately 4 minutes..."
echo ""
python3 geocode_schools.py

if [ $? -ne 0 ]; then
    echo "Error: Geocoding failed!"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 2: Preparing School Data"
echo "=========================================="
echo ""
python3 prepare_school_data.py

if [ $? -ne 0 ]; then
    echo "Error: Data preparation failed!"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 3: Validating Data"
echo "=========================================="
echo ""
python3 validate_data.py

if [ $? -ne 0 ]; then
    echo "Error: Data validation failed!"
    exit 1
fi

echo ""
echo "=========================================="
echo "Data Processing Complete!"
echo "=========================================="
echo ""
echo "Output files:"
echo "  - ../data_processed/postcode_coordinates.json"
echo "  - ../data_processed/schools_with_performance.json"
echo "  - ../data_processed/validation_report.txt"
echo ""
echo "Next steps:"
echo "  1. Start the backend: cd ../backend && uvicorn app.main:app --reload"
echo "  2. Start the frontend: cd ../frontend && npm install && npm run dev"
echo ""

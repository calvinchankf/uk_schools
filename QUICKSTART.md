# Quick Start Guide

Get the UK Schools Search app running in 3 steps. The app covers both primary schools (KS2) and secondary schools (KS4).

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ installed
- Internet connection (for geocoding API)

## Step 1: Process the Data (~5 minutes)

```bash
cd scripts
pip install -r requirements.txt

# Primary schools (KS2)
python3 geocode_schools.py          # ~4 min
python3 prepare_school_data.py

# Secondary schools (KS4)
python3 geocode_secondary.py        # ~30 sec
python3 prepare_secondary_data.py

# Copy into frontend
cp ../data_processed/schools_with_performance.json ../frontend/public/data/schools.json
cp ../data_processed/secondary_schools.json ../frontend/public/data/secondary.json
```

This will:
- Geocode all school postcodes (primary + secondary)
- Merge school info with KS2 / KS4 performance data
- Calculate composite scores for each phase
- Copy the processed data where the frontend can serve it

**Output**:
- `data_processed/schools_with_performance.json` (16,403 primary schools)
- `data_processed/secondary_schools.json` (4,055 secondary schools)

## Step 2: Start the Backend

Open a new terminal:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Backend running at**: http://localhost:8000

**API docs**: http://localhost:8000/docs

## Step 3: Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

**App running at**: http://localhost:3000

## Try It Out

1. **Switch Phase**: Use the "Primary (KS2)" / "Secondary (KS4)" toggle in the header
2. **Map Click**: Click anywhere on the map to search nearby schools
3. **Postcode Search**: Enter "EC1N 2NX" and click Search
4. **Adjust Radius**: Use the radius dropdown
5. **View Details**: Click school markers or list items

## Expected Results

- Search returns top 20 schools within radius
- Schools ranked by performance score
- Color-coded markers (green = excellent, red = below average)
- Distance shown for each school
- Detailed metrics visible

## Troubleshooting

**"Module not found" error**
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

**"Port already in use"**
```bash
# Check what's using the port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Kill the process or use different port
```

**"Schools data not found"**
```bash
# Re-run data processing for the relevant phase
cd scripts
python3 prepare_school_data.py      # primary
python3 prepare_secondary_data.py   # secondary
```

**"No schools appearing"**
- Check browser console for errors
- For primary: verify `frontend/public/data/schools.json` exists
- For secondary: verify `frontend/public/data/secondary.json` exists

## Next Steps

- Read `README.md` for detailed documentation
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- View API docs at http://localhost:8000/docs
- Explore the code in `backend/app/` and `frontend/src/`

## Sample Postcodes to Try

- **London**: EC1N 2NX, SW1A 1AA, E1 6AN
- **Manchester**: M1 1AE, M60 1NW
- **Birmingham**: B1 1BB, B4 7ET
- **Leeds**: LS1 1UR, LS2 7DJ
- **Edinburgh**: EH1 1YZ, EH8 8AQ

Enjoy exploring UK schools data!

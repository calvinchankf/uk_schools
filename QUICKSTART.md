# Quick Start Guide

Get the UK Schools Search app running in 3 steps.

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ installed
- Internet connection (for geocoding API)

## Step 1: Process the Data (~4 minutes)

```bash
cd scripts
chmod +x run_all.sh
./run_all.sh
```

This will:
- Geocode all school postcodes
- Merge school info with performance data
- Calculate composite scores
- Validate data quality

**Output**: `data_processed/schools_with_performance.json` (16,403 schools)

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

1. **Map Click**: Click anywhere on the map to search nearby schools
2. **Postcode Search**: Enter "EC1N 2NX" and click Search
3. **Adjust Radius**: Move the radius slider (1-20 km)
4. **View Details**: Click school markers or list items

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
# Re-run data processing
cd scripts && ./run_all.sh
```

**"No schools appearing"**
- Ensure backend is running (check http://localhost:8000/health)
- Check browser console for errors
- Verify CORS is enabled in backend

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

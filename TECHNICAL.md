# Technical Reference

## Project Structure

```
uk_schools/
├── data_2024-2025/          # Original government data
├── metadata_2024-2025/      # Data field definitions
├── data_processed/          # Processed data with geocoding
├── scripts/                 # Data processing scripts
├── backend/                 # FastAPI backend (local dev only)
└── frontend/                # React frontend
```

## Setup Instructions

### 1. Data Processing

First, process the raw school data and geocode postcodes:

```bash
# Install Python dependencies
cd scripts
pip install -r requirements.txt

# Step 1: Geocode primary school postcodes (~4 minutes)
python3 geocode_schools.py

# Step 2: Geocode secondary school postcodes (~30 seconds)
python3 geocode_secondary.py

# Step 3: Merge primary data and calculate KS2 performance scores
python3 prepare_school_data.py

# Step 4: Merge secondary data and calculate KS4 performance scores
python3 prepare_secondary_data.py

# Step 5: Validate data quality
python3 validate_data.py
```

**Expected output:**
- `data_processed/postcode_coordinates.json` - Geocoded postcode coordinates (primary + secondary)
- `data_processed/schools_with_performance.json` - Primary school dataset (16,403 schools)
- `data_processed/secondary_schools.json` - Secondary school dataset (4,055 schools)
- `data_processed/validation_report.txt` - Data quality report

After processing, copy the generated JSON files into the frontend:

```bash
cp data_processed/schools_with_performance.json frontend/public/data/schools.json
cp data_processed/secondary_schools.json frontend/public/data/secondary.json
```

### 2. Backend Setup (local dev only)

The production site is fully static — no backend is needed. For local development with the FastAPI backend:

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```

The API will be available at: `http://localhost:8000`

**API Documentation**: Visit `http://localhost:8000/docs` for interactive API documentation

### 3. Frontend Setup

```bash
# Install Node dependencies
cd frontend
npm install

# Start the development server
npm run dev
```

The application will be available at: `http://localhost:3000`

## Usage

### Search by Map Click

1. Click anywhere on the map
2. Schools within the radius will appear as colored markers
3. Schools are ranked by performance in the sidebar

### Search by Postcode

1. Enter a UK postcode in the search bar (e.g., "EC1N 2NX")
2. Click "Search"
3. The map will center on the postcode location
4. Nearby schools will be displayed

### Adjust Search Radius

- Use the slider in the sidebar to adjust the search radius (1-20 km)
- The search will automatically update if a location is selected

### View School Details

- Click a marker on the map to see a popup with quick info
- Click a school in the sidebar to highlight it on the map
- View detailed metrics including:
  - Performance score
  - Distance from search point
  - % at expected standard (Reading/Writing/Maths)
  - % at high standard
  - Average reading and maths scores

## API Endpoints

### GET `/api/schools/nearby`
Search for schools near a geographic location

**Parameters:**
- `latitude` (required): Center latitude
- `longitude` (required): Center longitude
- `radius_km` (default: 5): Search radius in kilometers
- `limit` (default: 20): Maximum results

### GET `/api/schools/search`
Search for schools near a UK postcode

**Parameters:**
- `postcode` (required): UK postcode
- `radius_km` (default: 5): Search radius in kilometers
- `limit` (default: 20): Maximum results

### GET `/api/schools/{urn}`
Get detailed information for a specific school

### GET `/api/stats`
Get dataset statistics

## Performance Score Calculation

All schools are ranked on a composite 0–100 score. The metrics and weights differ by phase.

### Primary schools (KS2)

- **PTRWM_EXP** (40%): % of pupils at expected standard in reading/writing/maths
- **PTRWM_HIGH** (20%): % of pupils at high standard
- **READ_AVERAGE** (15%): Average reading scaled score (normalized from 80–120)
- **MAT_AVERAGE** (15%): Average maths scaled score (normalized from 80–120)
- **GPS_AVERAGE** (10%): Average GPS scaled score (normalized from 80–120)

At least 3 valid metrics required.

### Secondary schools (KS4)

- **PTL2BASICS_94** (50%): % of pupils achieving grade 5+ in English and Maths GCSEs (the DfE "strong pass" headline measure)
- **ATT8SCR** (35%): Attainment 8 score, normalized from the observed range of 0–87.2
- **PTEBACC_94** (15%): % of pupils achieving grade 4+ across all EBacc subject areas

At least 2 valid metrics required.

## Technology Stack

### Frontend (production)
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Leaflet / React-Leaflet**: Interactive maps
- **OpenStreetMap**: Free map tiles
- **postcodes.io**: Free UK postcode geocoding API (called directly from browser)

### Backend (local dev only)
- **FastAPI**: Modern Python web framework
- **Pydantic**: Data validation

### Data Processing
- **Pandas**: Data manipulation
- **Requests**: HTTP library for API calls

## Data Sources

- UK Government Department for Education
- School information and performance data: 2024-2025 academic year
- Postcode geocoding: postcodes.io (UK government postcode database)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### Frontend won't start
- Ensure Node.js 18+ is installed
- Check that port 3000 is available
- Run `npm install` to install dependencies

### No schools appearing
- Check browser console for errors
- Verify `frontend/public/data/schools.json` exists (run primary data processing first)
- For secondary schools, verify `frontend/public/data/secondary.json` exists (run `prepare_secondary_data.py`)

### Geocoding fails
- Check internet connection
- postcodes.io may have rate limits — wait a few minutes
- Some postcodes may not be found (expected ~1% failure rate)

## Deployment

The site is deployed as a fully static app on GitHub Pages. To redeploy after frontend changes:

```bash
cd frontend
npm run build   # outputs to ../docs/
git add ../docs
git commit -m "rebuild"
git push
```

GitHub Pages serves from the `docs/` folder on the `main` branch.

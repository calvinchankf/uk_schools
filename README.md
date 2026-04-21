# UK Primary Schools Search

A web application to search for nearby UK primary schools ranked by Key Stage 2 performance. Features an interactive map interface with OpenStreetMap and performance-based school rankings.

## Features

- **Interactive Map**: Click anywhere on the map to search for nearby schools
- **Postcode Search**: Enter a UK postcode to find schools in that area
- **Performance Rankings**: Schools ranked by composite KS2 performance scores
- **Adjustable Radius**: Search radius from 1-20 km
- **Color-Coded Markers**: Visual performance indicators on the map
  - Green (75+): Excellent
  - Light Green (60-74): Good
  - Yellow (45-59): Average
  - Red (<45): Below average
- **Detailed Information**: View school metrics, addresses, and distances

## Dataset

- **16,403 UK primary schools** with complete location and performance data
- **Data source**: UK government education statistics 2024-2025
- **Performance metrics**: KS2 reading, writing, maths scores and attainment levels

## Project Structure

```
uk_schools/
├── data_2024-2025/          # Original government data
├── metadata_2024-2025/      # Data field definitions
├── data_processed/          # Processed data with geocoding
├── scripts/                 # Data processing scripts
├── backend/                 # FastAPI backend
└── frontend/                # React frontend
```

## Setup Instructions

### 1. Data Processing

First, process the raw school data and geocode postcodes:

```bash
# Install Python dependencies
cd scripts
pip install -r requirements.txt

# Step 1: Geocode postcodes (~4 minutes)
python3 geocode_schools.py

# Step 2: Merge data and calculate performance scores
python3 prepare_school_data.py

# Step 3: Validate data quality
python3 validate_data.py
```

**Expected output:**
- `data_processed/postcode_coordinates.json` - Geocoded postcode coordinates
- `data_processed/schools_with_performance.json` - Final school dataset
- `data_processed/validation_report.txt` - Data quality report

### 2. Backend Setup

Start the FastAPI backend server:

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

Start the React development server:

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

Schools are ranked using a composite performance score (0-100) weighted as follows:

- **PTRWM_EXP** (40%): % of pupils at expected standard in reading/writing/maths
- **PTRWM_HIGH** (20%): % of pupils at high standard
- **READ_AVERAGE** (15%): Average reading scaled score (normalized)
- **MAT_AVERAGE** (15%): Average maths scaled score (normalized)
- **GPS_AVERAGE** (10%): Average GPS scaled score (normalized)

Schools need at least 3 valid metrics to receive a performance score.

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Pydantic**: Data validation
- **postcodes.io**: Free UK postcode geocoding API

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Leaflet**: Interactive maps
- **React-Leaflet**: React wrapper for Leaflet
- **OpenStreetMap**: Free map tiles
- **Axios**: HTTP client

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

## License

This project uses open government data under the Open Government Licence.

## Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed
- Check that port 8000 is available
- Verify `data_processed/schools_with_performance.json` exists

### Frontend won't start
- Ensure Node.js 18+ is installed
- Check that port 3000 is available
- Run `npm install` to install dependencies

### No schools appearing
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify data processing completed successfully

### Geocoding fails
- Check internet connection
- postcodes.io may have rate limits - wait a few minutes
- Some postcodes may not be found (expected ~1% failure rate)

## Performance

- **Search latency**: <100ms for coordinate-based searches
- **Dataset size**: ~16MB loaded into memory
- **Concurrent users**: Handles 100+ simultaneous searches
- **Geocoding**: One-time setup, ~4 minutes for all postcodes

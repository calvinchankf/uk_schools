# Development Guide

## Project Overview

Full-stack web application for searching UK primary schools by location with KS2 performance rankings.

## Development Environment Setup

### Python (Backend + Scripts)

```bash
# Create virtual environment
python3 -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r scripts/requirements.txt
pip install -r backend/requirements.txt
```

### Node.js (Frontend)

```bash
cd frontend
npm install
```

## Running in Development Mode

### Backend (FastAPI)

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Options:
- `--reload`: Auto-reload on code changes
- `--host 0.0.0.0`: Allow external connections
- `--port 8000`: Set port (default 8000)

**Hot reload**: Any changes to Python files in `backend/app/` will trigger automatic reload.

### Frontend (React + Vite)

```bash
cd frontend
npm run dev
```

Options in `package.json`:
- `npm run dev`: Development server with HMR
- `npm run build`: Production build
- `npm run preview`: Preview production build

**Hot Module Replacement (HMR)**: Changes to `.jsx`, `.css` files will update instantly without page reload.

## Project Structure

```
uk_schools/
├── scripts/              # Data processing (run once)
│   ├── geocode_schools.py
│   ├── prepare_school_data.py
│   └── validate_data.py
│
├── backend/              # FastAPI backend
│   └── app/
│       ├── main.py       # API endpoints
│       ├── models.py     # Pydantic schemas
│       ├── data_loader.py # Data management
│       └── spatial.py    # Geographic calculations
│
└── frontend/             # React frontend
    └── src/
        ├── App.jsx       # Main component
        ├── components/   # UI components
        └── services/     # API client
```

## Code Conventions

### Python (Backend)

**Style**: Follow PEP 8
- 4 spaces indentation
- Max line length: 100 characters
- Use type hints where helpful

**Docstrings**: Google style
```python
def function_name(param1: str, param2: int) -> bool:
    """
    Brief description.

    Args:
        param1: Description
        param2: Description

    Returns:
        Description
    """
    pass
```

### JavaScript/React (Frontend)

**Style**:
- 2 spaces indentation
- Single quotes for strings (except JSX)
- Semicolons required

**Components**: Functional components with hooks
```jsx
const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initial);

  return (
    <div>Content</div>
  );
};

export default ComponentName;
```

**Naming**:
- Components: PascalCase (`Map.jsx`, `SchoolList.jsx`)
- Functions: camelCase (`handleClick`, `searchSchools`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

## API Development

### Adding New Endpoints

1. Define Pydantic models in `backend/app/models.py`:
```python
class NewRequest(BaseModel):
    field1: str
    field2: int

class NewResponse(BaseModel):
    result: str
```

2. Add endpoint in `backend/app/main.py`:
```python
@app.get("/api/new-endpoint", response_model=NewResponse)
async def new_endpoint(request: NewRequest):
    # Implementation
    return {"result": "data"}
```

3. Add client function in `frontend/src/services/api.js`:
```javascript
export const callNewEndpoint = async (field1, field2) => {
  const response = await apiClient.get('/api/new-endpoint', {
    params: { field1, field2 }
  });
  return response.data;
};
```

### Testing API Endpoints

**Interactive Docs**: http://localhost:8000/docs
- Try endpoints directly in browser
- See request/response schemas
- Generate curl commands

**curl Examples**:
```bash
# Search nearby schools
curl "http://localhost:8000/api/schools/nearby?latitude=51.5074&longitude=-0.1278&radius_km=5"

# Search by postcode
curl "http://localhost:8000/api/schools/search?postcode=EC1N%202NX&radius_km=5"

# Get school details
curl "http://localhost:8000/api/schools/100000"

# Get statistics
curl "http://localhost:8000/api/stats"
```

## Frontend Development

### Adding New Components

1. Create component file: `frontend/src/components/NewComponent.jsx`
2. Create styles: `frontend/src/components/NewComponent.css`
3. Import in parent component:
```jsx
import NewComponent from './components/NewComponent';
```

### State Management

Current approach: React `useState` in `App.jsx`

For complex state, consider:
- Context API for global state
- React Query for server state
- Zustand/Redux for complex client state

### Styling

**Approach**: Component-scoped CSS files
- Each component has its own `.css` file
- Use BEM-like naming for clarity
- Avoid global styles except in `index.css`

**Color Palette**:
- Primary: `#3b82f6` (blue)
- Success: `#22c55e` (green)
- Warning: `#eab308` (yellow)
- Error: `#ef4444` (red)
- Gray scale: `#111827`, `#374151`, `#6b7280`, `#e5e7eb`, `#f9fafb`

## Data Processing

### Modifying Score Calculation

Edit `scripts/prepare_school_data.py`:

```python
def calculate_composite_score(row):
    # Adjust weights here
    weights = {
        'PTRWM_EXP': 0.40,    # Change these
        'PTRWM_HIGH': 0.20,
        'READ_AVERAGE': 0.15,
        'MAT_AVERAGE': 0.15,
        'GPS_AVERAGE': 0.10,
    }
    # Implementation...
```

Then re-run:
```bash
cd scripts
python3 prepare_school_data.py
```

### Adding New Data Fields

1. Modify `prepare_school_data.py` to include new fields:
```python
school = {
    'urn': int(row['URN']),
    'name': row['SCHNAME'],
    'new_field': row['NEW_FIELD'],  # Add here
    # ...
}
```

2. Update Pydantic model in `backend/app/models.py`:
```python
class School(BaseModel):
    urn: int
    name: str
    new_field: Optional[str]  # Add here
    # ...
```

3. Update frontend components to display new field

## Debugging

### Backend Debugging

**Print debugging**:
```python
print(f"Debug: {variable}")  # Shows in terminal
```

**Logging**:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug("Debug message")
```

**FastAPI automatic validation errors**:
- Check terminal output
- Visit `/docs` for schema validation

### Frontend Debugging

**Browser Console**:
```javascript
console.log('Debug:', variable);
console.error('Error:', error);
console.table(arrayData);  // Nice table view
```

**React DevTools**:
- Install browser extension
- Inspect component state and props
- Track re-renders

**Network Tab**:
- View API requests/responses
- Check status codes
- Inspect headers

## Common Tasks

### Update Data

```bash
cd scripts
python3 geocode_schools.py
python3 prepare_school_data.py
python3 validate_data.py
```

### Add Search Filter

1. Update API endpoint to accept new parameter
2. Modify `filter_schools_by_distance()` in `spatial.py`
3. Add UI control in `FilterPanel.jsx`
4. Update `App.jsx` to pass parameter

### Change Map Styling

Edit `frontend/src/components/Map.jsx`:
- Marker colors: `createMarkerIcon()` function
- Map tiles: Change `TileLayer` URL
- Popup content: Modify `<Popup>` JSX

### Optimize Performance

**Backend**:
- Add caching with `functools.lru_cache`
- Profile with `cProfile`
- Use async operations where appropriate

**Frontend**:
- Memoize expensive calculations with `useMemo`
- Prevent re-renders with `React.memo` and `useCallback`
- Lazy load components with `React.lazy`
- Optimize images and assets

## Testing

### Manual Testing Checklist

**Backend**:
- [ ] All endpoints return 200 for valid requests
- [ ] Invalid parameters return 422 with error details
- [ ] Response matches Pydantic schema
- [ ] CORS headers present
- [ ] Performance <100ms for searches

**Frontend**:
- [ ] Map loads and displays tiles
- [ ] Click map triggers search
- [ ] Postcode search works for valid postcodes
- [ ] Invalid postcodes show error message
- [ ] Schools display as colored markers
- [ ] Click marker shows popup
- [ ] Click school in list highlights on map
- [ ] Radius slider updates results
- [ ] Responsive on mobile (< 768px)

### Automated Testing (Future)

**Backend** (pytest):
```bash
pip install pytest pytest-asyncio
pytest backend/tests/
```

**Frontend** (Jest + React Testing Library):
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm test
```

## Deployment (Future Considerations)

### Backend

**Options**:
- Heroku (easy, free tier)
- AWS Lambda + API Gateway (serverless)
- Google Cloud Run (containerized)
- DigitalOcean App Platform (simple)

**Requirements**:
- Add `Procfile` for Heroku
- Use environment variables for config
- Add health check endpoint (already exists)
- Configure CORS for production domain

### Frontend

**Options**:
- Vercel (recommended, automatic from GitHub)
- Netlify (great for static sites)
- AWS S3 + CloudFront
- GitHub Pages

**Build**:
```bash
npm run build
# Output in dist/ directory
```

### Database (If Needed)

Current: In-memory (simple, fast)
Future: PostgreSQL + PostGIS (scalable, persistent)

## Resources

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [Leaflet Docs](https://leafletjs.com/)
- [React-Leaflet Docs](https://react-leaflet.js.org/)

### APIs Used
- [postcodes.io](https://postcodes.io/) - UK postcode geocoding
- [OpenStreetMap](https://www.openstreetmap.org/) - Free map tiles

### Tools
- [FastAPI Interactive Docs](http://localhost:8000/docs)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

## Getting Help

1. Check documentation files:
   - `README.md` - Setup and features
   - `QUICKSTART.md` - Fast getting started
   - `IMPLEMENTATION_SUMMARY.md` - Technical details
   - `DEVELOPMENT.md` - This file

2. Check error messages:
   - Backend: Terminal running uvicorn
   - Frontend: Browser console (F12)
   - API: http://localhost:8000/docs

3. Common issues:
   - Port conflicts: Change port in config
   - CORS errors: Check backend CORS settings
   - Module not found: Re-install dependencies
   - Data not found: Re-run data processing

Happy coding!

/**
 * Client-side data service for UK Schools — no backend required.
 * Loads schools_with_performance.json once, caches it, and does all
 * spatial filtering in the browser.
 */

// ── Data cache ────────────────────────────────────────────────────────────────
let schoolsCache = null;

async function loadSchools() {
  if (schoolsCache) return schoolsCache;
  const response = await fetch(`${import.meta.env.BASE_URL}data/schools.json`);
  if (!response.ok) throw new Error('Failed to load schools data');
  schoolsCache = await response.json();
  return schoolsCache;
}

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

// ── Core search logic ─────────────────────────────────────────────────────────
function findNearby(schools, lat, lon, radiusKm, limit) {
  const nearby = schools
    .map((s) => {
      const dist = haversineDistance(lat, lon, s.latitude, s.longitude);
      return dist <= radiusKm ? { ...s, distance_km: Math.round(dist * 100) / 100 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.performance_score - a.performance_score || a.distance_km - b.distance_km)
    .slice(0, limit);

  return {
    schools: nearby,
    count: nearby.length,
  };
}

// ── Public API (same interface as before) ─────────────────────────────────────

/**
 * Search for schools near a geographic location
 */
export const searchNearbySchools = async (latitude, longitude, radiusKm = 5, limit = 20) => {
  const schools = await loadSchools();
  return {
    ...findNearby(schools, latitude, longitude, radiusKm, limit),
    search_location: { latitude, longitude, radius_km: radiusKm },
  };
};

/**
 * Search for schools near a UK postcode.
 * Geocodes via the free postcodes.io API, then filters locally.
 */
export const searchByPostcode = async (postcode, radiusKm = 5, limit = 20) => {
  // Geocode postcode using the free postcodes.io API
  const geoRes = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`
  );
  if (!geoRes.ok) throw new Error('Postcode not found');
  const geoData = await geoRes.json();
  if (!geoData.result) throw new Error('Postcode not found');

  const { latitude, longitude } = geoData.result;
  const schools = await loadSchools();

  return {
    ...findNearby(schools, latitude, longitude, radiusKm, limit),
    search_location: { postcode, latitude, longitude, radius_km: radiusKm },
  };
};

/**
 * Get details for a specific school by URN
 */
export const getSchoolDetails = async (urn) => {
  const schools = await loadSchools();
  const school = schools.find((s) => s.urn === urn);
  if (!school) throw new Error(`School with URN ${urn} not found`);
  return school;
};

/**
 * Get dataset statistics
 */
export const getStatistics = async () => {
  const schools = await loadSchools();
  const scores = schools.map((s) => s.performance_score);
  const sum = scores.reduce((a, b) => a + b, 0);
  return {
    total_schools: schools.length,
    score_range: {
      min: Math.round(Math.min(...scores) * 10) / 10,
      max: Math.round(Math.max(...scores) * 10) / 10,
      mean: Math.round((sum / scores.length) * 10) / 10,
    },
    score_distribution: {
      excellent_75_plus: scores.filter((s) => s >= 75).length,
      good_60_74: scores.filter((s) => s >= 60 && s < 75).length,
      average_45_59: scores.filter((s) => s >= 45 && s < 60).length,
      below_average_under_45: scores.filter((s) => s < 45).length,
    },
  };
};

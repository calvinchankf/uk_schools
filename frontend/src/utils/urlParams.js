/**
 * URL query-param encode/decode for search state and school deep-links.
 * No React here -- pure functions, easy to reason about independently of
 * when/why App.jsx decides to read or write the URL.
 *
 * Query params on the existing single route (no path segments, no router)
 * -- GitHub Pages can't rewrite arbitrary paths to index.html without the
 * classic 404.html trick, and query strings don't need that at all.
 */

const RADIUS_MIN = 1;
const RADIUS_MAX = 10;
const RADIUS_DEFAULT = 2;
const PHASE_DEFAULT = 'primary';

// Same UK bounding box the backend validates against (backend/app/main.py).
const UK_LAT_MIN = 49;
const UK_LAT_MAX = 61;
const UK_LNG_MIN = -8;
const UK_LNG_MAX = 2;

function clampRadius(raw) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return RADIUS_DEFAULT;
  return Math.min(Math.max(n, RADIUS_MIN), RADIUS_MAX);
}

function normalizePhase(raw) {
  return raw === 'secondary' ? 'secondary' : PHASE_DEFAULT;
}

function parseLatLng(latRaw, lngRaw) {
  if (latRaw == null || lngRaw == null) return { lat: null, lng: null };
  const lat = parseFloat(latRaw);
  const lng = parseFloat(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { lat: null, lng: null };
  if (lat < UK_LAT_MIN || lat > UK_LAT_MAX || lng < UK_LNG_MIN || lng > UK_LNG_MAX) {
    return { lat: null, lng: null };
  }
  return { lat, lng };
}

function parseSchoolUrn(raw) {
  if (raw == null) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Parse `window.location.search` (or any query string) into validated,
 * clamped state. Garbage input is dropped/defaulted here so nothing
 * downstream ever has to guard against malformed URLs.
 */
export function parseSearchParams(search) {
  const params = new URLSearchParams(search);

  const qRaw = params.get('q');
  const q = qRaw && qRaw.trim() ? qRaw.trim() : null;

  const { lat, lng } = parseLatLng(params.get('lat'), params.get('lng'));

  return {
    q,
    lat,
    lng,
    radius: clampRadius(params.get('radius')),
    phase: normalizePhase(params.get('phase')),
    school: parseSchoolUrn(params.get('school')),
  };
}

/**
 * Canonical string identifying "where" a search is -- used to tell a new
 * search destination apart from a minor tweak (radius/phase/selection) to
 * the same one, for push-vs-replace decisions.
 */
export function searchSignature(searchLocation) {
  if (!searchLocation) return null;
  if (searchLocation.postcode) return `postcode:${searchLocation.postcode}`;
  if (searchLocation.place_name) return `place:${searchLocation.place_name}`;
  if (searchLocation.latitude != null && searchLocation.longitude != null) {
    return `latlng:${searchLocation.latitude.toFixed(4)},${searchLocation.longitude.toFixed(4)}`;
  }
  return null;
}

/**
 * Deterministic serialization -- same state always produces the same
 * string, in the same param order. This determinism is load-bearing: it's
 * what lets a popstate-triggered restore recognize "this is the URL the
 * app itself already wrote" and skip writing history again.
 */
export function buildSearchString({ searchLocation, radiusKm, phase, selectedSchool }) {
  const params = new URLSearchParams();
  const hasContext = Boolean(searchLocation) || selectedSchool?.urn != null;

  // Nothing to represent yet (true default state) -- keep the URL bare
  // rather than writing radius=2&phase=primary noise on every cold load.
  if (!hasContext) return '';

  if (searchLocation?.postcode) {
    params.set('q', searchLocation.postcode);
  } else if (searchLocation?.place_name) {
    params.set('q', searchLocation.place_name);
  } else if (searchLocation?.latitude != null && searchLocation?.longitude != null) {
    params.set('lat', searchLocation.latitude.toFixed(4));
    params.set('lng', searchLocation.longitude.toFixed(4));
  }

  if (radiusKm != null) params.set('radius', String(radiusKm));
  if (phase) params.set('phase', phase);
  if (selectedSchool?.urn != null) params.set('school', String(selectedSchool.urn));

  const str = params.toString();
  return str ? `?${str}` : '';
}

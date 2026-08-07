/**
 * Remote-mode data service for UK Schools — calls the FastAPI backend
 * instead of loading static JSON. Same public function signatures as
 * api.static.js so the two are interchangeable — see api.js for the switch.
 *
 * Known gap: the backend (backend/app/main.py) only serves primary schools
 * today — there's no `phase` query param yet. Requesting the secondary phase
 * in remote mode throws rather than silently returning primary-school
 * results. Adding secondary-phase support to the backend is roadmap §2
 * follow-up work, not part of this switch.
 *
 * Place-name search and autocomplete have no backend equivalent (small,
 * static lookup data — not worth a backend round trip), so both modes
 * always use the static implementation for those two functions.
 */

import axios from 'axios';
import { getPlaceSuggestions, searchByPlaceName } from './api.static';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({ baseURL: API_BASE_URL });

function assertPrimaryPhase(phase, fnName) {
  if (phase && phase !== 'primary') {
    throw new Error(
      `${fnName}: the live API doesn't support the "${phase}" phase yet (primary schools only). ` +
      `Switch VITE_DATA_MODE back to "static" for secondary-school search until the backend catches up.`
    );
  }
}

/**
 * Search for schools near a geographic location
 */
export const searchNearbySchools = async (latitude, longitude, radiusKm = 5, limit = 20, phase = 'primary') => {
  assertPrimaryPhase(phase, 'searchNearbySchools');
  const { data } = await client.get('/api/schools/nearby', {
    params: { latitude, longitude, radius_km: radiusKm, limit },
  });
  return data;
};

/**
 * Search for schools near a UK postcode (backend geocodes via postcodes.io)
 */
export const searchByPostcode = async (postcode, radiusKm = 5, limit = 20, phase = 'primary') => {
  assertPrimaryPhase(phase, 'searchByPostcode');
  const { data } = await client.get('/api/schools/search', {
    params: { postcode, radius_km: radiusKm, limit },
  });
  return data;
};

/**
 * Get details for a specific school by URN
 */
export const getSchoolDetails = async (urn, phase = 'primary') => {
  assertPrimaryPhase(phase, 'getSchoolDetails');
  const { data } = await client.get(`/api/schools/${urn}`);
  return data;
};

/**
 * Get dataset statistics
 */
export const getStatistics = async (phase = 'primary') => {
  assertPrimaryPhase(phase, 'getStatistics');
  const { data } = await client.get('/api/stats');
  return data;
};

// No backend equivalent — always static (see file header).
export { getPlaceSuggestions, searchByPlaceName };

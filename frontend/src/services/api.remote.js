/**
 * Remote-mode data service for UK Schools — calls the FastAPI backend
 * instead of loading static JSON. Same public function signatures as
 * api.static.js so the two are interchangeable — see api.js for the switch.
 *
 * The backend (backend/app/main.py) supports both phases via a `phase`
 * query param (roadmap §2 backend migration) -- verified against live data
 * for both primary and secondary before this was wired up here.
 *
 * Place-name search and autocomplete have no backend equivalent (small,
 * static lookup data — not worth a backend round trip), so both modes
 * always use the static implementation for those two functions.
 */

import axios from 'axios';
import { getPlaceSuggestions, searchByPlaceName } from './api.static';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({ baseURL: API_BASE_URL });

/**
 * Search for schools near a geographic location
 */
export const searchNearbySchools = async (latitude, longitude, radiusKm = 5, limit = 20, phase = 'primary') => {
  const { data } = await client.get('/api/schools/nearby', {
    params: { latitude, longitude, radius_km: radiusKm, limit, phase },
  });
  return data;
};

/**
 * Search for schools near a UK postcode (backend geocodes via postcodes.io)
 */
export const searchByPostcode = async (postcode, radiusKm = 5, limit = 20, phase = 'primary') => {
  const { data } = await client.get('/api/schools/search', {
    params: { postcode, radius_km: radiusKm, limit, phase },
  });
  return data;
};

/**
 * Get details for a specific school by URN
 */
export const getSchoolDetails = async (urn, phase = 'primary') => {
  const { data } = await client.get(`/api/schools/${urn}`, { params: { phase } });
  return data;
};

/**
 * Get dataset statistics
 */
export const getStatistics = async (phase = 'primary') => {
  const { data } = await client.get('/api/stats', { params: { phase } });
  return data;
};

// No backend equivalent — always static (see file header).
export { getPlaceSuggestions, searchByPlaceName };

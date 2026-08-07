/**
 * Data service switch — static JSON (default, zero backend cost) vs.
 * the live FastAPI backend, controlled by VITE_DATA_MODE.
 *
 * Rollback: set VITE_DATA_MODE=static (or unset it) and redeploy the
 * frontend. No code change, no backend involvement. See ROADMAP.md §2
 * and data_pilot/README.md for the reasoning behind keeping this switch.
 *
 * Every function here has the same signature and return shape in both
 * modes — components should only ever import from this file, never
 * from api.static.js / api.remote.js directly.
 */

import * as staticApi from './api.static';
import * as remoteApi from './api.remote';

const impl = import.meta.env.VITE_DATA_MODE === 'api' ? remoteApi : staticApi;

export const {
  searchNearbySchools,
  searchByPostcode,
  getSchoolDetails,
  getPlaceSuggestions,
  searchByPlaceName,
  getStatistics,
} = impl;

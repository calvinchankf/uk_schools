/**
 * API client for UK Schools backend
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Search for schools near a geographic location
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @param {number} limit - Maximum number of results
 * @returns {Promise} API response with schools
 */
export const searchNearbySchools = async (latitude, longitude, radiusKm = 5, limit = 20) => {
  const response = await apiClient.get('/api/schools/nearby', {
    params: {
      latitude,
      longitude,
      radius_km: radiusKm,
      limit,
    },
  });
  return response.data;
};

/**
 * Search for schools near a postcode
 * @param {string} postcode - UK postcode
 * @param {number} radiusKm - Search radius in kilometers
 * @param {number} limit - Maximum number of results
 * @returns {Promise} API response with schools
 */
export const searchByPostcode = async (postcode, radiusKm = 5, limit = 20) => {
  const response = await apiClient.get('/api/schools/search', {
    params: {
      postcode,
      radius_km: radiusKm,
      limit,
    },
  });
  return response.data;
};

/**
 * Get details for a specific school
 * @param {number} urn - Unique Reference Number
 * @returns {Promise} School details
 */
export const getSchoolDetails = async (urn) => {
  const response = await apiClient.get(`/api/schools/${urn}`);
  return response.data;
};

/**
 * Get dataset statistics
 * @returns {Promise} Statistics
 */
export const getStatistics = async () => {
  const response = await apiClient.get('/api/stats');
  return response.data;
};

export default apiClient;

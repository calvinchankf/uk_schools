/**
 * Main application component
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map from './components/Map';
import SchoolList from './components/SchoolList';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import { searchNearbySchools, searchByPostcode } from './services/api';
import './App.css';

function App() {
  const [schools, setSchools] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const isDragging = useRef(false);

  const handleResizeStart = useCallback((e) => {
    isDragging.current = true;
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(Math.max(e.clientX, 280), 800);
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  /**
   * Handle map click to search nearby schools
   */
  const handleMapClick = useCallback(async (latitude, longitude) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchNearbySchools(latitude, longitude, radiusKm, 50);
      setSchools(response.schools);
      setSearchLocation(response.search_location);
      setSelectedSchool(null);
    } catch (err) {
      setError('Failed to search schools. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [radiusKm]);

  /**
   * Handle postcode search
   */
  const handlePostcodeSearch = useCallback(async (postcode) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchByPostcode(postcode, radiusKm, 50);
      setSchools(response.schools);
      setSearchLocation(response.search_location);
      setSelectedSchool(null);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Postcode not found. Please check and try again.');
      } else {
        setError('Failed to search schools. Please try again.');
      }
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [radiusKm]);

  /**
   * Handle radius change - re-search if location exists
   */
  const handleRadiusChange = useCallback(async (newRadius) => {
    setRadiusKm(newRadius);

    if (searchLocation) {
      setIsLoading(true);
      setError(null);

      try {
        let response;
        if (searchLocation.postcode) {
          response = await searchByPostcode(searchLocation.postcode, newRadius, 50);
        } else {
          response = await searchNearbySchools(
            searchLocation.latitude,
            searchLocation.longitude,
            newRadius,
            50
          );
        }
        setSchools(response.schools);
        setSearchLocation(response.search_location);
        setSelectedSchool(null);
      } catch (err) {
        setError('Failed to update search. Please try again.');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchLocation]);

  /**
   * Handle school selection
   */
  const handleSchoolClick = useCallback((school) => {
    setSelectedSchool(school);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>UK Primary Schools Search</h1>
        <p className="subtitle">Find and compare Key Stage 2 primary schools by performance</p>
      </header>

      <div className="app-content">
        <aside className="sidebar" style={{ width: sidebarWidth }}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="loading-message">
              Searching for schools...
            </div>
          )}

          <SchoolList
            schools={schools}
            onSchoolClick={handleSchoolClick}
            selectedSchool={selectedSchool}
          />
        </aside>

        <div className="resize-handle" onMouseDown={handleResizeStart}>
          <div className="resize-handle-grip" />
        </div>

        <main className="map-container">
          <div className="map-overlay map-overlay--top-right">
            <SearchBar
              onSearch={handlePostcodeSearch}
              isLoading={isLoading}
              variant="overlay"
              radiusKm={radiusKm}
              onRadiusChange={handleRadiusChange}
              maxRadiusKm={10}
            />
          </div>
          <Map
            schools={schools}
            onMapClick={handleMapClick}
            onSchoolClick={handleSchoolClick}
            searchLocation={searchLocation}
            radiusKm={radiusKm}
            selectedSchool={selectedSchool}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

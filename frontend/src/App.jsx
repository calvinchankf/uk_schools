/**
 * Main application component
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map from './components/Map';
import SchoolList from './components/SchoolList';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import { searchNearbySchools, searchByPostcode, searchByPlaceName } from './services/api';
import './App.css';

function App() {
  const [schools, setSchools] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [phase, setPhase] = useState('primary');
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

  const track = (eventName, params = {}) => {
    if (typeof gtag === 'function') gtag('event', eventName, params);
  };

  const handleMapClick = useCallback(async (latitude, longitude) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchNearbySchools(latitude, longitude, radiusKm, 50, phase);
      setSchools(response.schools);
      setSearchLocation(response.search_location);
      setSelectedSchool(null);
      const count = response.schools.length;
      track('map_click_search', { success: true, result_count: count, radius_km: radiusKm, phase });
      if (count === 0) track('zero_results', { search_type: 'map_click', radius_km: radiusKm, phase });
    } catch (err) {
      setError('Failed to search schools. Please try again.');
      track('map_click_search', { success: false, radius_km: radiusKm, phase });
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [radiusKm, phase]);

  const POSTCODE_RE = /^[A-Z]{1,2}\d/i;

  const handleSearch = useCallback(async (query) => {
    setIsLoading(true);
    setError(null);

    try {
      const isPostcode = POSTCODE_RE.test(query.trim());
      const response = isPostcode
        ? await searchByPostcode(query, radiusKm, 50, phase)
        : await searchByPlaceName(query, radiusKm, 50, phase);
      setSchools(response.schools);
      setSearchLocation(response.search_location);
      setSelectedSchool(null);
      const count = response.schools.length;
      const search_type = isPostcode ? 'postcode' : 'place_name';
      track('search', { success: true, result_count: count, radius_km: radiusKm, phase, search_type });
      if (count === 0) track('zero_results', { search_type, radius_km: radiusKm, phase });
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
      track('search', { success: false, radius_km: radiusKm, phase });
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [radiusKm, phase]);

  const handleRadiusChange = useCallback(async (newRadius) => {
    setRadiusKm(newRadius);
    track('radius_changed', { radius_km: newRadius });

    if (searchLocation) {
      setIsLoading(true);
      setError(null);

      try {
        let response;
        if (searchLocation.postcode) {
          response = await searchByPostcode(searchLocation.postcode, newRadius, 50, phase);
        } else if (searchLocation.place_name) {
          response = await searchByPlaceName(searchLocation.place_name, newRadius, 50, phase);
        } else {
          response = await searchNearbySchools(
            searchLocation.latitude,
            searchLocation.longitude,
            newRadius,
            50,
            phase
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
  }, [searchLocation, phase]);

  const handlePhaseChange = useCallback(async (newPhase) => {
    setPhase(newPhase);
    setSchools([]);
    setSelectedSchool(null);
    track('phase_changed', { phase: newPhase, from_phase: phase });

    if (searchLocation) {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (searchLocation.postcode) {
          response = await searchByPostcode(searchLocation.postcode, radiusKm, 50, newPhase);
        } else if (searchLocation.place_name) {
          response = await searchByPlaceName(searchLocation.place_name, radiusKm, 50, newPhase);
        } else {
          response = await searchNearbySchools(
            searchLocation.latitude,
            searchLocation.longitude,
            radiusKm,
            50,
            newPhase
          );
        }
        setSchools(response.schools);
        setSearchLocation(response.search_location);
      } catch (err) {
        setError('Failed to update search. Please try again.');
        console.error('Phase switch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchLocation, radiusKm, phase]);

  const handleSchoolClick = useCallback((school, rank) => {
    setSelectedSchool(school);
    track('school_card_clicked', { school_name: school.name, urn: school.urn, rank });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <div className="app-header-text">
            <h1>UK Schools Search</h1>
            <p className="subtitle">
              {phase === 'primary'
                ? 'Find and compare Key Stage 2 primary schools by performance'
                : 'Find and compare Key Stage 4 secondary schools by performance'}
            </p>
          </div>
          <div className="phase-toggle">
            <button
              className={`phase-btn${phase === 'primary' ? ' phase-btn--active' : ''}`}
              onClick={() => handlePhaseChange('primary')}
              disabled={isLoading}
            >
              Primary
            </button>
            <button
              className={`phase-btn${phase === 'secondary' ? ' phase-btn--active' : ''}`}
              onClick={() => handlePhaseChange('secondary')}
              disabled={isLoading}
            >
              Secondary
            </button>
          </div>
        </div>
      </header>

      <div className="mobile-search">
        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
          radiusKm={radiusKm}
          onRadiusChange={handleRadiusChange}
          maxRadiusKm={10}
        />
        {error && <div className="error-message">{error}</div>}
        {isLoading && <div className="loading-message">Searching for schools...</div>}
      </div>

      <div className="app-content">
        <aside className="sidebar" style={{ width: sidebarWidth }}>
          {error && (
            <div className="error-message desktop-only">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="loading-message desktop-only">
              Searching for schools...
            </div>
          )}

          <SchoolList
            schools={schools}
            onSchoolClick={handleSchoolClick}
            selectedSchool={selectedSchool}
            phase={phase}
          />
        </aside>

        <div className="resize-handle" onMouseDown={handleResizeStart}>
          <div className="resize-handle-grip" />
        </div>

        <main className="map-container">
          <div className="map-overlay map-overlay--top-right">
            <SearchBar
              onSearch={handleSearch}
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

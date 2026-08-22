/**
 * Main application component
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map from './components/Map';
import SchoolList from './components/SchoolList';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import { searchNearbySchools, searchByPostcode, searchByPlaceName, getSchoolDetails } from './services/api';
import { useUrlSync } from './hooks/useUrlSync';
import { useDocumentMeta } from './hooks/useDocumentMeta';
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
  const [scrollToUrn, setScrollToUrn] = useState(null);
  const [panToSchool, setPanToSchool] = useState(null);
  const [initialQuery, setInitialQuery] = useState('');
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

  // `overrides` lets a URL restore (?radius=5&phase=secondary) search with
  // values that haven't landed in state yet -- setState is async, so without
  // this the search would fire using the *old* radiusKm/phase from the
  // closure. Fully backward-compatible: existing callers (SearchBar etc.)
  // still call with one argument.
  const handleMapClick = useCallback(async (latitude, longitude, overrides = {}) => {
    const effRadius = overrides.radius ?? radiusKm;
    const effPhase = overrides.phase ?? phase;
    if (overrides.radius !== undefined && overrides.radius !== radiusKm) setRadiusKm(overrides.radius);
    if (overrides.phase !== undefined && overrides.phase !== phase) setPhase(overrides.phase);

    setIsLoading(true);
    setError(null);

    try {
      const response = await searchNearbySchools(latitude, longitude, effRadius, 50, effPhase);
      setSchools(response.schools);
      setSearchLocation(response.search_location);
      setSelectedSchool(null);
      const count = response.schools.length;
      track('map_click_search', { success: true, result_count: count, radius_km: effRadius, phase: effPhase });
      if (count === 0) track('zero_results', { search_type: 'map_click', radius_km: effRadius, phase: effPhase });
      return response;
    } catch (err) {
      setError('Failed to search schools. Please try again.');
      track('map_click_search', { success: false, radius_km: effRadius, phase: effPhase });
      console.error('Search error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [radiusKm, phase]);

  const POSTCODE_RE = /^[A-Z]{1,2}\d/i;

  const handleSearch = useCallback(async (query, overrides = {}) => {
    const effRadius = overrides.radius ?? radiusKm;
    const effPhase = overrides.phase ?? phase;
    if (overrides.radius !== undefined && overrides.radius !== radiusKm) setRadiusKm(overrides.radius);
    if (overrides.phase !== undefined && overrides.phase !== phase) setPhase(overrides.phase);

    setIsLoading(true);
    setError(null);

    try {
      const isPostcode = POSTCODE_RE.test(query.trim());
      const response = isPostcode
        ? await searchByPostcode(query, effRadius, 50, effPhase)
        : await searchByPlaceName(query, effRadius, 50, effPhase);
      setSchools(response.schools);
      setSearchLocation(response.search_location);
      setSelectedSchool(null);
      const count = response.schools.length;
      const search_type = isPostcode ? 'postcode' : 'place_name';
      track('search', { success: true, result_count: count, radius_km: effRadius, phase: effPhase, search_type });
      if (count === 0) track('zero_results', { search_type, radius_km: effRadius, phase: effPhase });
      return response;
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
      track('search', { success: false, radius_km: effRadius, phase: effPhase });
      console.error('Search error:', err);
      return null;
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

  // Called when user clicks a marker on the map — scroll the list to that card
  const handleMapMarkerClick = useCallback((school) => {
    setSelectedSchool(school);
    setScrollToUrn({ urn: school.urn, ts: Date.now() });
    track('map_marker_clicked', { school_name: school.name, urn: school.urn });
  }, []);

  // Called when user clicks a card in the list — fly the map to that school
  const handleListSchoolClick = useCallback((school, rank) => {
    setSelectedSchool(school);
    setPanToSchool({ lat: school.latitude, lng: school.longitude, ts: Date.now() });
    track('school_card_clicked', { school_name: school.name, urn: school.urn, rank });
  }, []);

  // Puts a school into the visible list (if not already there -- a deep
  // link's own centered search can still exclude it via the `limit=50`
  // truncation in a dense area) and selects it, reusing the exact same
  // selection UX a map-marker click already produces.
  const mergeAndSelectSchool = useCallback((school) => {
    setSchools((prev) => (prev.some((s) => s.urn === school.urn) ? prev : [school, ...prev]));
    handleMapMarkerClick(school);
  }, [handleMapMarkerClick]);

  // Cold deep-link: ?school=&phase= with no q/lat/lng. Fetch the school,
  // build a results list centered on it, select it -- "as if the user had
  // selected it on the map" from a page load with no prior search.
  const handleSchoolDeepLink = useCallback(async (urn, targetPhase, targetRadius) => {
    setIsLoading(true);
    setError(null);
    if (targetPhase !== phase) setPhase(targetPhase);
    if (targetRadius !== radiusKm) setRadiusKm(targetRadius);
    try {
      const school = await getSchoolDetails(urn, targetPhase);
      const response = await searchNearbySchools(school.latitude, school.longitude, targetRadius, 50, targetPhase);
      setSchools(response.schools);
      setSearchLocation(response.search_location);
      mergeAndSelectSchool({ ...school, distance_km: 0 });
      track('school_deep_link', { urn, phase: targetPhase, success: true });
    } catch (err) {
      setError("We couldn't find that school. Showing the default search.");
      console.error('School deep-link error:', err);
      track('school_deep_link', { urn, phase: targetPhase, success: false });
    } finally {
      setIsLoading(false);
    }
  }, [phase, radiusKm, mergeAndSelectSchool]);

  // Combined ?q=...&school=... case where the school wasn't in that
  // search's own results. The primary search already succeeded, so a
  // failure here is a lost nicety, not a broken page -- log, don't surface.
  const handleSchoolSelectOnly = useCallback(async (urn, targetPhase) => {
    try {
      const school = await getSchoolDetails(urn, targetPhase);
      mergeAndSelectSchool(school);
    } catch (err) {
      console.warn(`Deep-linked school ${urn} (${targetPhase}) could not be resolved; ignoring.`, err);
    }
  }, [mergeAndSelectSchool]);

  const onRestore = useCallback(async (parsed) => {
    if (parsed.q) setInitialQuery(parsed.q);

    if (parsed.q || (parsed.lat != null && parsed.lng != null)) {
      const response = parsed.q
        ? await handleSearch(parsed.q, { radius: parsed.radius, phase: parsed.phase })
        : await handleMapClick(parsed.lat, parsed.lng, { radius: parsed.radius, phase: parsed.phase });
      if (parsed.school != null && response) {
        const found = response.schools.find((s) => s.urn === parsed.school);
        if (found) {
          handleMapMarkerClick(found);
        } else {
          await handleSchoolSelectOnly(parsed.school, parsed.phase);
        }
      }
    } else if (parsed.school != null) {
      await handleSchoolDeepLink(parsed.school, parsed.phase, parsed.radius);
    } else if (parsed.phase) {
      setPhase(parsed.phase);
    }
  }, [handleSearch, handleMapClick, handleMapMarkerClick, handleSchoolDeepLink, handleSchoolSelectOnly]);

  useUrlSync({ urlState: { searchLocation, radiusKm, phase, selectedSchool }, onRestore });
  useDocumentMeta({ phase, searchLocation, selectedSchool, resultCount: schools.length });

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
          initialQuery={initialQuery}
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
            onSchoolClick={handleListSchoolClick}
            selectedSchool={selectedSchool}
            phase={phase}
            scrollToUrn={scrollToUrn}
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
              initialQuery={initialQuery}
            />
          </div>
          <Map
            schools={schools}
            onMapClick={handleMapClick}
            onSchoolClick={handleMapMarkerClick}
            searchLocation={searchLocation}
            radiusKm={radiusKm}
            selectedSchool={selectedSchool}
            panToSchool={panToSchool}
          />
        </main>
      </div>
    </div>
  );
}

export default App;

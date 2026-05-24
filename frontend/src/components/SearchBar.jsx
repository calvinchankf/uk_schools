import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { getPlaceSuggestions } from '../services/api';
import './SearchBar.css';

const POSTCODE_RE = /^[A-Z]{1,2}\d/i;

const SearchBar = ({
  onSearch,
  isLoading,
  variant = 'sidebar',
  radiusKm,
  onRadiusChange,
  maxRadiusKm = 10,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  const rootClassName = useMemo(() => {
    const classes = ['search-bar'];
    if (variant === 'overlay') classes.push('search-bar--overlay');
    return classes.join(' ');
  }, [variant]);

  const showRadiusInline = typeof radiusKm === 'number' && typeof onRadiusChange === 'function';

  // Fetch suggestions whenever query changes (skip for postcodes)
  useEffect(() => {
    if (POSTCODE_RE.test(query.trim()) || query.trim().length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    let cancelled = false;
    getPlaceSuggestions(query.trim()).then((results) => {
      if (!cancelled) {
        setSuggestions(results);
        setActiveIndex(-1);
      }
    });
    return () => { cancelled = true; };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const commitSearch = useCallback((value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSuggestions([]);
    setActiveIndex(-1);
    onSearch(trimmed);
  }, [onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const chosen = activeIndex >= 0 && suggestions[activeIndex]
      ? suggestions[activeIndex].name
      : query;
    commitSearch(chosen);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  const handleSuggestionClick = (name) => {
    setQuery(name);
    commitSearch(name);
  };

  return (
    <div className={rootClassName} ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder="Postcode or place name (e.g. SW1A 2AA, Wimbledon)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          className="search-button"
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>

        {showRadiusInline && (
          <div className="radius-inline" title="Search radius">
            <span className="radius-inline__label">Radius</span>
            <select
              className="radius-inline__select"
              value={radiusKm}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              disabled={isLoading}
              aria-label="Search radius in kilometers"
            >
              {Array.from({ length: Math.max(1, maxRadiusKm) }, (_, i) => i + 1).map((km) => (
                <option key={km} value={km}>{km} km</option>
              ))}
            </select>
          </div>
        )}
      </form>

      {suggestions.length > 0 && (
        <ul className="search-suggestions" role="listbox">
          {suggestions.map((place, i) => (
            <li
              key={place.name}
              className={`search-suggestion${i === activeIndex ? ' search-suggestion--active' : ''}`}
              role="option"
              aria-selected={i === activeIndex}
              onPointerDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(place.name);
              }}
            >
              {place.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;

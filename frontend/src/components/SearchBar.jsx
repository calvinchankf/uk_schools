/**
 * Postcode search bar component
 */

import React, { useMemo, useState } from 'react';
import './SearchBar.css';

const SearchBar = ({
  onSearch,
  isLoading,
  variant = 'sidebar',
  radiusKm,
  onRadiusChange,
  maxRadiusKm = 10,
}) => {
  const [postcode, setPostcode] = useState('');
  const rootClassName = useMemo(() => {
    const classes = ['search-bar'];
    if (variant === 'overlay') classes.push('search-bar--overlay');
    return classes.join(' ');
  }, [variant]);

  const showRadiusInline = variant === 'overlay' && typeof radiusKm === 'number' && typeof onRadiusChange === 'function';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (postcode.trim()) {
      onSearch(postcode.trim().toUpperCase());
    }
  };

  return (
    <div className={rootClassName}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder="Enter UK postcode (e.g., EC1N 2NX)"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="search-button"
          disabled={isLoading || !postcode.trim()}
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
    </div>
  );
};

export default SearchBar;

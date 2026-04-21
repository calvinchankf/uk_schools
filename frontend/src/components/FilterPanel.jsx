/**
 * Filter panel component for search radius adjustment
 */

import React from 'react';
import './FilterPanel.css';

const FilterPanel = ({ radiusKm, onRadiusChange, isLoading }) => {
  return (
    <div className="filter-panel">
      <div className="filter-section">
        <label htmlFor="radius-slider" className="filter-label">
          Search Radius: <strong>{radiusKm} km</strong>
        </label>
        <input
          id="radius-slider"
          type="range"
          min="1"
          max="10"
          step="1"
          value={radiusKm}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="radius-slider"
          disabled={isLoading}
        />
        <div className="slider-labels">
          <span>1 km</span>
          <span>10 km</span>
        </div>
      </div>

      <div className="help-text">
        Click on the map or enter a postcode to search for schools
      </div>
    </div>
  );
};

export default FilterPanel;

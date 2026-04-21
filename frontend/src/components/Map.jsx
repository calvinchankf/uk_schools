/**
 * Interactive map component using Leaflet and OpenStreetMap
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Create color-coded marker icons based on performance score
 */
const createMarkerIcon = (score) => {
  let color;
  if (score >= 75) {
    color = '#22c55e'; // Green - Excellent
  } else if (score >= 60) {
    color = '#84cc16'; // Light green - Good
  } else if (score >= 45) {
    color = '#eab308'; // Yellow - Average
  } else {
    color = '#ef4444'; // Red - Below average
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 25px;
      height: 25px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 24],
  });
};

/**
 * Component to handle map events and updates
 */
const MapEventHandler = ({ onMapClick, searchLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (searchLocation) {
      map.setView([searchLocation.latitude, searchLocation.longitude], 12);
    }
  }, [searchLocation, map]);

  useEffect(() => {
    const handleClick = (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
};

/**
 * Main Map component
 */
const Map = ({ schools, onMapClick, onSchoolClick, searchLocation, radiusKm, selectedSchool }) => {
  const center = [52.4862, -1.8904]; // UK center
  const zoom = 6;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler onMapClick={onMapClick} searchLocation={searchLocation} />

        {/* Search radius circle */}
        {searchLocation && (
          <Circle
            center={[searchLocation.latitude, searchLocation.longitude]}
            radius={radiusKm * 1000} // Convert km to meters
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
          />
        )}

        {/* Search center marker */}
        {searchLocation && (
          <Marker
            position={[searchLocation.latitude, searchLocation.longitude]}
            icon={L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
          >
            <Popup>
              <strong>Search Center</strong>
              {searchLocation.postcode && <div>Postcode: {searchLocation.postcode}</div>}
            </Popup>
          </Marker>
        )}

        {/* School markers */}
        {schools.map((school, index) => (
          <Marker
            key={school.urn}
            position={[school.latitude, school.longitude]}
            icon={createMarkerIcon(school.performance_score)}
            eventHandlers={{
              click: () => onSchoolClick(school),
            }}
            opacity={selectedSchool && selectedSchool.urn === school.urn ? 1 : 0.7}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong>#{index + 1} {school.name}</strong>
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  <div>Score: <strong>{school.performance_score.toFixed(1)}</strong></div>
                  <div>Distance: {school.distance_km?.toFixed(2)} km</div>
                  <div style={{ marginTop: '4px' }}>
                    {school.metrics.ptrwm_exp && (
                      <div>RWM Expected: {school.metrics.ptrwm_exp.toFixed(1)}%</div>
                    )}
                    {school.metrics.read_average && (
                      <div>Reading: {school.metrics.read_average.toFixed(1)}</div>
                    )}
                    {school.metrics.mat_average && (
                      <div>Maths: {school.metrics.mat_average.toFixed(1)}</div>
                    )}
                  </div>
                  {school.fsm_pct != null && (
                    <div style={{ marginTop: '4px' }}>
                      Free School Meals: {school.fsm_pct.toFixed(1)}%
                    </div>
                  )}
                  {school.ethnicity && school.ethnicity.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      {school.ethnicity.map(e => `${e.group} ${e.pct}%`).join(', ')}
                    </div>
                  )}
                  {school.feeder_secondary && (
                    <div style={{ marginTop: '4px' }}>
                      → {school.feeder_secondary.name}
                    </div>
                  )}
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                    {school.postcode}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;

/**
 * Interactive map component using Leaflet and OpenStreetMap
 */

import React, { useEffect, useRef } from 'react';
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

const getMarkerColor = (score) => {
  if (score >= 75) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 45) return '#eab308';
  return '#ef4444';
};

const createMarkerIcon = (score) => {
  const color = getMarkerColor(score);
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

const createSelectedMarkerIcon = (score) => {
  const color = getMarkerColor(score);
  return L.divIcon({
    className: 'custom-marker custom-marker--selected',
    html: `<div style="
      background-color: ${color};
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 0 0 3px ${color}, 0 4px 10px rgba(0,0,0,0.45);
    "></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
  });
};

/**
 * Flies the map to a new location when panToSchool changes.
 */
const MapFlyTo = ({ panToSchool }) => {
  const map = useMap();

  useEffect(() => {
    if (!panToSchool) return;
    const currentZoom = map.getZoom();
    map.flyTo([panToSchool.lat, panToSchool.lng], Math.max(currentZoom, 14), { duration: 0.8 });
  }, [panToSchool, map]);

  return null;
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
const Map = ({ schools, onMapClick, onSchoolClick, searchLocation, radiusKm, selectedSchool, panToSchool }) => {
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
        <MapFlyTo panToSchool={panToSchool} />

        {/* Search radius circle */}
        {searchLocation && (
          <Circle
            center={[searchLocation.latitude, searchLocation.longitude]}
            radius={radiusKm * 1000}
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

        {/* School markers — no popup; click scrolls the sidebar list */}
        {schools.map((school, index) => {
          const isSelected = selectedSchool && selectedSchool.urn === school.urn;
          return (
            <Marker
              key={school.urn}
              position={[school.latitude, school.longitude]}
              icon={isSelected ? createSelectedMarkerIcon(school.performance_score) : createMarkerIcon(school.performance_score)}
              eventHandlers={{
                click: () => onSchoolClick(school),
              }}
              opacity={isSelected ? 1 : 0.75}
              zIndexOffset={isSelected ? 1000 : 0}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;

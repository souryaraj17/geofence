'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoPosition, SafeZone } from '../types';

// Map Center Update Component
function MapUpdater({ center }: { center: GeoPosition | null }) {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      map.flyTo([center.lat, center.lng], 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

interface MapViewProps {
  userPosition: GeoPosition | null;
  safeZone: SafeZone | null;
}

// Fix Leaflet Default Icon path issues in Next.js/Webpack
const createCustomIcon = (color: 'blue' | 'red') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color === 'blue' ? '#3b82f6' : '#ef4444'};
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
      "></div>
      <div style="
        position: absolute;
        top: -8px;
        left: -8px;
        width: 32px;
        height: 32px;
        background-color: ${color === 'blue' ? '#3b82f6' : '#ef4444'};
        border-radius: 50%;
        opacity: 0.3;
        animation: pulse-${color} 2s infinite ease-out;
      "></div>
      <style>
        @keyframes pulse-blue { 0% { transform: scale(0.5); opacity: 0.5; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulse-red { 0% { transform: scale(0.5); opacity: 0.5; } 100% { transform: scale(2); opacity: 0; } }
      </style>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

export default function MapView({ userPosition, safeZone }: MapViewProps) {
  // Use a default center if location is not resolved yet
  const defaultCenter = { lat: 0, lng: 0 };
  const center = userPosition || defaultCenter;
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Once user position is detected, we don't want the map to keep re-centering forcefully
  // unless we explicitly ask it to. Here we handle first load.
  useEffect(() => {
    if (userPosition && !initialSyncDone) {
      // Defer the state update to avoid rendering issues and mark sync done
      const timer = setTimeout(() => {
        setInitialSyncDone(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userPosition, initialSyncDone]);

  return (
    <div className="w-full h-screen relative z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={userPosition ? 16 : 2}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Sync map center on initial load */}
        {!initialSyncDone && userPosition && (
          <MapUpdater center={userPosition} />
        )}

        {/* User Location Marker */}
        {userPosition && (
          <Marker 
            position={[userPosition.lat, userPosition.lng]} 
            icon={createCustomIcon('blue')}
          />
        )}

        {/* Safe Zone Geofence Circle and Center Marker */}
        {safeZone && (
          <>
            <Marker 
              position={[safeZone.center.lat, safeZone.center.lng]} 
              icon={createCustomIcon('red')}
            />
            <Circle
              center={[safeZone.center.lat, safeZone.center.lng]}
              radius={safeZone.radius}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}

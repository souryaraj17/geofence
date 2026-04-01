'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoPosition, SafeZone, CommunityEvent } from '../types';

// ─── Map Center Update (initial GPS sync) ───────────────────────────────────
function MapUpdater({ center }: { center: GeoPosition | null }) {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      map.flyTo([center.lat, center.lng], 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

// ─── Event Focus (fly to selected event) ────────────────────────────────────
function EventFocuser({ event }: { event: CommunityEvent | null }) {
  const map = useMap();
  useEffect(() => {
    if (event?.coordinates && map) {
      map.flyTo([event.coordinates.lat, event.coordinates.lng], 16, { duration: 1.5 });
    }
  }, [event, map]);
  return null;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface MapViewProps {
  userPosition: GeoPosition | null;
  safeZone: SafeZone | null;
  events?: CommunityEvent[];
  /** The event the user tapped "View on Map" for — triggers a smooth fly-to */
  focusedEvent?: CommunityEvent | null;
}

// Fix Leaflet Default Icon path issues in Next.js/Webpack
const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-icon',
    html: `
      <div style="font-size: 28px; line-height: 1; filter: drop-shadow(0 0 4px rgba(0,0,0,0.5));">
        🚶‍♂️
      </div>
      <div style="
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 12px;
        height: 4px;
        background-color: rgba(0,0,0,0.3);
        border-radius: 50%;
        filter: blur(2px);
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 30], // Anchor at the feet
  });
};

// ─── Custom Marker Icons ─────────────────────────────────────────────────────
const createCustomIcon = (color: 'blue' | 'red' | 'purple') => {
  const hexColor = color === 'blue' ? '#3b82f6' : color === 'red' ? '#ef4444' : '#a855f7';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${hexColor};
        width: 16px; height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
      "></div>
      <div style="
        position: absolute; top: -8px; left: -8px;
        width: 32px; height: 32px;
        background-color: ${hexColor};
        border-radius: 50%;
        opacity: 0.3;
        animation: pulse-${color} 2s infinite ease-out;
      "></div>
      <style>
        @keyframes pulse-blue   { 0% { transform: scale(0.5); opacity: 0.5; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulse-red    { 0% { transform: scale(0.5); opacity: 0.5; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulse-purple { 0% { transform: scale(0.5); opacity: 0.5; } 100% { transform: scale(2); opacity: 0; } }
      </style>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
};

// ─── Main Map Component ───────────────────────────────────────────────────────
export default function MapView({ userPosition, safeZone, events = [], focusedEvent = null }: MapViewProps) {
  const defaultCenter = { lat: 0, lng: 0 };
  const center = userPosition || defaultCenter;
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Mark initial sync complete after first flyTo
  useEffect(() => {
    if (userPosition && !initialSyncDone) {
      const timer = setTimeout(() => setInitialSyncDone(true), 500);
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

        {/* Initial GPS sync */}
        {!initialSyncDone && userPosition && <MapUpdater center={userPosition} />}

        {/* Fly to selected event */}
        <EventFocuser event={focusedEvent} />

        {/* User Location */}
        {userPosition && (
          <Marker 
            position={[userPosition.lat, userPosition.lng]} 
            icon={createUserIcon()}
          />
        )}

        {/* Safe Zone */}
        {safeZone && (
          <>
            <Marker position={[safeZone.center.lat, safeZone.center.lng]} icon={createCustomIcon('red')} />
            <Circle
              center={[safeZone.center.lat, safeZone.center.lng]}
              radius={safeZone.radius}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2, dashArray: '5, 5' }}
            />
          </>
        )}

        {/* Community Event Markers with Popup */}
        {events.map((ev) => {
          if (!ev.coordinates) return null;
          const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${ev.coordinates.lat},${ev.coordinates.lng}`;
          return (
            <Marker
              key={ev.id}
              position={[ev.coordinates.lat, ev.coordinates.lng]}
              icon={createCustomIcon('purple')}
            >
              <Popup>
                <div style={{ minWidth: 180, fontFamily: 'sans-serif' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#1f2937' }}>{ev.title}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>📍 {ev.location}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>🕐 {ev.time}</p>
                  <p style={{ fontSize: 12, color: '#374151', marginBottom: 10 }}>{ev.description}</p>
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      background: '#7c3aed',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Navigate →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

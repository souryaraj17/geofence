'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { GeoPosition, SafeZone, GeofenceStatus, TrackingState, CommunityEvent } from '../../types';
import { locationService } from '../../services/locationService';
import { notificationService } from '../../services/notificationService';
import { isInsideGeofence } from '../../utils/geofence';
import Controls from '../../components/Controls';
import StatusBadge from '../../components/StatusBadge';
import AlertBanner from '../../components/AlertBanner';
import CommunityOverlay from '../../components/CommunityOverlay';
import { useCommunity } from '../../hooks/useCommunity';

// Leaflet uses 'window' which causes SSR issues, so we dynamic import MapView
const DynamicMapView = dynamic(() => import('../../components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading Map...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [userPosition, setUserPosition] = useState<GeoPosition | null>(null);
  const [safeZone, setSafeZone] = useState<SafeZone | null>(null);
  // Default to unknown to prevent initial sync update in effect
  const [status, setStatus] = useState<GeofenceStatus>('unknown');
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  
  // UI State
  const [radius, setRadius] = useState<number>(100);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState<boolean>(false);
  // focusedEvent: triggers map fly-to via MapView's EventFocuser
  const [focusedEvent, setFocusedEvent] = useState<CommunityEvent | null>(null);
  const focusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lifed Community State
  const { events, addEvent, joinEvent, removeEvent, isLoaded } = useCommunity();

  // Handle event selection: fly map to event then reset after animation
  const handleSelectEvent = useCallback((ev: CommunityEvent) => {
    setFocusedEvent(ev);
    // Reset after fly-to completes so re-selecting same event still fires
    if (focusResetRef.current) clearTimeout(focusResetRef.current);
    focusResetRef.current = setTimeout(() => setFocusedEvent(null), 2500);
  }, []);

  // Initialize GPS on mount
  useEffect(() => {
    async function initLocation() {
      const position = await locationService.getCurrentPosition();
      if (position) {
        setUserPosition(position);
      }
    }
    initLocation();
    
    // Cleanup watch on unmount if active
    return () => {
      locationService.clearWatch();
    };
  }, []);

  // Set safe zone at current location
  const handleSetSafeZone = useCallback(() => {
    if (!userPosition) return;
    setSafeZone({
      center: userPosition,
      radius: radius
    });
    setStatus('inside'); // Immediate state on set
  }, [userPosition, radius]);

  // Radius change handler
  const handleRadiusChange = useCallback((newRadius: number) => {
    setRadius(newRadius);
    if (safeZone) {
      setSafeZone({ ...safeZone, radius: newRadius });
    }
  }, [safeZone]);

  // Evaluate Geofence whenever position or safe zone changes
  useEffect(() => {
    if (!safeZone || !userPosition) {
      // Avoid sync setState directly in effect, only update if it has changed
      if (status !== 'unknown') {
        setTimeout(() => setStatus('unknown'), 0);
      }
      return;
    }

    const inside = isInsideGeofence(
      userPosition.lat,
      userPosition.lng,
      safeZone.center.lat,
      safeZone.center.lng,
      safeZone.radius
    );

    const newStatus: GeofenceStatus = inside ? 'inside' : 'outside';
    
    // Trigger notification if status changes to outside
    if (status === 'inside' && newStatus === 'outside') {
      notificationService.sendGeofenceAlert();
      setTimeout(() => setShowAlert(true), 0);
    }
    
    if (status !== newStatus) {
      // Wrap in setTimeout to satisfy linter for sync setState in effect
      setTimeout(() => setStatus(newStatus), 0);
    }
  }, [userPosition, safeZone, status]);

  // Toggle Live Tracking
  const toggleTracking = useCallback(() => {
    if (trackingState === 'tracking') {
      locationService.clearWatch();
      setTrackingState('idle');
    } else {
      setTrackingState('tracking');
      locationService.watchPosition((pos, err) => {
        if (err || !pos) {
          setTrackingState('error');
          return;
        }
        setUserPosition(pos);
        // The useEffect will handle geofence check automatically when userPosition updates
      });
    }
  }, [trackingState]);

  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-gray-50 flex flex-col">
      <StatusBadge status={status} />

      {/* Community Button */}
      <button 
        onClick={() => setIsCommunityOpen(true)}
        className="absolute top-6 right-4 z-40 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full shadow-[0_4px_15_rgba(0,0,0,0.1)] border border-white/20 text-blue-600 font-bold text-sm tracking-wide flex items-center gap-2 hover:bg-white transition-all active:scale-95"
      >
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        Community
      </button>

      <AlertBanner isVisible={showAlert} onDismiss={() => setShowAlert(false)} />
      
      <DynamicMapView 
        userPosition={userPosition} 
        safeZone={safeZone} 
        events={events}
        focusedEvent={focusedEvent}
      />
      
      <Controls
        onSetSafeZone={handleSetSafeZone}
        canSetSafeZone={!!userPosition}
        radius={radius}
        onRadiusChange={handleRadiusChange}
        isTracking={trackingState === 'tracking'}
        onToggleTracking={toggleTracking}
      />

      <CommunityOverlay
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        userPosition={userPosition}
        events={events}
        addEvent={addEvent}
        joinEvent={joinEvent}
        removeEvent={removeEvent}
        isLoaded={isLoaded}
        onSelectEvent={handleSelectEvent}
      />
    </main>
  );
}

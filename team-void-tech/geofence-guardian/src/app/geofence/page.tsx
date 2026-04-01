'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GeoPosition, SafeZone, GeofenceStatus, TrackingState } from '../../types';
import { locationService } from '../../services/locationService';
import { notificationService } from '../../services/notificationService';
import { isInsideGeofence } from '../../utils/geofence';
import Controls from '../../components/Controls';
import StatusBadge from '../../components/StatusBadge';
import AlertBanner from '../../components/AlertBanner';

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

export default function GeofencePage() {
  const [userPosition, setUserPosition] = useState<GeoPosition | null>(null);
  const [safeZone, setSafeZone] = useState<SafeZone | null>(null);
  const [status, setStatus] = useState<GeofenceStatus>('unknown');
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  
  // UI State
  const [radius, setRadius] = useState<number>(100);
  const [showAlert, setShowAlert] = useState<boolean>(false);

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
      if (!safeZone) setStatus('unknown');
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
      setShowAlert(true);
    }
    
    if (status !== newStatus) {
      setStatus(newStatus);
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
        // We removed the stale closure checkGeofence here,
        // the useEffect will handle it automatically when userPosition updates.
      });
    }
  }, [trackingState]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-gray-50">
      <StatusBadge status={status} />
      <AlertBanner isVisible={showAlert} onDismiss={() => setShowAlert(false)} />
      
      <DynamicMapView 
        userPosition={userPosition} 
        safeZone={safeZone} 
      />
      
      <Controls
        onSetSafeZone={handleSetSafeZone}
        canSetSafeZone={!!userPosition}
        radius={radius}
        onRadiusChange={handleRadiusChange}
        isTracking={trackingState === 'tracking'}
        onToggleTracking={toggleTracking}
      />
    </main>
  );
}

export interface GeoPosition {
  lat: number;
  lng: number;
}

export interface SafeZone {
  center: GeoPosition;
  radius: number; // in meters
}

export type GeofenceStatus = 'inside' | 'outside' | 'unknown';
export type TrackingState = 'idle' | 'tracking' | 'error';

export interface CommunityEvent {
  id: string;
  title: string;
  location: string;
  time: string;
  description: string;
  joined: boolean;
  coordinates?: GeoPosition;
}

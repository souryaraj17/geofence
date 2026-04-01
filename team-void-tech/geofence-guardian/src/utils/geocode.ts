/**
 * geocode.ts
 * Converts a free-text location string into GPS coordinates using the
 * Nominatim geocoding API (OpenStreetMap, free, no API key required).
 *
 * Rate limit: 1 request/second — suitable for user-initiated event creation.
 * For high-traffic production use, swap the URL for Google Maps Geocoding API.
 */

import { GeoPosition } from '../types';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Geocodes a location text string to lat/lng coordinates.
 * @param locationText - e.g. "Central Park, New York" or "Bangalore"
 * @returns GeoPosition { lat, lng } or null if not found / on error
 */
export async function geocodeLocation(locationText: string): Promise<GeoPosition | null> {
  if (!locationText.trim()) return null;

  try {
    const encoded = encodeURIComponent(locationText.trim());
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      {
        headers: {
          // Nominatim requires a valid User-Agent for identification
          'User-Agent': 'GeofenceGuardianApp/1.0',
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      console.warn('[geocode] Nominatim request failed:', response.status);
      return null;
    }

    const data: NominatimResult[] = await response.json();

    if (data.length === 0) {
      console.warn('[geocode] No results for:', locationText);
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('[geocode] Error during geocoding:', error);
    return null;
  }
}

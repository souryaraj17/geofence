import { useState, useEffect, useCallback } from 'react';
import { CommunityEvent } from '../types';

const STORAGE_KEY = 'geofence_guardian_events';

const MOCK_EVENTS: CommunityEvent[] = [
  {
    id: 'e1',
    title: 'Local Park Cleanup',
    location: 'Central Park West',
    time: 'Saturday, 10:00 AM',
    description: 'Join us to help clean up the park together.',
    joined: false,
    coordinates: { lat: 40.7829, lng: -73.9654 }
  },
  {
    id: 'e2',
    title: 'Neighborhood Watch Patrol',
    location: 'Elm Street Comm. Center',
    time: 'Tonight, 8:00 PM',
    description: 'Evening patrol to keep the neighborhood secure.',
    joined: false,
    coordinates: { lat: 40.7812, lng: -73.9665 }
  },
];

export function useCommunity() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CommunityEvent[];
          // Defer state update to avoid synchronous setState in effect warnings
          setTimeout(() => {
            if (parsed.length > 0) {
              setEvents(parsed);
            } else {
              setEvents(MOCK_EVENTS);
            }
          }, 0);
        } catch {
          setTimeout(() => setEvents(MOCK_EVENTS), 0);
        }
      } else {
        setTimeout(() => setEvents(MOCK_EVENTS), 0);
      }
      setTimeout(() => setIsLoaded(true), 0);
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  }, [events, isLoaded]);

  const addEvent = useCallback((eventData: Omit<CommunityEvent, 'id' | 'joined'>) => {
    const newEvent: CommunityEvent = {
      ...eventData,
      id: Math.random().toString(36).substring(2, 9),
      joined: true, // Auto-join an event you create
    };
    setEvents((prev) => [newEvent, ...prev]);
  }, []);

  const joinEvent = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, joined: true } : e))
    );
  }, []);

  /** Remove an event from the list by id */
  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    events,
    addEvent,
    joinEvent,
    removeEvent,
    isLoaded,
  };
}

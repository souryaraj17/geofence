import React, { useState } from 'react';
import { CommunityEvent, GeoPosition } from '../types';
import EventCard from './EventCard';
import { geocodeLocation } from '../utils/geocode';

interface CommunityOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userPosition: GeoPosition | null;
  events: CommunityEvent[];
  addEvent: (eventData: Omit<CommunityEvent, 'id' | 'joined'>) => void;
  joinEvent: (id: string) => void;
  isLoaded: boolean;
  /** Called with the event the user wants to see on the map */
  onSelectEvent: (event: CommunityEvent) => void;
  /** Remove an event from the list */
  removeEvent: (id: string) => void;
}

export default function CommunityOverlay({
  isOpen,
  onClose,
  userPosition,
  events,
  addEvent,
  joinEvent,
  isLoaded,
  onSelectEvent,
  removeEvent,
}: CommunityOverlayProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'create'>('events');

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  // Geocoding state
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !time || !description) return;

    setIsGeocoding(true);
    setGeocodeError('');

    // Try to geocode the location text → lat/lng
    const coords = await geocodeLocation(location);

    if (!coords) {
      // Non-blocking: warn the user but still allow submission
      setGeocodeError('Could not find coordinates for this location. Event will not appear on map.');
    }

    addEvent({
      title,
      location,
      time,
      description,
      // Use geocoded coords if found, else fall back to userPosition, else undefined
      coordinates: coords ?? (userPosition ?? undefined),
    });

    // Reset form and switch to events tab
    setTitle('');
    setLocation('');
    setTime('');
    setDescription('');
    setGeocodeError('');
    setIsGeocoding(false);
    setActiveTab('events');
  };

  /** Join event and fly map to it */
  const handleJoin = (id: string) => {
    joinEvent(id);
    const ev = events.find((e) => e.id === id);
    if (ev?.coordinates) onSelectEvent(ev);
  };

  /** View on Map: close overlay and fly map to event */
  const handleSelectEvent = (ev: CommunityEvent) => {
    onSelectEvent(ev);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-Up Panel */}
      <div className="relative w-full h-[85vh] bg-gray-50 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.4s_ease-out]">

        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-white border-b border-gray-100 shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Community</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white px-2 pt-2 shadow-sm shrink-0">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'events' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'
            }`}
          >
            Local Events
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'create' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'
            }`}
          >
            Create Event
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="pb-12">
              {!isLoaded ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">No local events found.</p>
              ) : (
                events.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onJoin={handleJoin}
                    onSelect={handleSelectEvent}
                    onRemove={removeEvent}
                  />
                ))
              )}
            </div>
          )}

          {/* Create Event Tab */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="flex flex-col gap-4 pb-12">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Event Title</label>
                <input
                  required type="text" value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Neighborhood Patrol"
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Location</label>
                <input
                  required type="text" value={location}
                  onChange={(e) => { setLocation(e.target.value); setGeocodeError(''); }}
                  placeholder="e.g. Central Park, New York"
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-gray-900 font-medium"
                />
                {geocodeError && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {geocodeError}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Time</label>
                <input
                  required type="text" value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. Tomorrow, 6:00 PM"
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                <textarea
                  required value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this event about?"
                  rows={4}
                  className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white resize-none text-gray-900 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isGeocoding}
                className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGeocoding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Finding location…
                  </>
                ) : 'Publish Event'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

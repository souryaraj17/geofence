import React from 'react';
import { CommunityEvent } from '../types';

interface EventCardProps {
  event: CommunityEvent;
  onJoin: (id: string) => void;
  /** Called when "View on Map" is tapped — closes overlay and flies map to event */
  onSelect?: (event: CommunityEvent) => void;
  /** Called to permanently remove this event */
  onRemove?: (id: string) => void;
}

/** Opens Google Maps navigation to the event's coordinates in a new tab */
function openNavigation(event: CommunityEvent) {
  if (!event.coordinates) return;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${event.coordinates.lat},${event.coordinates.lng}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function EventCard({ event, onJoin, onSelect, onRemove }: EventCardProps) {
  const hasCoords = !!event.coordinates;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col gap-2 transition-shadow hover:shadow-md">
      {/* Title row with discard button */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-bold text-gray-800 flex-1">{event.title}</h3>
        {onRemove && (
          <button
            onClick={() => onRemove(event.id)}
            title="Discard event"
            className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0 mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center text-sm text-gray-500 gap-1 mt-1">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{event.location}</span>
      </div>

      <div className="flex items-center text-sm text-gray-500 gap-1">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{event.time}</span>
      </div>

      <p className="text-gray-600 mt-2 text-sm">{event.description}</p>

      {/* Primary action: Join */}
      <button
        onClick={() => onJoin(event.id)}
        disabled={event.joined}
        className={`mt-3 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 w-full
          ${event.joined
            ? 'bg-green-100 text-green-700 cursor-not-allowed'
            : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-[0.98]'
          }
        `}
      >
        {event.joined ? '✓ Joined' : 'Join Event'}
      </button>

      {/* Secondary actions row — only shown when coordinates are available */}
      {hasCoords && (
        <div className="flex gap-2 mt-1">
          {/* View on Map: closes overlay, flies map to event */}
          {onSelect && (
            <button
              onClick={() => onSelect(event)}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View on Map
            </button>
          )}

          {/* Navigate: opens Google Maps directions */}
          <button
            onClick={() => openNavigation(event)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Navigate →
          </button>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { GeofenceStatus } from '../types';

interface StatusBadgeProps {
  status: GeofenceStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'unknown') return null;

  const isInside = status === 'inside';

  return (
    <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${isInside ? 'scale-100' : 'scale-110'}`}>
      <div 
        className={`px-6 py-3 rounded-full shadow-lg backdrop-blur-md font-bold text-sm tracking-wide flex items-center gap-2 border
          ${isInside 
            ? 'bg-green-500/20 text-green-700 border-green-500/30' 
            : 'bg-red-500/90 text-white border-red-600 shadow-[0_4px_30px_rgba(239,68,68,0.5)] animate-pulse'
          }
        `}
      >
        {isInside ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Inside Safe Zone
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-red-200 animate-ping" />
            Outside Safe Zone 🚨
          </>
        )}
      </div>
    </div>
  );
}

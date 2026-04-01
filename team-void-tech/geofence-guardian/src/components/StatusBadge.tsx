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
        className={`px-6 py-3 rounded-full shadow-2xl backdrop-blur-xl font-black text-xs uppercase tracking-widest flex items-center gap-3 border-2 transition-all duration-500 hover:scale-105 active:scale-95
          ${isInside
            ? 'bg-gradient-to-r from-emerald-400/20 to-teal-400/20 text-emerald-700 border-emerald-400/50 shadow-emerald-500/20'
            : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-rose-400 shadow-[0_8px_32px_rgba(244,63,94,0.5)] animate-pulse'
          }
        `}
      >
        {isInside ? (
          <>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="drop-shadow-sm">VIBING SAFELY</span>
          </>
        ) : (
          <>
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)] animate-ping" />    
            <span className="drop-shadow-md">OUT OF BOUNDS 🚨</span>
          </>
        )}
      </div>
    </div>
  );
}

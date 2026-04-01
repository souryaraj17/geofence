import React from 'react';

interface ControlsProps {
  onSetSafeZone: () => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  isTracking: boolean;
  onToggleTracking: () => void;
  canSetSafeZone: boolean;
}

export default function Controls({
  onSetSafeZone,
  radius,
  onRadiusChange,
  isTracking,
  onToggleTracking,
  canSetSafeZone,
}: ControlsProps) {
  return (
    <div className="absolute bottom-5 left-0 right-0 px-4 z-40 max-w-lg mx-auto">
      <div className="bg-white/95 backdrop-blur-xl rounded-[1.25rem] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100">
        
        {/* Set Safe Zone Button */}
        <button
          onClick={onSetSafeZone}
          disabled={!canSetSafeZone}
          className={`w-full py-3 rounded-xl font-bold text-[15px] mb-4 transition-all duration-200 active:scale-[0.98] ${
            canSetSafeZone
              ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {canSetSafeZone ? 'Set Safe Zone Here' : 'Tap Map to Set Zone'}       
        </button>

        {/* Radius Slider */}
        <div className="mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-700 font-semibold text-sm">Radius</label>
            <span className="text-slate-900 font-bold bg-white px-2.5 py-0.5 rounded-lg text-xs shadow-sm border border-slate-200">
              {radius}m
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900 transition-colors"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1.5">
            <span>50m</span>
            <span>500m</span>
          </div>
        </div>

        {/* Tracking Toggle */}
        <div className="flex justify-center">
          <button
            onClick={onToggleTracking}
            className={`py-2 px-5 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200 flex items-center gap-2 ${
              isTracking
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isTracking ? "bg-rose-500 animate-pulse" : "bg-slate-300"}`} />
            {isTracking ? 'Stop Tracking' : 'Start Live Tracking'}
          </button>
        </div>

      </div>
    </div>
  );
}

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
    <div className="absolute bottom-6 left-0 right-0 px-4">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20">
        
        {/* Set Safe Zone Button */}
        <button
          onClick={onSetSafeZone}
          disabled={!canSetSafeZone}
          className={`w-full py-4 rounded-xl font-bold text-lg mb-6 transition-all duration-300
            ${canSetSafeZone 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] active:scale-95' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Set Safe Zone Here
        </button>

        {/* Radius Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-700 font-semibold">Safe Zone Radius</label>
            <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full text-sm">
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>50m</span>
            <span>500m</span>
          </div>
        </div>

        {/* Tracking Toggle */}
        <div className="flex justify-center mt-2">
          <button
            onClick={onToggleTracking}
            className={`py-1.5 px-4 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5
              ${isTracking 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            {isTracking ? 'Stop Live Tracking' : 'Start Live Tracking'}
          </button>
        </div>

      </div>
    </div>
  );
}

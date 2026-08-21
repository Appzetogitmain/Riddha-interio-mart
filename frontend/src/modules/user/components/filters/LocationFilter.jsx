import React, { useState } from 'react';

const LocationFilter = ({ selectedDistance, selectedRegion, userLat, userLon, distanceOptions, regionOptions, onChange, isLoading }) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getUserLocation = () => {
    setIsGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onChange('5', undefined, latitude, longitude);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsGettingLocation(false);
          alert('Unable to get your location. Please enable location permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={getUserLocation}
          disabled={isLoading || isGettingLocation}
          className="w-full py-2 px-3 bg-warm-sand/20 hover:bg-warm-sand/30 text-warm-sand font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {isGettingLocation ? 'Getting Location...' : '📍 Use My Location'}
        </button>

        {userLat && userLon && (
          <div className="text-xs text-deep-espresso/60 px-2 py-1 mt-2 bg-soft-oatmeal/10 rounded">
            Location enabled for distance filtering
          </div>
        )}

        <div className="mt-3 space-y-2">
          {(distanceOptions || []).map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value, selectedRegion, userLat, userLon)}
              disabled={isLoading || !userLat}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
                selectedDistance === option.value
                  ? 'bg-warm-sand/20 text-warm-sand'
                  : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-soft-oatmeal/20 pt-3">
        <h4 className="text-xs font-semibold text-deep-espresso/60 mb-2">By Region</h4>
        <div className="space-y-2">
          <button
            onClick={() => onChange(selectedDistance, undefined, userLat, userLon)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedRegion
                ? 'bg-warm-sand/20 text-warm-sand'
                : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
            }`}
            disabled={isLoading}
          >
            Pan India
          </button>
          {(regionOptions || []).filter(o => o.value !== 'pan_india').map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(selectedDistance, option.value, userLat, userLon)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRegion === option.value
                  ? 'bg-warm-sand/20 text-warm-sand'
                  : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
              }`}
              disabled={isLoading}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationFilter;

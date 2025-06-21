import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapPickerProps {
  value: { lat: number; lon: number } | null;
  onChange: (coords: { lat: number; lon: number }) => void;
  showSearch?: boolean;
}

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange, showSearch }) => {
  // Default to somewhere central if no value
  const center: [number, number] = value ? [value.lat, value.lon] : [20, 78]; // India center
  const [search, setSearch] = React.useState('');
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [suggestLoading, setSuggestLoading] = React.useState(false);
  const mapRef = React.useRef<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: search }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Geocoding failed');
      if (data.lat && data.lon) {
        onChange({ lat: data.lat, lon: data.lon });
      } else {
        setSearchError('No location found.');
      }
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSearchError('');
    setSuggestions([]);
  };

  const handleSearchSuggestions = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim().length >= 3) {
      setSuggestLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err: any) {
        setSearchError('Failed to fetch suggestions');
      } finally {
        setSuggestLoading(false);
      }
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        onChange({ lat: e.latlng.lat, lon: e.latlng.lng });
      },
    });
    return value ? <Marker position={[value.lat, value.lon]} icon={markerIcon} /> : null;
  }

  function FlyToLocation({ coords }: { coords: { lat: number; lon: number } | null }) {
    const map = useMap();
    React.useEffect(() => {
      if (coords) {
        map.setView([coords.lat, coords.lon], 15, { animate: true });
      }
    }, [coords, map]);
    return null;
  }

  // Reverse geocode when user picks a location on the map (not via search)
  React.useEffect(() => {
    if (value && !searchLoading && !suggestLoading && (!search || search !== value.lat + ',' + value.lon)) {
      // Only reverse geocode if searchbar doesn't already match the coordinates
      const fetchName = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${value.lat}&lon=${value.lon}`);
          const data = await res.json();
          if (data && data.display_name) {
            setSearch(data.display_name);
          } else {
            setSearch(`${value.lat},${value.lon}`);
          }
        } catch {
          setSearch(`${value.lat},${value.lon}`);
        }
      };
      fetchName();
    }
  }, [value]);

  return (
    <div aria-label="Map Picker" role="region" tabIndex={0}>
      {showSearch && (
        <div className="p-2 bg-white border-b">
          <input
            type="text"
            className="input input-bordered flex-1 text-sm w-full"
            placeholder="Search location..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSuggestions}
            aria-label="Search location"
            autoComplete="off"
          />
          {suggestLoading && <div className="text-xs text-gray-500 mt-1">Loading suggestions...</div>}
          {suggestions.length > 0 && (
            <ul className="bg-white border rounded shadow mt-1 max-h-40 overflow-y-auto z-50 relative">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                  onClick={() => {
                    onChange({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
                    setSearch(`${s.display_name}`);
                    setSuggestions([]);
                  }}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onChange({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
                      setSearch(`${s.display_name}`);
                      setSuggestions([]);
                    }
                  }}
                  aria-label={`Select ${s.display_name}`}
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
          {searchError && <div className="text-xs text-red-600 mt-1">{searchError}</div>}
        </div>
      )}
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: 300, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
        <FlyToLocation coords={value} />
      </MapContainer>
    </div>
  );
};

export default MapPicker;

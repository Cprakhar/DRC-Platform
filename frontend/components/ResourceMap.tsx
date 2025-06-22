import React, { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '../context/UserContext';
import L from 'leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });
const SelectedMarkerPopupOpener = dynamic(() => import('./SelectedMarkerPopupOpener'), { ssr: false });

interface Resource {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
}

interface ResourceMapProps {
  lat: number;
  lon: number;
  disasterId: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const RESOURCE_TYPE_ICONS: Record<string, string> = {
  hospital: '/resource-icons/hospital.png',
  shelter: '/resource-icons/shelter.png',
  pharmacy: '/resource-icons/pharmacy.png',
  fire_station: '/resource-icons/fire_station.png',
  police: '/resource-icons/police.png',
  other: '/resource-icons/other.png',
};

const ResourceMap: React.FC<ResourceMapProps> = ({ lat, lon, disasterId }) => {
  const { user } = useUser();
  const [resources, setResources] = useState<Resource[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const RESOURCES_PER_PAGE = 10;
  const mapRef = useRef<L.Map | null>(null);

  // Helper to parse WKB Point (hex string) to [lon, lat]
  function parseWKBPoint(wkb: string): [number, number] | undefined {
    // Only supports 2D points, little endian (01) or big endian (00)
    if (!wkb || typeof wkb !== 'string' || wkb.length < 42) return undefined;
    // Remove 0x if present
    if (wkb.startsWith('0x')) wkb = wkb.slice(2);
    // WKB: 01 (little endian) or 00 (big endian), 0101000020E6100000...
    // We'll only handle little endian (01) for now
    if (wkb.slice(0, 2) !== '01') return undefined;
    // lon: bytes 10-25, lat: bytes 26-41 (8 bytes each, little endian)
    const lonHex = wkb.slice(18, 34);
    const latHex = wkb.slice(34, 50);
    // Convert hex to float64
    function hexToFloatLE(hex: string) {
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      for (let i = 0; i < 8; i++) {
        view.setUint8(i, parseInt(hex.slice(i * 2, i * 2 + 2), 16));
      }
      return view.getFloat64(0, true);
    }
    const lon = hexToFloatLE(lonHex);
    const lat = hexToFloatLE(latHex);
    return [lon, lat];
  }

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/resources/${disasterId}/resources?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch resources');
        // Map GeoJSON location to flat lat/lon fields, fallback to WKB parsing
        const resources = (data.resources || []).map((r: any) => {
          let latVal, lonVal;
          if (r.location && typeof r.location === 'object' && Array.isArray(r.location.coordinates)) {
            lonVal = r.location.coordinates[0];
            latVal = r.location.coordinates[1];
          } else if (typeof r.location === 'string') {
            const coords = parseWKBPoint(r.location);
            if (coords) {
              lonVal = coords[0];
              latVal = coords[1];
            }
          }
          return {
            ...r,
            lat: latVal,
            lon: lonVal,
          };
        });
        setResources(resources);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [lat, lon, disasterId]);

  // Only create the icon on the client
  const disasterIcon = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet');
    return new L.Icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: [41, 41]
    });
  }, []);

  // Memoize icons for resource types
  const resourceIcons = useMemo(() => {
    if (typeof window === 'undefined') return {};
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet');
    const icons: Record<string, any> = {};
    for (const type of Object.keys(RESOURCE_TYPE_ICONS)) {
      icons[type] = new L.Icon({
        iconUrl: RESOURCE_TYPE_ICONS[type],
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -24],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41],
      });
    }
    return icons;
  }, []);

  // Get unique types for filter dropdown
  const resourceTypes = useMemo(() => {
    const types = Array.from(new Set(resources.map(r => r.type)));
    return types.filter(Boolean).sort();
  }, [resources]);

  // Filtered and searched resources
  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesType = !typeFilter || r.type === typeFilter;
      const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [resources, typeFilter, search]);

  const paginatedResources = useMemo(() => {
    const start = (page - 1) * RESOURCES_PER_PAGE;
    return filteredResources.slice(start, start + RESOURCES_PER_PAGE);
  }, [filteredResources, page]);
  const totalPages = Math.ceil(filteredResources.length / RESOURCES_PER_PAGE);

  // Store refs for each marker
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // Scroll/zoom to marker and open popup when selected
  useEffect(() => {
    if (!selected) {
      return;
    }
    const selectedResource = paginatedResources.find(r => r.id === selected);
    if (
      selectedResource &&
      mapRef.current &&
      typeof selectedResource.lat === 'number' &&
      typeof selectedResource.lon === 'number' &&
      !isNaN(selectedResource.lat) &&
      !isNaN(selectedResource.lon)
    ) {
      mapRef.current.setView([selectedResource.lat, selectedResource.lon], 16, { animate: true });
      setOpenPopupId(selectedResource.id);
    }
  }, [selected, paginatedResources]);

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold mb-6" tabIndex={0} aria-label="Nearby Resources">Nearby Resources</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 w-full bg-white rounded-2xl shadow-md flex flex-col sticky top-[72px] max-h-[80vh] z-10" aria-label="Resource List" role="region" tabIndex={0}>
          {/* Filter and search controls row */}
          <div className="sticky top-0 z-30">
            <div className="bg-white rounded-t-2xl px-4 pt-4 pb-3 flex flex-col gap-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search resources..."
                className="input input-bordered w-full text-sm"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                aria-label="Search resources"
              />
              <select
                className="input input-bordered w-full text-sm bg-white"
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                aria-label="Filter by resource type"
              >
                <option value="">All Types</option>
                {resourceTypes.map(type => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Resource list with scrollable area */}
          <ul className="divide-y divide-gray-200 flex-1 overflow-y-auto mb-0">
            {paginatedResources.map(r => (
              <li
                key={r.id}
                className={`py-3 px-5 flex flex-col gap-1 rounded cursor-pointer transition-colors duration-150 ${selected === r.id ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                onClick={() => { setSelected(r.id); setOpenPopupId(r.id); }}
                tabIndex={0}
                aria-label={`Resource: ${r.name}, Type: ${r.type}`}
              >
                <div className="font-bold text-gray-700 flex items-center justify-between">
                  {r.name}
                </div>
                <div className="text-xs text-gray-600">{r.type}</div>
              </li>
            ))}
          </ul>
          {/* Pagination controls row */}
          {totalPages > 1 && (
            <div className="bg-white rounded-b-2xl px-4 pb-3 pt-3 flex gap-2 justify-center border-t border-gray-200">
              <button
                className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="px-2 py-1">Page {page} of {totalPages}</span>
              <button
                className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
        <div className="md:w-2/3 w-full h-[80vh] sticky top-[72px] rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white z-0 md:ml-6">
          <div className="relative w-full h-full">
            {/* Reset Map Button */}
            <button
              className="absolute top-4 right-4 z-[1000] bg-white/90 border border-gray-300 rounded px-3 py-1 text-sm font-medium shadow hover:bg-blue-50 transition"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.setView([lat, lon], 13);
                }
              }}
            >
              Reset Map
            </button>
            <MapContainer
              center={[lat, lon]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              // @ts-ignore
              whenReady={event => {
                mapRef.current = event.target;
              }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {/* 10km radius circle */}
              <Circle center={[lat, lon]} radius={10000} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.08, weight: 2 }} />
              {/* Disaster location pin */}
              {disasterIcon && (
                <Marker position={[lat, lon]} icon={disasterIcon}>
                  <Popup>
                    <div>
                      <div className="font-semibold text-red-600">Disaster Location</div>
                      <div className="text-xs text-gray-600">Center of affected area</div>
                    </div>
                  </Popup>
                </Marker>
              )}
              {/* Resource markers */}
              {paginatedResources.filter(r => typeof r.lat === 'number' && typeof r.lon === 'number').map(r => {
                const typeKey = (r.type || 'other').toLowerCase();
                const icon = resourceIcons[typeKey] || resourceIcons['other'];
                const isSelected = openPopupId === r.id;
                return (
                  <Marker
                    key={r.id}
                    position={[r.lat, r.lon]}
                    icon={icon}
                    eventHandlers={{
                      popupclose: () => setOpenPopupId(null),
                    }}
                  >
                    <Popup>
                      <div>
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-xs text-gray-600">{r.type}</div>
                      </div>
                    </Popup>
                    {isSelected && <SelectedMarkerPopupOpener position={[r.lat, r.lon]} open={isSelected} />}
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResourceMap;

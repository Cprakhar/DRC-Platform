import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../context/UserContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const DisasterForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const { user } = useUser();
  const router = useRouter();

  const handleGeocode = async () => {
    setGeocoding(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: locationName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Geocoding failed');
      setLocationName(data.location || locationName);
      if (data.lat && data.lon) {
        setLocationCoords({ lat: data.lat, lon: data.lon });
      }
      setSuccess('Location geocoded!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (!locationCoords) throw new Error('Please geocode the location to get coordinates.');
      // Format location as WKT string: POINT(lon lat)
      const wktLocation = `POINT(${locationCoords.lon} ${locationCoords.lat})`;
      const payload = {
        title,
        location_name: locationName,
        location: wktLocation,
        tags,
        description,
        owner_id: user?.id
      };
      const res = await fetch(`${BACKEND_URL}/disasters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create disaster');
      setSuccess('Disaster created!');
      setTimeout(() => router.replace('/'), 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 max-w-xl mx-auto flex flex-col gap-4 mt-8">
      <h2 className="text-xl font-bold mb-2">Create Disaster</h2>
      <input
        className="input input-bordered w-full"
        type="text"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <div className="flex gap-2 items-center">
        <input
          className="input input-bordered w-full"
          type="text"
          placeholder="Location name or description"
          value={locationName}
          onChange={e => setLocationName(e.target.value)}
          required
        />
        <button
          type="button"
          className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 font-semibold"
          onClick={handleGeocode}
          disabled={geocoding}
        >
          {geocoding ? 'Geocoding...' : 'Geocode'}
        </button>
        {locationCoords && (
          <span className="text-xs text-green-700 ml-2">Lat: {locationCoords.lat}, Lon: {locationCoords.lon}</span>
        )}
      </div>
      <div>
        <input
          className="input input-bordered w-full"
          type="text"
          placeholder="Add tag and press Enter"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map(tag => (
            <span key={tag} className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-sm">{tag}</span>
          ))}
        </div>
      </div>
      <textarea
        className="input input-bordered w-full min-h-[80px]"
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        required
      />
      {error && <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded">{error}</div>}
      {success && <div className="bg-green-100 text-green-800 border-l-4 border-green-400 p-3 rounded">{success}</div>}
      <button
        className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 w-full font-semibold"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Disaster'}
      </button>
    </form>
  );
};

export default DisasterForm;

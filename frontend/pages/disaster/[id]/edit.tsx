import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useUser } from '../../../context/UserContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const DisasterEdit: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [disaster, setDisaster] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchDisaster = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/disasters/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch disaster');
        setDisaster(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDisaster();
  }, [id]);

  const isOwnerOrAdmin = user && disaster && (user.id === disaster.owner_id || user.role === 'admin');

  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (disaster) {
      setTitle(disaster.title || '');
      setLocationName(disaster.location_name || '');
      setTags(disaster.tags || []);
      setDescription(disaster.description || '');
      // Try to parse coordinates from WKT if present
      if (disaster.location && typeof disaster.location === 'string' && disaster.location.startsWith('POINT(')) {
        const match = disaster.location.match(/POINT\\(([-0-9.]+) ([-0-9.]+)\\)/);
        if (match) {
          setLocationCoords({ lon: parseFloat(match[1]), lat: parseFloat(match[2]) });
        }
      }
    }
  }, [disaster]);

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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      let location = disaster.location;
      if (locationCoords) {
        location = `POINT(${locationCoords.lon} ${locationCoords.lat})`;
      }
      const formData = new FormData();
      formData.append('title', title);
      formData.append('location_name', locationName);
      formData.append('location', location);
      formData.append('description', description);
      formData.append('owner_id', disaster.owner_id);
      tags.forEach(tag => formData.append('tags[]', tag));
      images.forEach(img => formData.append('images', img));
      const res = await fetch(`${BACKEND_URL}/disasters/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: user ? `Bearer ${user.token}` : ''
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update disaster');
      setSuccess('Disaster updated!');
      setTimeout(() => router.replace(`/disaster/${id}`), 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded">{error}</div></Layout>;
  if (!disaster) return <Layout><div>Disaster not found.</div></Layout>;
  if (!isOwnerOrAdmin) return <Layout><div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded">You do not have permission to edit this disaster.</div></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Edit Disaster</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 max-w-xl mx-auto flex flex-col gap-4">
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
            placeholder="Location name"
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
        <div>
          <label className="font-medium text-gray-700 mb-1 block">Upload Images (optional, max 3)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="file-input file-input-bordered w-full"
            max={3}
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {imagePreviews.map((src, i) => (
              <img key={i} src={src} alt="Preview" className="h-20 rounded border" />
            ))}
          </div>
        </div>
        {error && <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded">{error}</div>}
        {success && <div className="bg-green-100 text-green-800 border-l-4 border-green-400 p-3 rounded">{success}</div>}
        <button
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 w-full font-semibold"
          type="submit"
        >
          Update Disaster
        </button>
      </form>
    </Layout>
  );
};

export default DisasterEdit;

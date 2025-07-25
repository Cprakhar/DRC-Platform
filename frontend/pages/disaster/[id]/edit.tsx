import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useUser } from '../../../context/UserContext';
import dynamic from 'next/dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const MapPicker = dynamic(() => import('../../../components/MapPicker'), { ssr: false });

const DisasterEdit: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchDisaster = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/disasters/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch disaster');
        setTitle(data.title || '');
        setDescription(data.description || '');
        setTags(data.tags || []);
        setLocationName(data.location_name || '');
        if (data.location && data.location.coordinates) {
          setLocationCoords({ lat: data.location.coordinates[1], lon: data.location.coordinates[0] });
        }
        if (Array.isArray(data.images)) {
          setImagePreviews(data.images);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchDisaster();
  }, [id]);

  const handleMapChange = (coords: { lat: number; lon: number }) => {
    setLocationCoords(coords);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`)
      .then(res => res.json())
      .then(data => setLocationName(data.display_name || `${coords.lat},${coords.lon}`))
      .catch(() => setLocationName(`${coords.lat},${coords.lon}`));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      let coords = locationCoords;
      let locName = locationName;
      if (!coords) {
        const res = await fetch(`${BACKEND_URL}/geocode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Geocoding failed');
        if (data.lat && data.lon) {
          coords = { lat: data.lat, lon: data.lon };
          locName = data.location || `${data.lat},${data.lon}`;
        } else {
          throw new Error('Could not determine location. Please use the map or enter a valid location.');
        }
      }
      const wktLocation = `POINT(${coords.lon} ${coords.lat})`;
      const formData = new FormData();
      formData.append('title', title);
      formData.append('location', wktLocation);
      formData.append('location_name', locName);
      formData.append('description', description);
      formData.append('owner_id', user?.id || '');
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  if (error) return <Layout><div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded">{error}</div></Layout>;
  if (!id) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 max-w-5xl mx-auto flex flex-col md:flex-row gap-8 mt-8">
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-xl font-bold mb-2" tabIndex={0} aria-label="Edit Disaster">Edit Disaster</h2>
          <input
            className="input input-bordered w-full"
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            aria-label="Disaster Title"
          />
          <div>
            <input
              className="input input-bordered w-full"
              type="text"
              placeholder="Add tag and press Enter"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              aria-label="Add tag"
            />
            <div className="flex flex-wrap gap-2 mt-2" aria-label="Tags">
              {tags.map(tag => (
                <span key={tag} className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-sm cursor-pointer hover:bg-blue-200 transition" tabIndex={0} aria-label={`Remove tag: ${tag}`} onClick={() => setTags(tags.filter(t => t !== tag))} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setTags(tags.filter(t => t !== tag)); }} title="Click or press Enter/Space to remove tag">{tag}</span>
              ))}
            </div>
          </div>
          <textarea
            className="input input-bordered w-full min-h-[80px]"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            aria-label="Description"
          />
          <div>
            <label className="font-medium text-gray-700 mb-1 block" htmlFor="disaster-images">Upload Images (optional, max 3)</label>
            <input
              id="disaster-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file-input file-input-bordered w-full"
              max={3}
              aria-label="Upload images"
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {imagePreviews.map((src, i) => (
                <img key={i} src={src} alt={`Preview ${i + 1}`} className="h-20 rounded border" />
              ))}
            </div>
          </div>
          {error && (
            <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded transition-all duration-300 animate-fadeIn" role="alert" aria-live="assertive">{error}</div>
          )}
          {success && (
            <div className="bg-green-100 text-green-800 border-l-4 border-green-400 p-3 rounded transition-all duration-300 animate-fadeIn" role="status" aria-live="polite">{success}</div>
          )}
          <button
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 w-full font-semibold"
            type="submit"
            disabled={loading}
            aria-label="Update Disaster"
          >
            {loading ? 'Updating...' : 'Update Disaster'}
          </button>
        </div>
        <div className="w-full md:w-[400px] flex-shrink-0">
          <label className="font-medium text-gray-700 mb-1 block">Pinpoint Location on Map</label>
          <div className="rounded border overflow-hidden">
            <MapPicker value={locationCoords} onChange={handleMapChange} showSearch />
          </div>
          {locationCoords && (
            <div className="text-xs text-green-700 mt-1">Lat: {locationCoords.lat}, Lon: {locationCoords.lon}</div>
          )}
        </div>
      </form>
    </Layout>
  );
};

export default DisasterEdit;

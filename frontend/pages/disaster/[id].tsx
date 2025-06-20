import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import ResourceMap from '../../components/ResourceMap';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const DisasterDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [disaster, setDisaster] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalImg, setModalImg] = useState<string | null>(null);

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

  // Helper to extract coordinates from WKT string
  function getCoordsFromWKT(wkt: string): { lat: number; lon: number } | null {
    const match = wkt.match(/POINT\((-?\d+\.?\d*) (-?\d+\.?\d*)\)/);
    if (match) {
      return { lon: parseFloat(match[1]), lat: parseFloat(match[2]) };
    }
    return null;
  }

  let coords = null;
  if (disaster && typeof disaster.location_wkt === 'string' && disaster.location_wkt.startsWith('POINT(')) {
    coords = getCoordsFromWKT(disaster.location_wkt);
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this disaster? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/disasters/${disaster.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user ? `Bearer ${user.token}` : ''
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete disaster');
      router.replace('/');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded">{error}</div></Layout>;
  if (!disaster) return <Layout><div>Disaster not found.</div></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">{disaster.title}</h1>
      <div className="flex flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="mb-2 text-gray-700">{disaster.location_name}</div>
          <div className="mb-2 text-gray-600 text-sm">{disaster.description}</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {disaster.tags && disaster.tags.map((tag: string) => (
              <span key={tag} className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-sm">{tag}</span>
            ))}
          </div>
        </div>
        {disaster.images && disaster.images.length > 0 && (
          <div className="flex flex-row gap-2 flex-shrink-0 items-start">
            {disaster.images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                alt={`Disaster image ${i+1}`}
                className="h-32 rounded-lg border cursor-pointer hover:shadow-lg transition"
                onClick={() => setModalImg(img)}
              />
            ))}
          </div>
        )}
      </div>
      {modalImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setModalImg(null)}>
          <img src={modalImg} alt="Large preview" className="h-[75vh] w-[50vw] rounded-2xl shadow-2xl border-4 border-white" />
        </div>
      )}
      {/* Add edit/delete/report UI here if user is owner/admin */}
      {user && user.role === 'admin' && (
        <button
          className="bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 font-semibold mb-4"
          onClick={handleDelete}
        >
          Delete Disaster
        </button>
      )}
      {coords && (
        <div className="mt-8">
          <ResourceMap lat={coords.lat} lon={coords.lon} disasterId={disaster.id} />
        </div>
      )}
    </Layout>
  );
};

export default DisasterDetail;

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/router';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface Resource {
  id: string;
  disaster_id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
}

const ResourcesPage: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disasterId, setDisasterId] = useState('');
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [autoError, setAutoError] = useState('');

  // Move fetchResources outside useEffect for reuse
  const fetchResources = () => {
    if (!user) return;
    setLoading(true);
    setError('');
    fetch(`${BACKEND_URL}/resources`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Failed to fetch resources');
        setResources(data.resources);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const handleAutoPopulate = async () => {
    setAutoError('');
    setAutoPopulating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/resources/${disasterId}/auto-populate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to auto-populate resources');
      // Refresh resource list
      fetchResources();
    } catch (err: any) {
      setAutoError(err.message);
    } finally {
      setAutoPopulating(false);
    }
  };

  const handleDeleteResource = async (rid: string, disaster_id: string) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/disasters/${disaster_id}/resources/${rid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user ? `Bearer ${user.token}` : ''
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete resource');
      setResources(r => r.filter(res => res.id !== rid));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Resource Management</h1>
      <div className="mb-4 flex items-center space-x-2">
        <input
          className="input input-bordered"
          type="text"
          placeholder="Disaster ID"
          value={disasterId}
          onChange={e => setDisasterId(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white rounded px-3 py-1"
          onClick={handleAutoPopulate}
          disabled={!disasterId || autoPopulating}
        >
          {autoPopulating ? 'Populating...' : 'Auto-populate Resources'}
        </button>
      </div>
      {autoError && <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-2 rounded mb-2">{autoError}</div>}
      {loading && <div>Loading resources...</div>}
      {error && <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded mb-2">{error}</div>}
      <table className="w-full bg-white rounded-xl shadow-md">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Type</th>
            <th className="p-2">Latitude</th>
            <th className="p-2">Longitude</th>
            <th className="p-2">Disaster ID</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map(r => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.type}</td>
              <td className="p-2">{r.lat}</td>
              <td className="p-2">{r.lon}</td>
              <td className="p-2">{r.disaster_id}</td>
              <td className="p-2">
                <button className="text-xs text-red-600 hover:underline" onClick={() => handleDeleteResource(r.id, r.disaster_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
};

export default ResourcesPage;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext'; // Adjust the import path as necessary

interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  created_at: string;
  owner_id: string;
  images?: string[];
}

export default function AdminReviewPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      // Not logged in: redirect to login with next param
      router.replace(`/login?next=/admin/review`);
    } else if (!loading && user && user.role !== 'admin') {
      // Logged in but not admin: redirect to home
      router.replace('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetch('/api/disasters/pending', {
        headers: {
          ...(user && user.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setDisasters(data);
          } else {
            setDisasters([]);
            setError('Failed to fetch pending disasters.');
          }
        })
        .catch(() => setError('Failed to fetch pending disasters.'));
    }
  }, [user]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id + action);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/disasters/${id}/${action}`, {
        method: 'POST',
        headers: {
          ...(user && user.token ? { Authorization: `Bearer ${user.token}` } : {}),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Action failed');
      setSuccess(`Disaster ${action}d successfully.`);
      setDisasters(disasters.filter(d => d.id !== id));
    } catch (e) {
      setError(`Failed to ${action} disaster.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Pending Disaster Review</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}
      {disasters.length === 0 ? (
        <div>No pending disasters.</div>
      ) : (
        <ul className="space-y-6">
          {disasters.map(disaster => (
            <li key={disaster.id} className="border rounded p-4 bg-white shadow">
              <h2 className="text-lg font-semibold">{disaster.title}</h2>
              <div className="text-gray-600 mb-2">{disaster.location_name}</div>
              <div className="mb-2">{disaster.description}</div>
              <div className="mb-2 text-sm text-gray-500">Tags: {disaster.tags.join(', ')}</div>
              <div className="mb-2 text-xs text-gray-400">Submitted: {new Date(disaster.created_at).toLocaleString()}</div>
              <div className="flex gap-2 mt-2">
                <button
                  className="bg-green-600 text-white px-4 py-1 rounded disabled:opacity-50"
                  disabled={actionLoading === disaster.id + 'approve'}
                  onClick={() => handleAction(disaster.id, 'approve')}
                >
                  {actionLoading === disaster.id + 'approve' ? 'Approving...' : 'Approve'}
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-1 rounded disabled:opacity-50"
                  disabled={actionLoading === disaster.id + 'reject'}
                  onClick={() => handleAction(disaster.id, 'reject')}
                >
                  {actionLoading === disaster.id + 'reject' ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  status: string;
  admin_action?: { user_id: string; timestamp: string } | null;
}

const PAGE_SIZE = 10;

export default function AdminReviewPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

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
      setError(null);
      fetch(`/api/disasters/recent?page=${page}&pageSize=${PAGE_SIZE}`, {
        headers: {
          ...(user && user.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.disasters)) {
            // Log all disasters for debugging
            console.log('[ADMIN REVIEW] All fetched disasters:', data.disasters);
            // Log admin_id for approved disasters
            data.disasters.forEach((d: any) => {
              if (d.status === 'approved') {
                console.log('[ADMIN REVIEW] Approved disaster:', d.id, 'admin_action:', d.admin_action);
              }
            });
            setDisasters(data.disasters);
            setHasMore(data.disasters.length === PAGE_SIZE);
          } else {
            setDisasters([]);
            setError('Failed to fetch recent disasters.');
          }
        })
        .catch(() => setError('Failed to fetch recent disasters.'));
    }
  }, [user, page]);

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
      // Refetch page after action
      setTimeout(() => setPage(1), 500);
    } catch (e) {
      setError(`Failed to ${action} disaster.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Recent Disaster Review</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}
      {disasters.length === 0 ? (
        <div>No recent disasters.</div>
      ) : (
        <ul className="space-y-6">
          {disasters.map(disaster => (
            <li key={disaster.id} className="border rounded p-4 bg-white shadow">
              <h2 className="text-lg font-semibold">{disaster.title}</h2>
              <div className="text-gray-600 mb-2">{disaster.location_name}</div>
              <div className="mb-2 text-sm text-gray-500">Tags: {disaster.tags.join(', ')}</div>
              <div className="mb-2 text-xs text-gray-400">Submitted: {new Date(disaster.created_at).toLocaleString()}</div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-100">
                  Status: {disaster.status.charAt(0).toUpperCase() + disaster.status.slice(1)}
                </span>
                {['approved', 'rejected'].includes(disaster.status) && disaster.admin_action && (
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                    {disaster.status === 'approved' && disaster.admin_action.user_id
                      ? `Admin ID: ${disaster.admin_action.user_id} (${new Date(disaster.admin_action.timestamp).toLocaleString()})`
                      : disaster.status === 'rejected' && disaster.admin_action.user_id
                      ? `Admin ID: ${disaster.admin_action.user_id} (${new Date(disaster.admin_action.timestamp).toLocaleString()})`
                      : null}
                  </span>
                )}
                <a
                  href={`/disaster/${disaster.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm ml-2"
                  style={{ marginLeft: 'auto' }}
                >
                  View
                </a>
              </div>
              {disaster.status === 'pending' && (
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
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-between mt-8">
        <button
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <button
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
        >
          Next
        </button>
      </div>
    </div>
  );
}

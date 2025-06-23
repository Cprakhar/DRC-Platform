import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext'; // Adjust the import path as necessary
import { io, Socket } from 'socket.io-client';

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

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
];

export default function AdminReviewPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!loading && !user) {
      // Not logged in: redirect to login with next param
      router.replace(`/login?next=/admin/review`);
    } else if (!loading && user && user.role !== 'admin') {
      // Logged in but not admin: redirect to home
      router.replace('/');
    }
  }, [user, loading, router]);

  // Fetch disasters logic as a function
  const fetchDisasters = () => {
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
            setDisasters(data.disasters);
            setHasMore(data.disasters.length === PAGE_SIZE);
          } else {
            setDisasters([]);
            setError('Failed to fetch recent disasters.');
          }
        })
        .catch(() => setError('Failed to fetch recent disasters.'));
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, [user, page]);

  // Setup socket connection
  useEffect(() => {
    if (user && user.role === 'admin') {
      const s = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
        transports: ['websocket'],
        withCredentials: true,
      });
      setSocket(s);
      s.on('disaster_updated', (data) => {
        fetchDisasters();
      });
      return () => {
        s.disconnect();
      };
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
      // Refetch page after action
      fetchDisasters();
    } catch (e) {
      setError(`Failed to ${action} disaster.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter disasters by status
  const filteredDisasters =
    statusFilter === 'all'
      ? disasters
      : disasters.filter((d) => d.status === statusFilter);

  // Divide disasters by status
  const pendingDisasters = disasters.filter(d => d.status === 'pending');
  const approvedDisasters = disasters.filter(d => d.status === 'approved');
  const rejectedDisasters = disasters.filter(d => d.status === 'rejected');

  // Helper to render a disaster item
  const renderDisasterItem = (disaster: Disaster, showActions = false) => (
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
      {showActions && disaster.status === 'pending' && (
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
  );

  if (loading || !user) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-48 bg-white border-r p-6 hidden md:block">
        <nav className="space-y-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={
                'w-full text-left px-3 py-2 rounded-lg font-medium ' +
                (statusFilter === opt.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700')
              }
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Recent Disaster Review</h1>
        <div className="mb-4 md:hidden">
          <select
            className="input input-bordered w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : filteredDisasters.length === 0 ? (
          <div className="text-gray-500">No disasters found.</div>
        ) : (
          <ul className="space-y-6">
            {filteredDisasters.map((disaster) =>
              renderDisasterItem(disaster, disaster.status === 'pending')
            )}
          </ul>
        )}
        {/* Pagination */}
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
      </main>
    </div>
  );
}

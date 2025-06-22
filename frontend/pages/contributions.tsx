import React, { useContext, useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import Link from 'next/link';
import clsx from 'clsx';
import Layout from '../components/Layout';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
];

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'approved'
      ? 'bg-green-100 text-green-700'
      : status === 'pending'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'rejected'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${color}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
  );
}

const ContributionsPage = () => {
  const { user } = useUser();
  const [statusFilter, setStatusFilter] = useState('all');
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch('/api/disasters?mine=1', {
        headers: {
            Authorization: user ? `Bearer ${user.token}` : ''
        },
        credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => {
        setContributions(data.disasters || []);
        setLoading(false);
      });
  }, [user]);

  const filtered =
    statusFilter === 'all'
      ? contributions
      : contributions.filter((d) => d.status === statusFilter);

  return (
    <Layout>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-48 bg-white border-r p-6 hidden md:block">
          <nav className="space-y-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-lg font-medium',
                  statusFilter === opt.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </nav>
        </aside>
        {/* Main content */}
        <main className="flex-1 max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">My Contributions</h1>
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
          {loading ? (
            <div>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500">No contributions found.</div>
          ) : (
            <ul className="space-y-4">
              {filtered.map((d) => (
                <li key={d.id} className="bg-white rounded-2xl shadow-md p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold">{d.title}</div>
                    <div className="text-sm text-gray-500">{new Date(d.created_at).toLocaleString()}</div>
                    <div className="mt-2">
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex gap-2">
                    <Link href={`/disaster/${d.id}`} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 text-sm">View</Link>
                    {d.status === 'pending' && (
                      <Link href={`/disaster/${d.id}/edit`} className="bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 text-sm">Edit</Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default ContributionsPage;

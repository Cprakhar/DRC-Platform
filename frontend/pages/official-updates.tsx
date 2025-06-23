import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Layout from '../components/Layout';

interface Update {
  title: string;
  pubdate: string;
  description: string;
  formdate: string;
  todate: string;
  link: string;
}

const OfficialUpdatesPage: React.FC = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch initial updates
  useEffect(() => {
    fetch('/api/official-updates')
      .then(res => res.json())
      .then(data => {
        setUpdates(data.updates || []);
        setLoading(false);
      });
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      transports: ['websocket'],
      withCredentials: true,
    });
    setSocket(s);
    s.on('official_updates', (data) => {
      setUpdates(data.updates || []);
    });
    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Official Disaster News (GDACS)</h1>
        {loading ? (
          <div>Loading...</div>
        ) : updates.length === 0 ? (
          <div>No updates found.</div>
        ) : (
          <ul className="space-y-6">
            {updates.map((u, i) => (
              <li key={i} className="border rounded p-4 bg-white shadow">
                <a href={u.link} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-700 hover:underline">
                  {u.title}
                </a>
                <div className="text-xs text-gray-500 mb-1">Published: {u.pubdate}</div>
                <div className="text-sm text-gray-700 mb-1">{u.description}</div>
                <div className="text-xs text-gray-400">From: {u.formdate} &nbsp; To: {u.todate}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
};

export default OfficialUpdatesPage;

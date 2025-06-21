import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import DisasterCard, { DisasterCardProps } from '../components/DisasterCard';
import { useUser } from '../context/UserContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const Home: React.FC = () => {
  const [disasters, setDisasters] = useState<DisasterCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();

  useEffect(() => {
    const fetchDisasters = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BACKEND_URL}/disasters`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch disasters');
        setDisasters(
          data.map((d: any) => ({
            id: d.id,
            title: d.title,
            location: d.location_name || (d.location && d.location.type === 'Point' && Array.isArray(d.location.coordinates)
              ? `Lat: ${d.location.coordinates[1]}, Lon: ${d.location.coordinates[0]}`
              : ''),
            tags: d.tags || [],
            createdAt: d.created_at,
            isOwner: user && user.id === d.owner_id
          }))
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDisasters();
  }, [user]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Disaster Dashboard</h1>
      {loading && <div>Loading disasters...</div>}
      {error && <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3 rounded mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disasters.map(disaster => (
          <DisasterCard key={disaster.id} {...disaster} />
        ))}
      </div>
      {!loading && disasters.length === 0 && !error && (
        <div className="text-gray-500 mt-8">No disasters found.</div>
      )}
    </Layout>
  );
};

export default Home;

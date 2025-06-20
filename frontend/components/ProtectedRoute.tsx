import { useUser } from '../context/UserContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (adminOnly && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, adminOnly, router]);

  if (!user || (adminOnly && user.role !== 'admin')) {
    return null;
  }
  return <>{children}</>;
};

export default ProtectedRoute;

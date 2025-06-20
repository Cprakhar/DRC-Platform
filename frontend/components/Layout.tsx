import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useUser } from '../context/UserContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useUser();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur shadow flex items-center px-6 py-3 border-b border-gray-200">
        <div className="font-bold text-xl flex-1 text-blue-700 tracking-tight">Disaster Response</div>
        <div className="space-x-4 flex items-center">
          <Link href="/" passHref legacyBehavior>
            <a className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-blue-50">Dashboard</a>
          </Link>
          <Link href="/official-updates" passHref legacyBehavior>
            <a className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-blue-50">Official Updates</a>
          </Link>
          <Link href="/verify-image" passHref legacyBehavior>
            <a className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-blue-50">Verify Image</a>
          </Link>
          {user && (
            <Link href="/create" passHref legacyBehavior>
              <a className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-blue-50">Create Disaster</a>
            </Link>
          )}
          {!user && (
            <>
              <Link href="/login" passHref legacyBehavior>
                <a className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1">Login</a>
              </Link>
              <Link href="/register" passHref legacyBehavior>
                <a className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1">Register</a>
              </Link>
            </>
          )}
          {user && user.role === 'admin' && (
            <Link href="/resources" passHref legacyBehavior>
              <a className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-blue-50">Resources</a>
            </Link>
          )}
          {user && (
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-sm text-gray-700 font-semibold">{user.username}</span>
              <span className={`inline-block bg-green-100 text-green-700 rounded-full px-2 py-1 text-xs ml-1 ${user.role === 'admin' ? 'border border-green-400' : ''}`}>{user.role}</span>
              <button onClick={logout} className="ml-2 bg-gray-200 text-gray-800 rounded-lg px-3 py-1 hover:bg-gray-300 text-xs font-semibold">Logout</button>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;

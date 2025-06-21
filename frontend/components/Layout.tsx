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
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur shadow flex items-center px-6 py-3 border-b border-gray-200" role="navigation" aria-label="Main Navigation">
        <div className="font-bold text-xl flex-1 text-blue-700 tracking-tight" tabIndex={0} aria-label="Disaster Response Home">Disaster Response</div>
        <div className="space-x-4 flex items-center">
          <Link href="/" passHref legacyBehavior>
            <a className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-blue-50" aria-label="Dashboard">Dashboard</a>
          </Link>
          <Link href="/official-updates" passHref legacyBehavior>
            <a className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-blue-50" aria-label="Official Updates">Official Updates</a>
          </Link>
          {user && (
            <Link href="/create" passHref legacyBehavior>
              <a className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-blue-50" aria-label="Create Disaster">Create Disaster</a>
            </Link>
          )}
          {!user && (
            <>
              <Link href="/login" passHref legacyBehavior>
                <a className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1" aria-label="Login">Login</a>
              </Link>
              <Link href="/register" passHref legacyBehavior>
                <a className="text-gray-700 hover:text-blue-600 font-medium px-2 py-1" aria-label="Register">Register</a>
              </Link>
            </>
          )}
          {user && user.role === 'admin' && (
            <Link href="/resources" passHref legacyBehavior>
              <a className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150 px-2 py-1 rounded-lg hover:bg-blue-50" aria-label="Resources">Resources</a>
            </Link>
          )}
          {user && (
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-sm text-gray-700 font-semibold" tabIndex={0} aria-label={`Logged in as ${user.username}`}>{user.username}</span>
              <span className={`inline-block bg-green-100 text-green-700 rounded-full px-2 py-1 text-xs ml-1 ${user.role === 'admin' ? 'border border-green-400' : ''}`} tabIndex={0} aria-label={`Role: ${user.role}`}>{user.role}</span>
              <button onClick={logout} className="ml-2 bg-gray-200 text-gray-800 rounded-lg px-3 py-1 hover:bg-gray-300 text-xs font-semibold" aria-label="Logout">Logout</button>
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

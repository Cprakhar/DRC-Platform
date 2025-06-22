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
          {user && (
            <div className="flex items-center space-x-2 ml-4 relative group">
              {/* Avatar with initial */}
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg shadow border-2 border-blue-200 select-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label={`User avatar for ${user.username}`}
                tabIndex={0}
                id="user-avatar"
              >
                {user.username?.charAt(0).toUpperCase()}
              </button>
              {/* Dropdown menu */}
              <div
                className="hidden group-focus-within:block group-hover:block absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2"
                style={{ minWidth: '180px', width: 'max-content', maxWidth: '320px' }}
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-semibold text-gray-800 whitespace-nowrap">{user.username}</div>
                  <div className={`inline-block bg-green-100 text-green-700 rounded-full px-2 py-1 text-xs mt-1 ${user.role === 'admin' ? 'border border-green-400' : ''}`}>{user.role}</div>
                </div>
                <Link href="/contributions" passHref legacyBehavior>
                  <a className="block px-4 py-2 text-gray-700 hover:bg-blue-50 w-full text-left whitespace-nowrap" aria-label="Contributions">Contributions</a>
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 whitespace-nowrap"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
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

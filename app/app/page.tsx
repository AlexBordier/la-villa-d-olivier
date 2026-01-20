'use client';

import { useUser } from './context/UserContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

export default function Home() {
  const { user, logout } = useUser();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏡</span>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Vacances entre Amis</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Connecté en tant que</p>
              <p className="font-semibold text-indigo-600">{user.username}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Changer
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <Dashboard />
      </main>
    </div>
  );
}
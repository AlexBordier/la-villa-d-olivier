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
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-100 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏡</span>
            <h1 className="text-lg font-black text-zinc-900 tracking-tighter hidden xs:block">La Villa d&apos;Olivier</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest leading-none">Membre</p>
              <p className="font-black text-indigo-600 text-sm tracking-tight">{user.username}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-xl bg-zinc-50 border border-zinc-100 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all active:scale-95"
              title="Changer de compte"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
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
'use client';

import { useUser } from '../context/UserContext';
import { UserCheck } from 'lucide-react';

export default function LoginScreen() {
  const { users, login, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white gap-6">
        <div className="w-16 h-16 border-[6px] border-zinc-100 border-t-indigo-600 rounded-full animate-spin shadow-inner"></div>
        <div className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em]">Ouverture des portes...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-20 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[40px] shadow-2xl shadow-zinc-200 mb-8 text-4xl border border-zinc-50">🏡</div>
          <p className="font-black text-zinc-400 uppercase text-[10px] tracking-[0.4em] leading-none">Connexion membre</p>
          <h1 className="text-5xl md:text-6xl font-black text-zinc-900 tracking-tighter leading-none">C&apos;est qui ?</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => login(user.id)}
              className="group relative flex flex-col items-center justify-center rounded-[40px] bg-white p-10 border border-zinc-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2 active:scale-95"
            >
              <div className="w-12 h-12 rounded-[18px] bg-zinc-50 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-all">
                <UserCheck className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
              </div>
              <span className="text-sm font-black text-zinc-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">
                {user.username}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-24 text-center text-zinc-300 font-black text-[9px] uppercase tracking-[0.6em]">
          La Villa d&apos;Olivier — 2026
        </p>
      </div>
    </div>
  );
}

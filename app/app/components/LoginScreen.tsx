'use client';

import { useUser } from '../context/UserContext';
import { UserCheck } from 'lucide-react';

export default function LoginScreen() {
  const { users, login, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white gap-4">
        <div className="w-12 h-12 border-4 border-zinc-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">Ouverture des portes...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-xl">
        <div className="mb-16 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-[32px] shadow-2xl shadow-zinc-200 mb-6 text-3xl">🏡</div>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter leading-none">C&apos;est qui ?</h1>
          <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-[0.3em]">Choisis ton prénom pour continuer</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => login(user.id)}
              className="group relative flex flex-col items-center justify-center rounded-[32px] bg-white p-8 border border-zinc-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-2 active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mb-3 group-hover:bg-indigo-600 transition-colors">
                <UserCheck className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
              </div>
              <span className="text-sm font-black text-zinc-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">
                {user.username}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-20 text-center text-zinc-300 font-black text-[8px] uppercase tracking-[0.5em]">
          Projet Vacances entre Amis — 2026
        </p>
      </div>
    </div>
  );
}
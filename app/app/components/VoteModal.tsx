'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Vote } from '../../lib/types';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVote: (rating: number, comment: string) => Promise<void>;
  existingVote: Vote | null;
  isVoting: boolean;
}

export default function VoteModal({ isOpen, onClose, onVote, existingVote, isVoting }: VoteModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (existingVote) {
      setRating(existingVote.rating);
      setComment(existingVote.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [existingVote, isOpen]);

  useEffect(() => {
    if (isOpen) {
      // On ne change rien si le body est déjà lock (par la modal de détails)
      // mais on assure le lock au cas où.
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        // Si la modal de détails est toujours là, on garde le lock
        // Sinon on remet à prevOverflow
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const ratings = [
    { value: 1, label: 'Non', icon: '❌', color: 'text-red-600 bg-red-50' },
    { value: 2, label: 'Bof', icon: '😕', color: 'text-orange-600 bg-orange-50' },
    { value: 3, label: 'Bien', icon: '🙂', color: 'text-blue-600 bg-blue-50' },
    { value: 4, label: 'Top', icon: '❤️', color: 'text-pink-600 bg-pink-50' },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-zinc-900 uppercase text-[10px] tracking-[0.2em]">Ton avis sur la villa</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="flex justify-between gap-2 mb-8">
          {ratings.map((r) => (
            <button
              key={r.value}
              onClick={() => setRating(r.value)}
              className={`flex-1 flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                rating === r.value 
                ? 'border-zinc-900 bg-zinc-900 text-white scale-110 shadow-lg' 
                : 'border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200'
              }`}
            >
              <span className="text-2xl mb-1">{r.icon}</span>
              <span className={`text-[7px] font-black uppercase ${rating === r.value ? 'text-white' : 'text-zinc-400'}`}>{r.label}</span>
            </button>
          ))}
        </div>

        <textarea
          placeholder="Pourquoi ce choix ? (facultatif)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-zinc-50 rounded-2xl p-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 h-32 resize-none transition-all mb-6 shadow-inner border border-transparent"
        />

        <button
          onClick={() => onVote(rating, comment)}
          disabled={isVoting || rating === 0}
          className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-zinc-800 disabled:opacity-50 active:scale-95 transition-all"
        >
          {isVoting ? 'Enregistrement...' : 'Valider mon avis'}
        </button>
      </div>
    </div>
  );
}

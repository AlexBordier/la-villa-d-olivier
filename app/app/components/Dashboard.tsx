'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { HouseWithVotes } from '../../lib/types';
import HouseCard from './HouseCard';
import dynamic from 'next/dynamic';
import { LayoutGrid, Map as MapIcon, Plus } from 'lucide-react';
import AddHouseModal from './AddHouseModal';
import HouseDetailsModal from './HouseDetailsModal';

const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 rounded-[40px] text-zinc-300 font-black uppercase text-xs tracking-widest">Chargement de la carte...</div>
});

export default function Dashboard() {
  const [houses, setHouses] = useState<HouseWithVotes[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<HouseWithVotes | null>(null);

  const fetchHouses = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('houses').select('*, votes (*)').order('created_at', { ascending: false });
      if (error) throw error;
      const formattedHouses: HouseWithVotes[] = (data || []).map((h: any) => {
        const votes = h.votes || [];
        const totalRating = votes.reduce((acc: number, v: any) => acc + v.rating, 0);
        return { ...h, votes, avg_rating: votes.length > 0 ? totalRating / votes.length : 0, vote_count: votes.length } as HouseWithVotes;
      });
      setHouses(formattedHouses);
      if (selectedHouse) {
          const updatedSelected = formattedHouses.find(h => h.id === selectedHouse.id);
          if (updatedSelected) setSelectedHouse(updatedSelected);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedHouse]);

  useEffect(() => {
    fetchHouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-12">
      <AddHouseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchHouses} />
      <HouseDetailsModal house={selectedHouse} isOpen={!!selectedHouse} onClose={() => setSelectedHouse(null)} onUpdate={fetchHouses} />

      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter">Nos propositions</h2>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-8 h-[2px] bg-indigo-600"></span>
            {houses.length} villas trouvées
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-inner">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-white text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <MapIcon className="w-4 h-4" /> Carte
            </button>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-zinc-200 hover:bg-indigo-600 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Proposer
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
           <div className="w-12 h-12 border-4 border-zinc-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em]">Chargement...</span>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {houses.length > 0 ? (
                houses.map((house) => <HouseCard key={house.id} house={house} onClick={() => setSelectedHouse(house)} />)
              ) : (
                <div className="col-span-full py-40 flex flex-col items-center border-4 border-dashed border-zinc-100 rounded-[60px]">
                   <span className="text-4xl mb-6">🏝️</span>
                   <p className="text-zinc-400 font-black uppercase text-[10px] tracking-[0.3em]">Aucune proposition pour le moment</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[75vh] w-full rounded-[60px] overflow-hidden border border-zinc-100 shadow-2xl relative shadow-zinc-200">
               <MapComponent houses={houses} onMarkerClick={(h) => setSelectedHouse(h)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { HouseWithVotes } from '../../lib/types';
import HouseCard from './HouseCard';
import dynamic from 'next/dynamic';
import { LayoutGrid, Map as MapIcon, Plus, Home } from 'lucide-react';
import AddHouseModal from './AddHouseModal';
import HouseDetailsModal from './HouseDetailsModal';
import TopHouses from './TopHouses';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-50 rounded-[40px] text-zinc-300 font-black uppercase text-[10px] tracking-widest">Chargement de la carte...</div>
});

export default function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
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
      
      // Gérer la sélection initiale via URL
      const houseIdFromUrl = searchParams.get('house');
      if (houseIdFromUrl) {
        const houseToSelect = formattedHouses.find(h => h.id === houseIdFromUrl);
        if (houseToSelect) setSelectedHouse(houseToSelect);
      }

      if (selectedHouse) {
          const updatedSelected = formattedHouses.find(h => h.id === selectedHouse.id);
          if (updatedSelected) setSelectedHouse(updatedSelected);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedHouse, searchParams]);

  useEffect(() => {
    fetchHouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour l'URL quand la sélection change
  const handleSelectHouse = (house: HouseWithVotes | null) => {
    setSelectedHouse(house);
    const params = new URLSearchParams(searchParams);
    if (house) {
      params.set('house', house.id);
    } else {
      params.delete('house');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-20 pb-32">
      <AddHouseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchHouses} />
      <HouseDetailsModal 
        house={selectedHouse} 
        isOpen={!!selectedHouse} 
        onClose={() => handleSelectHouse(null)} 
        onUpdate={fetchHouses} 
      />

      {/* Podium - Toujours en haut en mode liste */}
      {!isLoading && houses.length > 0 && viewMode === 'list' && (
        <TopHouses houses={houses} onHouseClick={handleSelectHouse} />
      )}

      {/* Header Dashboard Unified */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-black text-zinc-400 uppercase text-[10px] tracking-[0.3em] leading-none mb-1.5">Exploration</p>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter">Toutes les pépites</h2>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-inner flex-1 sm:flex-none">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-xl' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-white text-zinc-900 shadow-xl' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <MapIcon className="w-4 h-4" /> Carte
            </button>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-[1.2] sm:flex-none flex items-center justify-center gap-4 bg-indigo-600 text-white px-8 md:px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Ajouter une maison
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
           <div className="w-16 h-16 border-[6px] border-zinc-100 border-t-indigo-600 rounded-full animate-spin shadow-inner"></div>
           <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] animate-pulse">Chargement des villas...</span>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {houses.length > 0 ? (
                houses.map((house) => <HouseCard key={house.id} house={house} onClick={() => handleSelectHouse(house)} />)
              ) : (
                <div className="col-span-full py-40 flex flex-col items-center border-4 border-dashed border-zinc-100 rounded-[60px] bg-zinc-50/50">
                   <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl mb-8">🏝️</div>
                   <p className="text-zinc-400 font-black uppercase text-[10px] tracking-[0.4em]">Aucune proposition pour le moment</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[80vh] w-full rounded-[60px] overflow-hidden border border-zinc-100 shadow-2xl relative shadow-zinc-200">
               <MapComponent houses={houses} onMarkerClick={handleSelectHouse} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

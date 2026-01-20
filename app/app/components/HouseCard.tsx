'use client';

import { HouseWithVotes } from '../../lib/types';
import { MapPin, Star, Waves, Flame, BedDouble, Users } from 'lucide-react';

interface HouseCardProps {
  house: HouseWithVotes;
  onClick: () => void;
}

export default function HouseCard({ house, onClick }: HouseCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-[32px] bg-white border border-zinc-100 transition-all hover:shadow-2xl hover:shadow-zinc-200/50 hover:-translate-y-1"
    >
      {/* Image Area */}
      <div className="relative h-60 w-full overflow-hidden">
        {house.image_url ? (
          <img
            src={house.image_url}
            alt={house.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-300">
            <span className="text-[10px] font-black uppercase tracking-widest">Aucun visuel</span>
          </div>
        )}
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl bg-zinc-900 px-4 py-2 text-white shadow-xl">
            <span className="text-sm font-black">{house.price}€</span>
          </div>
        </div>

        {house.vote_count > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-black text-zinc-900">{house.avg_rating.toFixed(1)}</span>
            <span className="text-[9px] font-bold text-zinc-400">({house.vote_count})</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-black text-zinc-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors mb-1 truncate">
            {house.title}
          </h3>
          <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
            <MapPin className="h-3 w-3 text-indigo-400" />
            <span className="truncate">{house.address.split(',')[0]}</span>
          </div>
        </div>

        {/* Dynamic Features Row */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-50">
           {house.bedrooms && (
             <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-lg">
                <BedDouble className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-black text-zinc-900">{house.bedrooms} ch.</span>
             </div>
           )}
           
           {house.beds && (
             <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-lg">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-black text-zinc-900">{house.beds} lits</span>
             </div>
           )}

           {house.distance_sea_min !== null && house.distance_sea_min > 0 && (
             <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg">
                <span className="text-[10px] font-black text-blue-600">🏖️ {house.distance_sea_min} min</span>
             </div>
           )}

           {/* Amenities Icons */}
           <div className="ml-auto flex gap-2">
             {house.has_pool && <Waves className="w-4 h-4 text-blue-400" />}
             {house.has_jacuzzi && <Star className="w-4 h-4 text-purple-400" />}
             {house.has_bbq && <Flame className="w-4 h-4 text-orange-400" />}
           </div>
        </div>
      </div>
    </div>
  );
}

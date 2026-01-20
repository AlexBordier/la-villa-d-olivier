'use client';

import { HouseWithVotes } from '../../lib/types';
import { MapPin, Star, Waves, Flame, BedDouble } from 'lucide-react';

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
      {/* Image Container */}
      <div className="relative h-64 w-full overflow-hidden">
        {house.image_url ? (
          <img
            src={house.image_url}
            alt={house.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-300">
            <span className="text-xs font-black uppercase tracking-widest">Pas d&apos;image</span>
          </div>
        )}
        
        {/* Price Tag */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-2xl bg-zinc-900 px-4 py-2 text-white shadow-xl">
          <span className="text-sm font-black">{house.price}€</span>
        </div>

        {/* Rating Badge */}
        {house.vote_count > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-zinc-900 shadow-sm border border-white/20">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-black">{house.avg_rating.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-zinc-400">({house.vote_count})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="text-xl font-black text-zinc-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
            {house.title}
            </h3>
        </div>
        
        <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wider mb-6">
          <MapPin className="h-3 w-3 text-indigo-400" />
          <span className="truncate">{house.address}</span>
        </div>

        {/* Features Minimalist */}
        <div className="flex items-center gap-4 pt-4 border-t border-zinc-50">
           <div className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-zinc-300" />
              <span className="text-xs font-black text-zinc-900">{house.bedrooms}</span>
           </div>
           <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-zinc-300 uppercase">Min Mer:</span>
              <span className="text-xs font-black text-blue-600">{house.distance_sea_min}m</span>
           </div>
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
'use client';

import { HouseWithVotes } from '../../lib/types';
import { Star, Trophy, MapPin } from 'lucide-react';

interface TopHousesProps {
  houses: HouseWithVotes[];
  onHouseClick: (house: HouseWithVotes) => void;
}

export default function TopHouses({ houses, onHouseClick }: TopHousesProps) {
  const topThree = [...houses]
    .filter(h => h.vote_count > 0)
    .sort((a, b) => b.avg_rating - a.avg_rating)
    .slice(0, 3);

  if (topThree.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-yellow-400/10 rounded-2xl shadow-xl shadow-yellow-100/50">
          <Trophy className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <p className="font-black text-zinc-400 uppercase text-[10px] tracking-[0.3em] leading-none mb-1.5">Classement</p>
          <h3 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter">Le podium du groupe</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {topThree.map((house, index) => (
          <div 
            key={house.id}
            onClick={() => onHouseClick(house)}
            className="group relative h-72 rounded-[40px] overflow-hidden cursor-pointer shadow-2xl shadow-zinc-200/50 hover:-translate-y-2 transition-all duration-500 border border-zinc-100"
          >
            <img src={house.image_url || ''} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-90" />
            
            <div className={`absolute top-6 left-6 w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-white shadow-2xl border-2 border-white/20 backdrop-blur-md ${
              index === 0 ? 'bg-yellow-500 scale-110' : index === 1 ? 'bg-zinc-400' : 'bg-orange-600'
            }`}>
              {index + 1}
            </div>

            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl border border-white/50">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-black text-zinc-900">{house.avg_rating.toFixed(1)}</span>
            </div>

            <div className="absolute bottom-8 left-8 right-8">
              <h4 className="text-2xl font-black text-white leading-tight mb-2 tracking-tight group-hover:text-yellow-400 transition-colors">{house.title}</h4>
              <div className="flex items-center gap-2 text-zinc-300 text-[10px] font-black uppercase tracking-[0.2em]">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {house.address.split(',')[0]}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="h-px bg-zinc-100 w-full" />
    </div>
  );
}
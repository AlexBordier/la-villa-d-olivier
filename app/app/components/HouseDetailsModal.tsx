'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { HouseWithVotes, Vote } from '../../lib/types';
import { X, BedDouble, Users, Waves, Flame, MapPin, ExternalLink, Star, Trash2, Edit3, Save, MessageSquare, Info } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';

interface HouseDetailsModalProps {
  house: HouseWithVotes | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function HouseDetailsModal({ house, isOpen, onClose, onUpdate }: HouseDetailsModalProps) {
  const { user, users } = useUser();
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [comment, setComment] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (house && user) {
      const existingVote = house.votes.find(v => v.user_id === user.id);
      setUserVote(existingVote || null);
      setComment(existingVote?.comment || '');
      setEditData({ ...house });
    }
  }, [house, user]);

  if (!isOpen || !house) return null;

  const handleVote = async (rating: number) => {
    if (!user) return;
    setIsVoting(true);
    try {
      const { error } = await supabase.from('votes').upsert({
        house_id: house.id, user_id: user.id, rating, comment: comment || null, updated_at: new Date().toISOString()
      }, { onConflict: 'house_id,user_id' });
      if (error) throw error;
      onUpdate();
    } catch (err) {
      alert('Erreur vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleUpdateHouse = async () => {
    try {
      const { error } = await supabase.from('houses').update({
        title: editData.title, price: parseFloat(editData.price), address: editData.address,
        bedrooms: parseInt(editData.bedrooms), beds: parseInt(editData.beds),
        distance_sea_min: parseInt(editData.distance_sea_min), link: editData.link,
        details: editData.details, has_pool: editData.has_pool, has_jacuzzi: editData.has_jacuzzi,
        has_bbq: editData.has_bbq, lat: editData.lat, lng: editData.lng
      }).eq('id', house.id);
      if (error) throw error;
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      alert('Erreur modification');
    }
  };

  const handleDeleteHouse = async () => {
    if (!window.confirm('Supprimer cette maison ?')) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('houses').delete().eq('id', house.id);
      if (error) throw error;
      onClose();
      onUpdate();
    } catch (err) {
      alert('Erreur suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const ratings = [
    { value: 1, label: 'Non', icon: '❌', color: 'text-red-600 bg-red-50' },
    { value: 2, label: 'Bof', icon: '😕', color: 'text-orange-600 bg-orange-50' },
    { value: 3, label: 'Bien', icon: '🙂', color: 'text-blue-600 bg-blue-50' },
    { value: 4, label: 'Top', icon: '❤️', color: 'text-pink-600 bg-pink-50' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-md">
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl md:h-auto md:max-h-[92vh] border border-white/20">
        
        {/* Banner Section */}
        <div className="relative h-64 md:h-[400px] shrink-0">
          <img src={house.image_url || ''} className="h-full w-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          
          <div className="absolute top-6 right-6 flex gap-3">
             {!isEditing && (
               <>
                 <button onClick={() => setIsEditing(true)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-zinc-900 transition-all shadow-xl border border-white/20">
                   <Edit3 className="w-5 h-5" />
                 </button>
                 <button onClick={handleDeleteHouse} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-xl border border-white/20">
                   <Trash2 className="w-5 h-5" />
                 </button>
               </>
             )}
             <button onClick={onClose} className="p-3 bg-white backdrop-blur-md rounded-full text-zinc-900 hover:scale-110 transition-all shadow-xl">
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="absolute bottom-10 left-10 right-10">
             {isEditing ? (
               <input 
                 value={editData.title} 
                 onChange={(e) => setEditData({...editData, title: e.target.value})}
                 className="text-4xl font-black text-white bg-white/10 border-b-2 border-white/30 w-full outline-none py-2 px-4 rounded-t-xl focus:bg-white/20"
               />
             ) : (
               <>
                 <h2 className="text-5xl font-black text-white tracking-tight leading-none mb-4">{house.title}</h2>
                 <div className="flex items-center gap-2 text-zinc-300 font-bold text-sm tracking-wide uppercase">
                    <MapPin className="w-4 h-4 text-indigo-400" /> {house.address}
                 </div>
               </>
             )}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row bg-zinc-50">
            
            {/* Info Column */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-white rounded-tr-[40px] shadow-sm">
                
                {isEditing ? (
                  <div className="space-y-10">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Adresse via Google</label>
                           <Autocomplete
                              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                              onPlaceSelected={(place) => {
                                if (place.geometry?.location) {
                                  setEditData({...editData, address: place.formatted_address || '', lat: place.geometry.location.lat(), lng: place.geometry.location.lng()});
                                }
                              }}
                              className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
                              defaultValue={editData.address}
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Lien de l&apos;annonce</label>
                           <input value={editData.link || ''} onChange={(e) => setEditData({...editData, link: e.target.value})} className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner" />
                        </div>
                     </div>

                     <div className="grid grid-cols-4 gap-4">
                        {['price', 'bedrooms', 'beds', 'distance_sea_min'].map(k => (
                          <div key={k} className="bg-zinc-50 p-4 rounded-2xl">
                             <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">{k.replace('_',' ')}</label>
                             <input type="number" value={editData[k] || ''} onChange={(e) => setEditData({...editData, [k]: e.target.value})} className="w-full bg-transparent border-none p-0 text-sm font-black text-zinc-900" />
                          </div>
                        ))}
                     </div>

                     <div className="flex gap-4">
                        {['has_pool', 'has_jacuzzi', 'has_bbq'].map(k => (
                          <label key={k} className={`flex-1 flex items-center justify-center gap-2 py-3 border-2 rounded-2xl transition-all cursor-pointer font-bold text-xs ${editData[k] ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-zinc-100 text-zinc-400'}`}>
                             <input type="checkbox" checked={editData[k]} onChange={(e) => setEditData({...editData, [k]: e.target.checked})} className="hidden" /> {k.split('_')[1]}
                          </label>
                        ))}
                     </div>

                     <button onClick={handleUpdateHouse} className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 active:scale-95">
                        <Save className="w-5 h-5" /> Sauvegarder
                     </button>
                  </div>
                ) : (
                  <div className="space-y-12">
                     {/* Stats Row */}
                     <div className="flex flex-wrap gap-8">
                        <div>
                           <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Budget Total</span>
                           <span className="text-4xl font-black text-zinc-900">{house.price}€</span>
                        </div>
                        <div className="w-px h-12 bg-zinc-100 hidden sm:block"></div>
                        <div className="flex gap-10">
                           <div className="flex flex-col"><span className="text-2xl font-black text-zinc-900">{house.bedrooms}</span><span className="text-[10px] font-bold text-zinc-400 uppercase">Chambres</span></div>
                           <div className="flex flex-col"><span className="text-2xl font-black text-zinc-900">{house.beds}</span><span className="text-[10px] font-bold text-zinc-400 uppercase">Couchages</span></div>
                           <div className="flex flex-col"><span className="text-2xl font-black text-blue-600">{house.distance_sea_min}</span><span className="text-[10px] font-bold text-blue-400 uppercase">Min Mer</span></div>
                        </div>
                     </div>

                     {/* Amenities */}
                     <div className="grid grid-cols-3 gap-4">
                        {[
                          { val: house.has_pool, label: 'Piscine', icon: Waves, c: 'text-blue-600 bg-blue-50' },
                          { val: house.has_jacuzzi, label: 'Jacuzzi', icon: Waves, c: 'text-purple-600 bg-purple-50' },
                          { val: house.has_bbq, label: 'Barbecue', icon: Flame, c: 'text-orange-600 bg-orange-50' },
                        ].filter(x => x.val).map((x, i) => (
                           <div key={i} className={`flex items-center gap-3 p-4 rounded-3xl ${x.c} border border-white shadow-sm`}>
                              <x.icon className="w-5 h-5" />
                              <span className="text-xs font-black uppercase tracking-wider">{x.label}</span>
                           </div>
                        ))}
                     </div>

                     {/* External Link */}
                     {house.link && (
                        <a href={house.link} target="_blank" className="flex items-center justify-between p-6 bg-zinc-900 rounded-[32px] text-white group hover:bg-indigo-600 transition-all shadow-xl shadow-zinc-200">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/10 rounded-2xl"><ExternalLink className="w-5 h-5" /></div>
                              <span className="font-black text-sm uppercase tracking-widest">Voir sur le site de location</span>
                           </div>
                           <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">→</div>
                        </a>
                     )}

                     {/* Notes */}
                     {house.details && (
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-zinc-400">
                              <Info className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Informations complémentaires</span>
                           </div>
                           <p className="text-zinc-600 leading-relaxed font-medium text-lg bg-zinc-50 p-8 rounded-[32px] italic">
                             &ldquo;{house.details}&rdquo;
                           </p>
                        </div>
                     )}
                  </div>
                )}
            </div>

            {/* Voting Column */}
            <div className="w-full border-t bg-zinc-50 p-10 md:w-[400px] md:border-l md:border-t-0 flex flex-col">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="font-black text-zinc-900 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Avis du groupe
                   </h3>
                   <div className="text-2xl font-black text-zinc-900 tracking-tighter">
                     {house.avg_rating > 0 ? house.avg_rating.toFixed(1) : '-'}<span className="text-xs text-zinc-400 font-bold">/4</span>
                   </div>
                </div>

                {/* My Vote Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-zinc-200/50 mb-10 border border-zinc-100">
                   <p className="text-[9px] font-black text-zinc-400 uppercase text-center mb-6 tracking-widest">Voter pour cette villa</p>
                   <div className="flex justify-between gap-2 mb-6">
                      {ratings.map(r => (
                        <button 
                          key={r.value}
                          onClick={() => handleVote(r.value)}
                          className={`flex-1 flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${userVote?.rating === r.value ? 'border-zinc-900 bg-zinc-900 text-white scale-110 shadow-lg' : 'border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
                        >
                          <span className="text-xl mb-1">{r.icon}</span>
                        </button>
                      ))}
                   </div>
                   <textarea 
                      placeholder="Commentaire (facultatif)..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-zinc-50 rounded-2xl p-4 text-xs font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 h-24 resize-none transition-all"
                   />
                   {userVote && comment !== (userVote.comment || '') && (
                     <button onClick={() => handleVote(userVote.rating)} className="w-full mt-4 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Enregistrer l&apos;avis</button>
                   )}
                </div>

                {/* Other Votes */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                   {house.votes.map(v => {
                      const voter = users.find(u => u.id === v.user_id);
                      const r = ratings.find(x => x.value === v.rating);
                      return (
                        <div key={v.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all hover:shadow-md">
                           <span className="text-2xl">{r?.icon}</span>
                           <div className="min-w-0">
                              <div className="font-black text-zinc-900 text-[10px] uppercase tracking-tight">{voter?.username}</div>
                              {v.comment && <p className="text-zinc-500 text-[11px] font-medium leading-tight mt-1">&ldquo;{v.comment}&rdquo;</p>}
                           </div>
                        </div>
                      )
                   })}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
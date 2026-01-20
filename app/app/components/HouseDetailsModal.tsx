'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { HouseWithVotes, Vote } from '../../lib/types';
import { X, BedDouble, Users, Waves, Flame, MapPin, ExternalLink, Star, Trash2, Edit3, Save, Info, Upload, MessageCirclePlus } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import heic2any from 'heic2any';
import VoteModal from './VoteModal';

interface HouseDetailsModalProps {
  house: HouseWithVotes | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function HouseDetailsModal({ house, isOpen, onClose, onUpdate }: HouseDetailsModalProps) {
  const { user, users } = useUser();
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (house && user) {
      const existingVote = house.votes.find(v => v.user_id === user.id);
      setUserVote(existingVote || null);
      setEditData({ ...house });
      setImageFile(null);
    }
  }, [house, user]);

  if (!isOpen || !house) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
      setIsConverting(true);
      try {
        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
        const convertedFile = new File([Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
        setImageFile(convertedFile);
      } catch (err) { alert("Erreur conversion HEIC"); } finally { setIsConverting(false); }
    } else { setImageFile(file); }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `house-images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('vacances').upload(filePath, file, { contentType: file.type || 'image/jpeg', cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('vacances').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err: any) { alert("Erreur upload"); return null; }
  };

  const handleVote = async (rating: number, comment: string) => {
    if (!user) return;
    setIsVoting(true);
    try {
      const { error } = await supabase.from('votes').upsert({ 
        house_id: house.id, user_id: user.id, rating, comment: comment || null, updated_at: new Date().toISOString() 
      }, { onConflict: 'house_id,user_id' });
      if (error) throw error;
      setIsVoteModalOpen(false);
      onUpdate();
    } catch (err) { alert('Erreur vote'); } finally { setIsVoting(false); }
  };

  const handleUpdateHouse = async () => {
    try {
      let finalImageUrl = editData.image_url;
      if (imageFile) {
        const uploadedUrl = await handleFileUpload(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }
      const { error } = await supabase.from('houses').update({
        title: editData.title, price: parseFloat(editData.price), address: editData.address,
        image_url: finalImageUrl, bedrooms: parseInt(editData.bedrooms), beds: parseInt(editData.beds),
        distance_sea_min: parseInt(editData.distance_sea_min), link: editData.link,
        pros: editData.pros, cons: editData.cons, details: editData.details,
        has_pool: editData.has_pool, has_jacuzzi: editData.has_jacuzzi, has_bbq: editData.has_bbq,
        lat: editData.lat, lng: editData.lng
      }).eq('id', house.id);
      if (error) throw error;
      setIsEditing(false);
      onUpdate();
    } catch (err) { alert('Erreur modification'); }
  };

  const handleDeleteHouse = async () => {
    if (!window.confirm('Supprimer cette maison ?')) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('houses').delete().eq('id', house.id);
      if (error) throw error;
      onClose();
      onUpdate();
    } catch (err) { alert('Erreur suppression'); } finally { setIsDeleting(false); }
  };

  const ratings_icons = [
    { value: 1, icon: '❌', label: 'Non' },
    { value: 2, icon: '😕', label: 'Bof' },
    { value: 3, icon: '🙂', label: 'Bien' },
    { value: 4, icon: '❤️', label: 'Top' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm text-zinc-900">
      
      <VoteModal 
        isOpen={isVoteModalOpen} 
        onClose={() => setIsVoteModalOpen(false)} 
        onVote={handleVote} 
        existingVote={userVote}
        isVoting={isVoting}
      />

      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl md:h-auto md:max-h-[90vh]">
        
        <div className={`relative shrink-0 transition-all duration-500 ${isEditing ? 'h-32 md:h-40' : 'h-56 md:h-[350px]'}`}>
          <img src={house.image_url || ''} className="h-full w-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          
          <div className="absolute top-4 right-4 flex gap-2">
             {!isEditing && (
               <>
                 <button onClick={() => setIsEditing(true)} className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-zinc-900 transition-all border border-white/20">
                   <Edit3 className="w-5 h-5" />
                 </button>
                 <button onClick={handleDeleteHouse} className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all border border-white/20">
                   <Trash2 className="w-5 h-5" />
                 </button>
               </>
             )}
             <button onClick={onClose} className="p-2.5 bg-white backdrop-blur-md rounded-full text-zinc-900 hover:scale-105 transition-all">
               <X className="w-5 h-5" />
             </button>
          </div>

          <div className="absolute bottom-6 left-8 right-8">
             {isEditing ? (
               <div className="space-y-1">
                 <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Modification en cours</span>
                 <input value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-2xl font-black text-white bg-transparent border-b border-white/30 w-full outline-none py-1 focus:border-white transition-all" />
               </div>
             ) : (
               <>
                 <h2 className="text-4xl font-black text-white tracking-tight leading-tight">{house.title}</h2>
                 <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs tracking-wide uppercase mt-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {house.address}
                 </div>
               </>
             )}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row bg-zinc-50">
            
            <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-white rounded-tr-[32px] shadow-sm">
                {isEditing ? (
                  <div className="space-y-8 animate-in fade-in duration-300 pb-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Changer la photo</label>
                      <label className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl cursor-pointer hover:bg-zinc-100 border-2 border-dashed border-zinc-200">
                        <Upload className="w-5 h-5 text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-500">{imageFile ? imageFile.name : 'Choisir un fichier...'}</span>
                        <input type="file" className="hidden" accept="image/*,.heic,.heif,.avif" onChange={handleFileChange} />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Adresse</label>
                           <Autocomplete apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} onPlaceSelected={(place) => { if (place.geometry?.location) setEditData({...editData, address: place.formatted_address || '', lat: place.geometry.location.lat(), lng: place.geometry.location.lng()}); }} className="w-full bg-zinc-50 border-none rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={editData.address} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Lien annonce</label>
                           <input value={editData.link || ''} onChange={(e) => setEditData({...editData, link: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {[ {l:'Budget',k:'price'}, {l:'Chambres',k:'bedrooms'}, {l:'Couchages',k:'beds'}, {l:'Mer (min)',k:'distance_sea_min'} ].map(f => (
                          <div key={f.k} className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                             <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">{f.l}</label>
                             <input type="number" value={editData[f.k] || ''} onChange={(e) => setEditData({...editData, [f.k]: e.target.value})} className="w-full bg-transparent border-none p-0 text-base font-black text-zinc-900 focus:ring-0" />
                          </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {[ {k:'has_pool',l:'Piscine'}, {k:'has_jacuzzi',l:'Jacuzzi'}, {k:'has_bbq',l:'Barbecue'} ].map(eq => (
                          <label key={eq.k} className={`flex-1 flex items-center justify-center gap-2 py-3 border-2 rounded-xl transition-all cursor-pointer font-bold text-[10px] uppercase ${editData[eq.k] ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-100 text-zinc-400'}`}>
                             <input type="checkbox" checked={editData[eq.k]} onChange={(e) => setEditData({...editData, [eq.k]: e.target.checked})} className="hidden" /> {eq.l}
                          </label>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-green-600 uppercase ml-1">Points Forts</label>
                          <textarea value={editData.pros || ''} onChange={(e) => setEditData({...editData, pros: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-4 text-sm font-medium outline-none h-24 focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-red-600 uppercase ml-1">Points Faibles</label>
                          <textarea value={editData.cons || ''} onChange={(e) => setEditData({...editData, cons: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-4 text-sm font-medium outline-none h-24 focus:ring-2 focus:ring-red-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Notes du groupe</label>
                        <textarea value={editData.details || ''} onChange={(e) => setEditData({...editData, details: e.target.value})} className="w-full bg-zinc-50 border-none rounded-xl p-4 text-sm font-medium outline-none h-24 focus:ring-2 focus:ring-zinc-900" />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={handleUpdateHouse} className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                           <Save className="w-4 h-4" /> Sauvegarder
                        </button>
                        <button onClick={() => setIsEditing(false)} className="px-8 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-bold text-[10px] uppercase hover:bg-zinc-200 transition-all">
                           Annuler
                        </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 animate-in fade-in duration-500">
                     <div className="flex flex-wrap gap-8 items-end">
                        <div>
                           <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Budget</span>
                           <span className="text-4xl font-black tracking-tight">{house.price}€</span>
                        </div>
                        <div className="flex gap-8 border-l border-zinc-100 pl-8">
                           <div className="flex flex-col"><span className="text-xl font-black">{house.bedrooms}</span><span className="text-[9px] font-bold text-zinc-400 uppercase">Chambres</span></div>
                           <div className="flex flex-col"><span className="text-xl font-black">{house.beds}</span><span className="text-[9px] font-bold text-zinc-400 uppercase">Couchages</span></div>
                           <div className="flex flex-col"><span className="text-xl font-black text-blue-600">{house.distance_sea_min}</span><span className="text-[9px] font-bold text-blue-400 uppercase">Min Mer</span></div>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-3">
                        {[ {v:house.has_pool,l:'Piscine',i:Waves,c:'text-blue-600 bg-blue-50'}, {v:house.has_jacuzzi,l:'Jacuzzi',i:Waves,c:'text-purple-600 bg-purple-50'}, {v:house.has_bbq,l:'Barbecue',i:Flame,c:'text-orange-600 bg-orange-50'} ].filter(x => x.v).map((x, i) => (
                           <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${x.c} border border-white shadow-sm`}>
                              <x.i className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-wider">{x.l}</span>
                           </div>
                        ))}
                     </div>

                     {house.link && (
                        <a href={house.link} target="_blank" className="flex items-center justify-between p-5 bg-zinc-900 rounded-2xl text-white group hover:bg-indigo-600 transition-all shadow-lg">
                           <div className="flex items-center gap-4">
                              <ExternalLink className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                              <span className="font-black text-[10px] uppercase tracking-widest">Voir l&apos;annonce</span>
                           </div>
                           <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
                        </a>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {house.pros && (
                           <div className="space-y-2">
                              <span className="text-[9px] font-black text-green-600 uppercase tracking-widest ml-1">👍 Points Forts</span>
                              <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100 text-green-900 font-bold text-sm leading-relaxed italic"> {house.pros} </div>
                           </div>
                        )}
                        {house.cons && (
                           <div className="space-y-2">
                              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest ml-1">👎 Points Faibles</span>
                              <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100 text-red-900 font-bold text-sm leading-relaxed italic"> {house.cons} </div>
                           </div>
                        )}
                     </div>

                     {house.details && (
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-zinc-400 ml-1"> <Info className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest">Notes</span> </div>
                           <p className="text-zinc-600 leading-relaxed font-bold text-base bg-zinc-50 p-8 rounded-3xl italic border border-zinc-100"> &ldquo;{house.details}&rdquo; </p>
                        </div>
                     )}
                  </div>
                )}
            </div>

            <div className="w-full border-t bg-zinc-50 p-8 md:w-[380px] md:border-l md:border-t-0 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                   <div>
                      <h3 className="font-black text-zinc-900 uppercase text-[9px] tracking-widest flex items-center gap-2"> <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Avis collectifs </h3>
                      <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1">{house.vote_count} votes enregistrés</p>
                   </div>
                   <div className="text-2xl font-black text-zinc-900 tracking-tight flex items-end"> 
                      {house.avg_rating > 0 ? house.avg_rating.toFixed(1) : '-'}
                      <span className="text-xs text-zinc-400 font-black ml-0.5">/4</span> 
                   </div>
                </div>

                <button 
                  onClick={() => setIsVoteModalOpen(true)}
                  className="w-full py-4 mb-10 bg-white border border-zinc-200 rounded-[20px] shadow-sm flex items-center justify-center gap-3 group hover:border-zinc-900 transition-all active:scale-95"
                >
                   <MessageCirclePlus className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">
                     {userVote ? 'Modifier mon avis' : 'Laisser un avis'}
                   </span>
                </button>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                   {house.votes.length === 0 ? (
                     <div className="text-center py-10 opacity-40">
                        <span className="text-2xl mb-2 block">💬</span>
                        <p className="text-[9px] font-black uppercase tracking-widest">Aucun avis pour le moment</p>
                     </div>
                   ) : (
                     house.votes.map(v => {
                        const voter = users.find(u => u.id === v.user_id);
                        const r = ratings_icons.find(x => x.value === v.rating);
                        return (
                          <div key={v.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all hover:shadow-md">
                             <span className="text-2xl shrink-0" title={r?.label}>{r?.icon}</span>
                             <div className="min-w-0">
                                <div className="font-black text-zinc-900 text-[10px] uppercase tracking-tight leading-none">{voter?.username}</div>
                                {v.comment && <p className="text-zinc-500 text-[11px] font-bold leading-tight mt-1.5 italic">&ldquo;{v.comment}&rdquo;</p>}
                             </div>
                          </div>
                        )
                     })
                   )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { HouseWithVotes, Vote } from '../../lib/types';
import { X, BedDouble, Users, Waves, Flame, MapPin, ExternalLink, Star, Trash2, Edit3, Save, Info, Upload, MessageCirclePlus } from 'lucide-react';
import dynamic from 'next/dynamic';
import VoteModal from './VoteModal';

const GoogleAutocomplete = dynamic(() => import('./GoogleAutocomplete'), { 
  ssr: false,
  loading: () => <div className="w-full h-14 bg-zinc-50 rounded-[20px] animate-pulse" />
});

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        const heic2any = (await import('heic2any')).default;
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
      const { error } = await supabase.from('votes').upsert({ house_id: house.id, user_id: user.id, rating, comment: comment || null, updated_at: new Date().toISOString() }, { onConflict: 'house_id,user_id' });
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
    { value: 1, icon: '❌', label: 'Non' }, { value: 2, icon: '😕', label: 'Bof' }, { value: 3, icon: '🙂', label: 'Bien' }, { value: 4, icon: '❤️', label: 'Top' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm text-zinc-900">
      <VoteModal isOpen={isVoteModalOpen} onClose={() => setIsVoteModalOpen(false)} onVote={handleVote} existingVote={userVote} isVoting={isVoting} />
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl md:h-auto md:max-h-[92vh] border border-white/20">
        
        <div className={`relative shrink-0 transition-all duration-500 ${isEditing ? 'h-32 md:h-40' : 'h-56 md:h-[350px]'}`}>
          <img src={house.image_url || ''} className="h-full w-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-3">
             {!isEditing && (
               <>
                 <button onClick={() => setIsEditing(true)} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-zinc-900 transition-all shadow-xl border border-white/20"><Edit3 className="w-6 h-6" /></button>
                 <button onClick={handleDeleteHouse} className="p-4 bg-white/10 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-xl border border-white/20"><Trash2 className="w-6 h-6" /></button>
               </>
             )}
             <button onClick={onClose} className="p-4 bg-white backdrop-blur-md rounded-full text-zinc-900 hover:scale-110 transition-all shadow-xl"><X className="w-6 h-6" /></button>
          </div>
          <div className="absolute bottom-10 left-10 right-10">
             {isEditing ? (
               <input value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-5xl font-black text-white bg-white/10 border-b-2 border-white/30 w-full outline-none py-3 px-4 rounded-t-xl" />
             ) : (
               <>
                 <h2 className="text-6xl font-black text-white tracking-tight leading-none mb-4">{house.title}</h2>
                 <div className="flex items-center gap-2 text-zinc-300 font-bold text-lg tracking-wide uppercase"><MapPin className="w-5 h-5 text-indigo-400" /> {house.address}</div>
               </>
             )}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row bg-zinc-50 font-medium">
            <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-white rounded-tr-[40px] shadow-sm">
                {isEditing ? (
                  <div className="space-y-10 pb-10">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Changer la photo</label>
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-200 rounded-[40px] cursor-pointer hover:bg-zinc-50 transition-colors relative group">
                        {isConverting ? (
                          <div className="flex flex-col items-center"><div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div><span className="text-xs font-black uppercase text-indigo-600 tracking-widest">Conversion...</span></div>
                        ) : (
                          <>
                            <Upload className="h-10 w-10 text-zinc-400 mb-3 group-hover:text-indigo-500 transition-colors" />
                            <span className="text-base font-black text-zinc-500 uppercase tracking-widest">{imageFile ? imageFile.name : 'Sélectionner un fichier'}</span>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*,.heic,.heif,.avif" onChange={handleFileChange} />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Adresse précise</label>
                           {isMounted && (
                             <GoogleAutocomplete onPlaceSelected={(place) => { if (place.geometry?.location) setEditData({...editData, address: place.formatted_address || '', lat: place.geometry.location.lat(), lng: place.geometry.location.lng()}); }} className="w-full bg-zinc-50 border-none rounded-3xl p-6 text-lg font-bold outline-none shadow-inner" defaultValue={editData.address} />
                           )}
                        </div>
                        <div className="space-y-4">
                           <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Lien de l&apos;annonce</label>
                           <input value={editData.link || ''} onChange={(e) => setEditData({...editData, link: e.target.value})} className="w-full bg-zinc-50 border-none rounded-3xl p-6 text-lg font-bold outline-none shadow-inner" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[ {l:'Budget',k:'price'}, {l:'Chambres',k:'bedrooms'}, {l:'Couchages',k:'beds'}, {l:'Mer (min)',k:'distance_sea_min'} ].map(f => (
                          <div key={f.k} className="bg-zinc-50 p-6 rounded-3xl">
                             <label className="block text-[10px] font-black text-zinc-400 uppercase mb-3 tracking-widest">{f.l}</label>
                             <input type="number" value={editData[f.k] || ''} onChange={(e) => setEditData({...editData, [f.k]: e.target.value})} className="w-full bg-transparent border-none p-0 text-2xl font-black text-zinc-900 focus:ring-0" />
                          </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        {[ {k:'has_pool',l:'Piscine'}, {k:'has_jacuzzi',l:'Jacuzzi'}, {k:'has_bbq',l:'Barbecue'} ].map(eq => (
                          <label key={eq.k} className={`flex-1 flex items-center justify-center gap-4 py-5 border-2 rounded-3xl transition-all cursor-pointer font-black text-sm uppercase tracking-[0.2em] ${editData[eq.k] ? 'border-zinc-900 bg-zinc-900 text-white shadow-2xl' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}>
                             <input type="checkbox" checked={editData[eq.k]} onChange={(e) => setEditData({...editData, [eq.k]: e.target.checked})} className="hidden" /> {eq.l}
                          </label>
                        ))}
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-4">
                          <label className="text-xs font-black text-green-600 uppercase ml-1 tracking-[0.2em]">Points Forts 👍</label>
                          <textarea value={editData.pros || ''} onChange={(e) => setEditData({...editData, pros: e.target.value})} className="w-full bg-zinc-50 border-none rounded-[32px] p-8 text-lg font-bold outline-none h-40 shadow-inner" />
                        </div>
                        <div className="space-y-4">
                          <label className="text-xs font-black text-red-600 uppercase ml-1 tracking-[0.2em]">Points Faibles 👎</label>
                          <textarea value={editData.cons || ''} onChange={(e) => setEditData({...editData, cons: e.target.value})} className="w-full bg-zinc-50 border-none rounded-[32px] p-8 text-lg font-bold outline-none h-40 shadow-inner" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-black text-zinc-400 uppercase ml-1 tracking-[0.2em]">Détails supplémentaires</label>
                        <textarea value={editData.details || ''} onChange={(e) => setEditData({...editData, details: e.target.value})} className="w-full bg-zinc-50 border-none rounded-[40px] p-8 text-lg font-bold outline-none h-48 shadow-inner" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-10">
                        <button onClick={handleUpdateHouse} className="flex-1 py-8 bg-indigo-600 text-white rounded-[40px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 text-sm"><Save className="w-8 h-8" /> Enregistrer</button>
                        <button onClick={() => setIsEditing(false)} className="px-16 py-8 bg-zinc-100 text-zinc-500 rounded-[40px] font-black uppercase text-xs tracking-[0.2em] hover:bg-zinc-200 transition-all">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12">
                     <div className="flex flex-wrap gap-12 text-zinc-900">
                        <div><span className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-3">Budget Total</span><span className="text-5xl font-black tracking-tighter">{house.price}€</span></div>
                        <div className="w-px h-16 bg-zinc-100 hidden sm:block"></div>
                        <div className="flex gap-12">
                           <div className="flex flex-col"><span className="text-3xl font-black tracking-tighter">{house.bedrooms}</span><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chambres</span></div>
                           <div className="flex flex-col"><span className="text-3xl font-black tracking-tighter">{house.beds}</span><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Couchages</span></div>
                           <div className="flex flex-col"><span className="text-3xl font-black text-blue-600 tracking-tighter">{house.distance_sea_min}</span><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Min Mer</span></div>
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-6">
                        {[ {v:house.has_pool,l:'Piscine',i:Waves,c:'text-blue-600 bg-blue-50 border-blue-100'}, {v:house.has_jacuzzi,l:'Jacuzzi',i:Waves,c:'text-purple-600 bg-purple-50 border-purple-100'}, {v:house.has_bbq,l:'Barbecue',i:Flame,c:'text-orange-600 bg-orange-50 border-orange-100'} ].filter(x => x.v).map((x, i) => (
                           <div key={i} className={`flex items-center gap-4 p-6 rounded-[32px] ${x.c} border shadow-sm`}><x.i className="w-6 h-6" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">{x.l}</span></div>
                        ))}
                     </div>
                     {house.link && (
                        <a href={house.link} target="_blank" className="flex items-center justify-between p-8 bg-zinc-900 rounded-[40px] text-white group hover:bg-indigo-600 transition-all shadow-2xl">
                           <div className="flex items-center gap-6"><div className="p-4 bg-white/10 rounded-2xl"><ExternalLink className="w-6 h-6" /></div><span className="font-black text-xs uppercase tracking-[0.3em]">Annonce officielle</span></div>
                           <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:translate-x-2 transition-transform text-lg">→</div>
                        </a>
                     )}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {house.pros && <div className="space-y-4"><span className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2 ml-2">👍 Points Forts</span><div className="p-10 bg-green-50/50 rounded-[40px] border border-green-100 text-green-900 font-bold text-xl leading-relaxed">{house.pros}</div></div>}
                        {house.cons && <div className="space-y-4"><span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2 ml-2">👎 Points Faibles</span><div className="p-10 bg-red-50/50 rounded-[40px] border border-red-100 text-red-900 font-bold text-xl leading-relaxed">{house.cons}</div></div>}
                     </div>
                     {house.details && (
                        <div className="space-y-4"><div className="flex items-center gap-2 text-zinc-400 ml-2"> <Info className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">À savoir de plus</span> </div><p className="text-zinc-600 leading-relaxed font-bold text-2xl bg-zinc-50 p-12 rounded-[50px] italic border border-zinc-100"> &ldquo;{house.details}&rdquo; </p></div>
                     )}
                  </div>
                )}
            </div>

            <div className="w-full border-t bg-zinc-50 p-10 md:w-[450px] md:border-l md:border-t-0 flex flex-col">
                <div className="flex items-center justify-between mb-12">
                   <h3 className="font-black text-zinc-900 uppercase text-[10px] tracking-[0.3em] flex items-center gap-3"> <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Vos avis </h3>
                   <div className="text-4xl font-black text-zinc-900 tracking-tighter"> {house.avg_rating > 0 ? house.avg_rating.toFixed(1) : '-'}<span className="text-sm text-zinc-400 font-black">/4</span> </div>
                </div>
                <button onClick={() => setIsVoteModalOpen(true)} className="w-full py-4 mb-10 bg-white border border-zinc-200 rounded-[20px] shadow-sm flex items-center justify-center gap-3 group hover:border-zinc-900 transition-all active:scale-95"><MessageCirclePlus className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">{userVote ? 'Modifier mon avis' : 'Laisser un avis'}</span></button>
                <div className="flex-1 overflow-y-auto space-y-6 pr-4">
                   {house.votes.length === 0 ? (
                     <div className="text-center py-10 opacity-40"><span className="text-2xl mb-2 block">💬</span><p className="text-[9px] font-black uppercase tracking-widest">Aucun avis</p></div>
                   ) : (
                     house.votes.map(v => {
                        const voter = users.find(u => u.id === v.user_id);
                        const r = ratings_icons.find(x => x.value === v.rating);
                        return (
                          <div key={v.id} className="flex gap-6 p-8 bg-white rounded-[40px] border border-zinc-100 shadow-sm transition-all hover:shadow-xl"><span className="text-4xl shrink-0">{r?.icon}</span><div className="min-w-0"><div className="font-black text-zinc-900 text-sm uppercase tracking-tight">{voter?.username}</div>{v.comment && <p className="text-zinc-500 text-base font-bold leading-relaxed mt-2 italic">&ldquo;{v.comment}&rdquo;</p>}</div></div>
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

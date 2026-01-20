'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { HouseWithVotes, Vote } from '../../lib/types';
import { X, BedDouble, Users, Waves, Flame, MapPin, ExternalLink, Star, Trash2, Edit3, Save, Info, Upload, MessageCirclePlus } from 'lucide-react';
import dynamic from 'next/dynamic';
import heic2any from 'heic2any';

const GoogleAutocomplete = dynamic(() => import('./GoogleAutocomplete'), { 
  ssr: false,
  loading: () => <div className="w-full h-12 bg-zinc-50 rounded-xl animate-pulse" />
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
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [tempComment, setTempComment] = useState('');
  const [editData, setEditData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (house && user) {
      const existingVote = house.votes.find(v => v.user_id === user.id);
      setUserVote(existingVote || null);
      setTempRating(existingVote?.rating || 0);
      setTempComment(existingVote?.comment || '');
      setEditData({ ...house });
      setImageFile(null);
      setShowVoteForm(false);
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
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('vacances').upload(`house-images/${fileName}`, file, { contentType: file.type || 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('vacances').getPublicUrl(`house-images/${fileName}`);
      return data.publicUrl;
    } catch (err) { return null; }
  };

  const handleVoteSubmit = async () => {
    if (!user || tempRating === 0) return;
    setIsVoting(true);
    try {
      const { error } = await supabase.from('votes').upsert({ house_id: house.id, user_id: user.id, rating: tempRating, comment: tempComment || null, updated_at: new Date().toISOString() }, { onConflict: 'house_id,user_id' });
      if (error) throw error;
      setShowVoteForm(false);
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
        title: editData.title, price: parseFloat(editData.price), address: editData.address, image_url: finalImageUrl, bedrooms: parseInt(editData.bedrooms), beds: parseInt(editData.beds), distance_sea_min: parseInt(editData.distance_sea_min), link: editData.link, pros: editData.pros, cons: editData.cons, details: editData.details, has_pool: editData.has_pool, has_jacuzzi: editData.has_jacuzzi, has_bbq: editData.has_bbq, lat: editData.lat, lng: editData.lng
      }).eq('id', house.id);
      if (error) throw error;
      setIsEditing(false);
      onUpdate();
    } catch (err) { alert('Erreur modification'); }
  };

  const ratings_icons = [
    { value: 1, icon: '❌', label: 'Non' }, { value: 2, icon: '😕', label: 'Bof' }, { value: 3, icon: '🙂', label: 'Bien' }, { value: 4, icon: '❤️', label: 'Top' },
  ];

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-zinc-950/60 p-0 sm:p-4 backdrop-blur-md text-zinc-900">
      <div className="relative mx-auto min-h-screen sm:min-h-0 sm:my-8 w-full max-w-5xl flex flex-col overflow-hidden rounded-none sm:rounded-[40px] bg-white shadow-2xl border border-white/20">
        
        {/* Banner with absolute buttons but careful layout */}
        <div className={`relative shrink-0 ${isEditing ? 'h-40' : 'h-64 sm:h-[400px]'}`}>
          <img src={house.image_url || ''} className="h-full w-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
          
          {/* Action Buttons - Always visible and separate from title on small screens */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
             {!isEditing && (
               <>
                 <button onClick={() => setIsEditing(true)} className="p-3 bg-white/90 backdrop-blur-md rounded-full text-indigo-600 shadow-xl border border-zinc-100"><Edit3 className="w-5 h-5" /></button>
                 <button onClick={() => { if (window.confirm('Supprimer ?')) { supabase.from('houses').delete().eq('id', house.id).then(() => { onClose(); onUpdate(); }); } }} className="p-3 bg-white/90 backdrop-blur-md rounded-full text-red-500 shadow-xl border border-zinc-100"><Trash2 className="w-5 h-5" /></button>
               </>
             )}
             <button onClick={onClose} className="p-3 bg-white shadow-xl rounded-full text-zinc-900"><X className="w-5 h-5" /></button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
             {isEditing ? (
               <input value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-xl sm:text-4xl font-black bg-white/10 border-b border-white/30 w-full outline-none py-2 px-4 rounded-t-xl" placeholder="Titre..." />
             ) : (
               <div className="space-y-2">
                 <h2 className="text-2xl sm:text-5xl font-black tracking-tight leading-tight drop-shadow-lg">{house.title}</h2>
                 <div className="flex items-center gap-2 text-zinc-200 font-bold text-xs sm:text-sm uppercase tracking-wide"><MapPin className="w-4 h-4 text-indigo-400" /> {house.address}</div>
               </div>
             )}
          </div>
        </div>

        {/* Content Area - Flow naturally */}
        <div className="flex flex-col md:flex-row bg-white">
            
            {/* Info Column */}
            <div className="flex-1 p-6 sm:p-10 space-y-10 sm:space-y-12">
                {isEditing ? (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Changer la photo</label>
                      <label className="flex items-center gap-4 bg-zinc-50 p-5 rounded-2xl cursor-pointer hover:bg-zinc-100 border-2 border-dashed border-zinc-200">
                        <Upload className="w-6 h-6 text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-500">{imageFile ? imageFile.name : 'Uploader un nouveau fichier'}</span>
                        <input type="file" className="hidden" accept="image/*,.heic,.heif,.avif" onChange={handleFileChange} />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Adresse précise</label>
                           {isMounted && ( <GoogleAutocomplete onPlaceSelected={(place) => { if (place.geometry?.location) setEditData({...editData, address: place.formatted_address || '', lat: place.geometry.location.lat(), lng: place.geometry.location.lng()}); }} className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" defaultValue={editData.address} /> )}
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Lien de l&apos;annonce</label>
                           <input value={editData.link || ''} onChange={(e) => setEditData({...editData, link: e.target.value})} className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[ {l:'Budget',k:'price'}, {l:'Chambres',k:'bedrooms'}, {l:'Couchages',k:'beds'}, {l:'Mer (min)',k:'distance_sea_min'} ].map(f => (
                          <div key={f.k} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                             <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">{f.l}</label>
                             <input type="number" value={editData[f.k] || ''} onChange={(e) => setEditData({...editData, [f.k]: e.target.value})} className="w-full bg-transparent border-none p-0 text-lg font-black text-zinc-900 focus:ring-0" />
                          </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[ {k:'has_pool',l:'Piscine'}, {k:'has_jacuzzi',l:'Jacuzzi'}, {k:'has_bbq',l:'Barbecue'} ].map(eq => (
                          <label key={eq.k} className={`flex-1 min-w-[100px] flex items-center justify-center gap-3 py-4 border-2 rounded-2xl transition-all cursor-pointer font-black text-[10px] uppercase tracking-widest ${editData[eq.k] ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}>
                             <input type="checkbox" checked={editData[eq.k]} onChange={(e) => setEditData({...editData, [eq.k]: e.target.checked})} className="hidden" /> {eq.l}
                          </label>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-green-600 uppercase ml-1">Points Forts 👍</label>
                          <textarea value={editData.pros || ''} onChange={(e) => setEditData({...editData, pros: e.target.value})} className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-sm font-medium outline-none h-32 shadow-inner" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-red-600 uppercase ml-1">Points Faibles 👎</label>
                          <textarea value={editData.cons || ''} onChange={(e) => setEditData({...editData, cons: e.target.value})} className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-sm font-medium outline-none h-32 shadow-inner" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">Détails</label>
                        <textarea value={editData.details || ''} onChange={(e) => setEditData({...editData, details: e.target.value})} className="w-full bg-zinc-50 border-none rounded-2xl p-5 text-sm font-medium outline-none h-32 shadow-inner" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button onClick={handleUpdateHouse} className="flex-1 py-6 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-700 active:scale-95 text-xs"><Save className="w-6 h-6 mr-2 inline" /> Enregistrer</button>
                        <button onClick={() => setIsEditing(false)} className="px-12 py-6 bg-zinc-100 text-zinc-500 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-zinc-200">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 sm:space-y-12">
                     <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-start">
                        <div>
                           <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-3">Budget Total</span>
                           <span className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tighter">{house.price}€</span>
                        </div>
                        <div className="flex gap-10 sm:gap-12 justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-6 sm:pt-0">
                           <div className="flex flex-col text-center sm:text-left"><span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tighter">{house.bedrooms}</span><span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chambres</span></div>
                           <div className="flex flex-col text-center sm:text-left"><span className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tighter">{house.beds}</span><span className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Couchages</span></div>
                           <div className="flex flex-col text-center sm:text-left"><span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tighter">{house.distance_sea_min}</span><span className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest">Min Mer</span></div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[ {v:house.has_pool,l:'Piscine',i:Waves,c:'text-blue-600 bg-blue-50'}, {v:house.has_jacuzzi,l:'Jacuzzi',i:Waves,c:'text-purple-600 bg-purple-50'}, {v:house.has_bbq,l:'Barbecue',i:Flame,c:'text-orange-600 bg-orange-50'} ].filter(x => x.v).map((x, i) => (
                           <div key={i} className={`flex items-center gap-3 p-5 rounded-2xl ${x.c} border border-white shadow-sm`}><x.i className="w-5 h-5" /> <span className="text-[9px] font-black uppercase tracking-wider">{x.l}</span></div>
                        ))}
                     </div>

                     {house.link && (
                        <a href={house.link} target="_blank" className="flex items-center justify-between p-6 sm:p-8 bg-zinc-900 rounded-[32px] text-white group hover:bg-indigo-600 transition-all shadow-xl">
                           <div className="flex items-center gap-4"><ExternalLink className="w-6 h-6 text-zinc-400 group-hover:text-white" /><span className="font-black text-[10px] uppercase tracking-[0.2em]">Ouvrir l&apos;annonce officielle</span></div>
                           <span className="text-lg">→</span>
                        </a>
                     )}

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                        {house.pros && <div className="space-y-3"><span className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-2">👍 On aime</span><div className="p-8 bg-green-50/50 rounded-3xl border border-green-100 text-green-900 font-bold text-base leading-relaxed">{house.pros}</div></div>}
                        {house.cons && <div className="space-y-3"><span className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-2">👎 On aime moins</span><div className="p-8 bg-red-50/50 rounded-3xl border border-red-100 text-red-900 font-bold text-base leading-relaxed">{house.cons}</div></div>}
                     </div>

                     {house.details && (
                        <div className="space-y-4"><div className="flex items-center gap-2 text-zinc-400 ml-2"> <Info className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Notes du groupe</span> </div><p className="text-zinc-600 leading-relaxed font-bold text-lg sm:text-xl bg-zinc-50 p-8 sm:p-10 rounded-[40px] italic border border-zinc-100"> &ldquo;{house.details}&rdquo; </p></div>
                     )}
                  </div>
                )}
            </div>

            {/* Voting Column - Natural scroll on Mobile */}
            <div className="w-full bg-zinc-50 p-6 sm:p-10 md:w-[400px] lg:w-[450px] md:border-l border-t md:border-t-0 flex flex-col">
                <div className="flex items-center justify-between mb-8 sm:mb-12">
                   <div>
                      <h3 className="font-black text-zinc-900 uppercase text-[10px] tracking-[0.3em] flex items-center gap-3"> <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Vos avis </h3>
                      <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1">{house.vote_count} votes</p>
                   </div>
                   <div className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tighter"> {house.avg_rating > 0 ? house.avg_rating.toFixed(1) : '-'}<span className="text-sm text-zinc-400 font-black ml-1">/4</span> </div>
                </div>

                {/* Inline Vote Form - Simple and effective */}
                <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xl mb-10 border border-zinc-100">
                   {!showVoteForm ? (
                     <button onClick={() => setShowVoteForm(true)} className="w-full py-4 bg-zinc-900 text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
                        <MessageCirclePlus className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{userVote ? 'Modifier mon avis' : 'Donner mon avis'}</span>
                     </button>
                   ) : (
                     <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between gap-2">
                          {ratings_icons.map(r => (
                            <button key={r.value} onClick={() => setTempRating(r.value)} className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-all ${tempRating === r.value ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-50 bg-zinc-50 text-zinc-400'}`}>
                              <span className="text-2xl mb-1">{r.icon}</span>
                              <span className="text-[7px] font-black uppercase">{r.label}</span>
                            </button>
                          ))}
                        </div>
                        <textarea value={tempComment} onChange={(e) => setTempComment(e.target.value)} placeholder="Un petit mot..." className="w-full bg-zinc-50 rounded-2xl p-4 text-sm font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 h-24 resize-none border border-transparent" />
                        <div className="flex gap-2">
                          <button onClick={handleVoteSubmit} disabled={isVoting || tempRating === 0} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{isVoting ? '...' : 'Valider'}</button>
                          <button onClick={() => setShowVoteForm(false)} className="px-4 py-4 text-zinc-400 font-bold text-[10px] uppercase">Annuler</button>
                        </div>
                     </div>
                   )}
                </div>

                <div className="space-y-4">
                   {house.votes.map(v => {
                      const voter = users.find(u => u.id === v.user_id);
                      const r = ratings_icons.find(x => x.value === v.rating);
                      return (
                        <div key={v.id} className="flex gap-5 p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                           <span className="text-3xl shrink-0">{r?.icon}</span>
                           <div className="min-w-0">
                              <div className="font-black text-zinc-900 text-xs uppercase tracking-tight">{voter?.username}</div>
                              {v.comment && <p className="text-zinc-500 text-xs font-bold leading-relaxed mt-2 italic">&ldquo;{v.comment}&rdquo;</p>}
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
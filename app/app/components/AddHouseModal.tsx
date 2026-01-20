'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { X, Upload, Link as LinkIcon, MapPin, Sparkles } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import heic2any from 'heic2any';

interface AddHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddHouseModal({ isOpen, onClose, onSuccess }: AddHouseModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const initialFormData = {
    title: '', address: '', link: '', image_url: '', price: '', bedrooms: '', beds: '', distance_sea_min: '', has_pool: false, has_jacuzzi: false, has_bbq: false, details: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData(initialFormData);
    setImageFile(null);
    setCoords(null);
    setLoading(false);
    setIsConverting(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isConverting || loading) return;
    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await handleFileUpload(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl; else { setLoading(false); return; }
      }
      const payload = {
        created_by: user.id, title: formData.title, address: formData.address, link: formData.link || null, image_url: finalImageUrl || null,
        price: formData.price ? parseFloat(formData.price) : null, bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        beds: formData.beds ? parseInt(formData.beds) : null, distance_sea_min: formData.distance_sea_min ? parseInt(formData.distance_sea_min) : null,
        has_pool: formData.has_pool, has_jacuzzi: formData.has_jacuzzi, has_bbq: formData.has_bbq, details: formData.details || null,
        lat: coords?.lat || null, lng: coords?.lng || null
      };
      const { error } = await supabase.from('houses').insert([payload]);
      if (error) throw error;
      alert("Villa publiée !");
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) { alert('Erreur'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col h-full max-h-[95vh] md:h-auto rounded-[40px] bg-white shadow-2xl overflow-hidden border border-zinc-100">
        
        <div className="flex items-center justify-between px-10 pt-10 pb-6">
          <div>
            <p className="font-black text-zinc-400 uppercase text-[10px] tracking-[0.3em] leading-none mb-2">Contribution</p>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">Nouvelle proposition</h2>
          </div>
          <button onClick={handleClose} className="rounded-full p-3 bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-colors shadow-sm">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form id="add-house-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-6 space-y-10 pb-12">
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">L&apos;essentiel</label>
              <input required placeholder="Nom de la villa..." value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full text-xl font-black border-none bg-zinc-50 rounded-[20px] px-6 py-5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Autocomplete apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} onPlaceSelected={(place) => { if (place.geometry?.location) { setFormData(prev => ({ ...prev, address: place.formatted_address || '' })); setCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }); } }} options={{ types: ['address'], componentRestrictions: { country: 'fr' } }} className="w-full px-6 py-5 bg-zinc-50 rounded-[20px] text-sm font-bold border-none focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Adresse complète..." />
                <input placeholder="Lien de l'annonce..." value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} className="w-full px-6 py-5 bg-zinc-50 rounded-[20px] text-sm font-bold border-none focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[ { l: 'Budget', k: 'price' }, { l: 'Chambres', k: 'bedrooms' }, { l: 'Couchages', k: 'beds' }, { l: 'Min Mer', k: 'distance_sea_min' } ].map((f) => (
                <div key={f.k} className="bg-zinc-50 p-5 rounded-[20px] border border-zinc-100">
                  <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">{f.l}</label>
                  <input type="number" placeholder="0" value={(formData as any)[f.k]} onChange={(e) => setFormData({...formData, [f.k]: e.target.value})} className="w-full bg-transparent border-none p-0 text-xl font-black focus:ring-0 outline-none text-zinc-900" />
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-200 rounded-[32px] cursor-pointer hover:bg-zinc-50 transition-all relative">
                  {isConverting ? (
                    <div className="flex flex-col items-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div><span className="text-[10px] font-black uppercase text-indigo-600">Conversion...</span></div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-zinc-300 mb-3" />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-6 text-center">{imageFile ? imageFile.name : 'Choisir une photo'}</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*,.heic,.heif,.avif" onChange={handleFileChange} />
                </label>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Commodités</label>
                 <div className="space-y-2">
                   {[ { k: 'has_pool', l: 'Piscine' }, { k: 'has_jacuzzi', l: 'Jacuzzi' }, { k: 'has_bbq', l: 'Barbecue' } ].map((eq) => (
                     <label key={eq.k} className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer border-2 ${ (formData as any)[eq.k] ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl' : 'border-zinc-50 bg-zinc-50 text-zinc-400' }`}>
                        <input type="checkbox" checked={(formData as any)[eq.k]} onChange={(e) => setFormData({...formData, [eq.k]: e.target.checked})} className="hidden" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{eq.l}</span>
                     </label>
                   ))}
                 </div>
              </div>
            </div>

            <div className="space-y-3 pb-6">
               <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Notes ou avis</label>
               <textarea placeholder="Partage tes premières impressions..." value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} className="w-full bg-zinc-50 rounded-[32px] p-8 text-base font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 min-h-[150px] shadow-inner" />
            </div>
          </div>
        </form>

        <div className="p-10 bg-zinc-50/50 border-t border-zinc-100">
          <button type="submit" form="add-house-form" disabled={loading || isConverting} className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
            {loading ? 'Envoi en cours...' : 'Publier la proposition'}
          </button>
        </div>
      </div>
    </div>
  );
}

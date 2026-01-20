'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { X, Upload, Link as LinkIcon, MapPin, Sparkles } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';

interface AddHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddHouseModal({ isOpen, onClose, onSuccess }: AddHouseModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    link: '',
    image_url: '',
    price: '',
    bedrooms: '',
    beds: '',
    distance_sea_min: '',
    has_pool: false,
    has_jacuzzi: false,
    has_bbq: false,
    details: ''
  });

  if (!isOpen) return null;

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `house-images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('vacances').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('vacances').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let finalImageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await handleFileUpload(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const payload = {
        created_by: user.id,
        title: formData.title,
        address: formData.address,
        link: formData.link || null,
        image_url: finalImageUrl || null,
        price: formData.price ? parseFloat(formData.price) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        beds: formData.beds ? parseInt(formData.beds) : null,
        distance_sea_min: formData.distance_sea_min ? parseInt(formData.distance_sea_min) : null,
        has_pool: formData.has_pool,
        has_jacuzzi: formData.has_jacuzzi,
        has_bbq: formData.has_bbq,
        details: formData.details || null,
        lat: coords?.lat || null, 
        lng: coords?.lng || null
      };

      const { error } = await supabase.from('houses').insert([payload]);
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      alert('Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-xl flex-col rounded-[32px] bg-white shadow-2xl overflow-hidden border border-zinc-100">
        
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Nouvelle proposition</h2>
            <p className="text-zinc-500 text-sm font-medium">Partagez une pépite avec le groupe</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-zinc-100 transition-colors">
            <X className="h-6 w-6 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-4 space-y-8 max-h-[75vh]">
          
          {/* Section 1: L'essentiel */}
          <div className="space-y-4">
            <div className="grid gap-4">
              <input 
                required 
                placeholder="Nom de la villa (ex: Le Mas des Oliviers)" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full text-lg font-bold border-none bg-zinc-50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
              <div className="relative">
                <MapPin className="absolute left-4 top-4 h-5 w-5 text-zinc-400" />
                <Autocomplete
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  onPlaceSelected={(place) => {
                    if (place.geometry?.location) {
                      setFormData(prev => ({ ...prev, address: place.formatted_address || '' }));
                      setCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
                    }
                  }}
                  options={{ types: ['address'], componentRestrictions: { country: 'fr' } }}
                  className="w-full pl-12 pr-5 py-4 bg-zinc-50 rounded-2xl text-sm font-medium border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Adresse précise..."
                />
              </div>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-4 h-5 w-5 text-zinc-400" />
                <input 
                  placeholder="Lien de l'annonce (Airbnb, Abritel...)" 
                  value={formData.link}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-zinc-50 rounded-2xl text-sm font-medium border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Chiffres clés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[ 
              { label: 'Prix (€)', key: 'price', placeholder: '0' },
              { label: 'Chambres', key: 'bedrooms', placeholder: '0' },
              { label: 'Couchages', key: 'beds', placeholder: '0' },
              { label: 'Mer (min)', key: 'distance_sea_min', placeholder: '0' },
            ].map((f) => (
              <div key={f.key} className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 ml-1">{f.label}</label>
                <input 
                  type="number"
                  placeholder={f.placeholder}
                  value={(formData as any)[f.key]}
                  onChange={(e) => setFormData({...formData, [f.key]: e.target.value})}
                  className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none text-zinc-900"
                />
              </div>
            ))}
          </div>

          {/* Section 3: Photo & Équipements */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Photo principale</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-colors">
                <Upload className="h-6 w-6 text-zinc-400 mb-2" />
                <span className="text-xs font-bold text-zinc-500">{imageFile ? imageFile.name : 'Uploader une photo'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Équipements</label>
               <div className="space-y-2">
                 {[ 
                   { key: 'has_pool', label: 'Piscine' },
                   { key: 'has_jacuzzi', label: 'Jacuzzi' },
                   { key: 'has_bbq', label: 'Barbecue' },
                 ].map((eq) => (
                   <label key={eq.key} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl cursor-pointer hover:bg-zinc-100 transition-all border border-transparent active:scale-95">
                      <input 
                        type="checkbox" 
                        checked={(formData as any)[eq.key]} 
                        onChange={(e) => setFormData({...formData, [eq.key]: e.target.checked})}
                        className="w-5 h-5 rounded-md border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-zinc-700">{eq.label}</span>
                   </label>
                 ))}
               </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="space-y-2 pb-4">
             <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-center block">Notes ou commentaires</label>
             <textarea 
               placeholder="Points forts, points faibles, ou infos de groupe..."
               value={formData.details}
               onChange={(e) => setFormData({...formData, details: e.target.value})}
               className="w-full bg-zinc-50 rounded-2xl p-5 text-sm font-medium border-none focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] transition-all"
             />
          </div>
        </form>

        <div className="p-8 bg-zinc-50/50 border-t border-zinc-100 flex gap-4">
          <button 
            type="submit" 
            form="add-house-form"
            disabled={loading}
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Publier la proposition'}
          </button>
        </div>
      </div>
    </div>
  );
}
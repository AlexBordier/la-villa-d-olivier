'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { X, Upload, Link as LinkIcon, MapPin, Sparkles, Wand2, PenLine, ArrowLeft, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import heic2any from 'heic2any';
import { scrapeUrl } from '../../actions/scrape-url';

const GoogleAutocomplete = dynamic(() => import('./GoogleAutocomplete'), { 
  ssr: false,
  loading: () => <div className="w-full h-14 bg-zinc-50 rounded-[20px] animate-pulse" />
});

interface AddHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'selection' | 'manual' | 'automatic';

export default function AddHouseModal({ isOpen, onClose, onSuccess }: AddHouseModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [mode, setMode] = useState<Mode>('selection');
  const [scrapeUrlInput, setScrapeUrlInput] = useState('');

  const initialFormData = {
    title: '', address: '', link: '', image_url: '', price: '', bedrooms: '', beds: '', distance_sea_min: '', has_pool: false, has_jacuzzi: false, has_bbq: false, details: '', other_amenities: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [showOtherAmenitiesField, setShowOtherAmenitiesField] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData(initialFormData);
    setImageFile(null);
    setCoords(null);
    setLoading(false);
    setIsConverting(false);
    setShowOtherAmenitiesField(false);
    setMode('selection');
    setScrapeUrlInput('');
    setScrapingLoading(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrlInput) return;
    setScrapingLoading(true);

    try {
      const result = await scrapeUrl(scrapeUrlInput);
      
      if (!result.success || !result.data) {
        alert("Impossible d'analyser ce lien. Essayez la saisie manuelle.");
        setScrapingLoading(false);
        return;
      }

      const data = result.data;
      
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        link: scrapeUrlInput,
        address: data.address || prev.address,
        image_url: data.image_url || prev.image_url,
        price: data.price ? data.price.toString() : prev.price,
        bedrooms: data.bedrooms ? data.bedrooms.toString() : prev.bedrooms,
        beds: data.beds ? data.beds.toString() : prev.beds,
        details: data.description || prev.details,
        has_pool: data.has_pool !== undefined ? data.has_pool : prev.has_pool,
        has_jacuzzi: data.has_jacuzzi !== undefined ? data.has_jacuzzi : prev.has_jacuzzi,
        has_bbq: data.has_bbq !== undefined ? data.has_bbq : prev.has_bbq,
        other_amenities: data.other_amenities || prev.other_amenities
      }));

      if (data.lat && data.lng) {
        setCoords({ lat: data.lat, lng: data.lng });
      }

      setMode('manual'); // Switch to manual form with pre-filled data

    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de l'analyse.");
    } finally {
      setScrapingLoading(false);
    }
  };

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
        other_amenities: formData.other_amenities || null, // New field
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

  const renderSelection = () => (
    <div className="p-10 flex flex-col items-center justify-center space-y-8 h-full min-h-[400px]">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Comment ajouter cette maison ?</h3>
        <p className="text-zinc-500 font-medium">Choisissez la méthode qui vous convient le mieux.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <button onClick={() => setMode('automatic')} className="group flex flex-col items-center p-8 rounded-[32px] bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-600 transition-all duration-300">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <span className="text-lg font-black text-indigo-900 group-hover:text-white mb-2">Magique</span>
          <span className="text-xs text-indigo-400 group-hover:text-indigo-100 font-bold uppercase tracking-widest text-center">Via un lien (Airbnb, etc.)</span>
        </button>

        <button onClick={() => setMode('manual')} className="group flex flex-col items-center p-8 rounded-[32px] bg-zinc-50 border-2 border-zinc-100 hover:border-zinc-900 hover:bg-zinc-900 transition-all duration-300">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <PenLine className="w-8 h-8 text-zinc-900" />
          </div>
          <span className="text-lg font-black text-zinc-900 group-hover:text-white mb-2">Manuel</span>
          <span className="text-xs text-zinc-400 group-hover:text-zinc-400 font-bold uppercase tracking-widest text-center">Remplir le formulaire</span>
        </button>
      </div>
    </div>
  );

  const renderAutomatic = () => (
    <div className="p-10 flex flex-col items-center justify-center space-y-8 h-full min-h-[400px]">
      <div className="w-full flex items-center justify-start">
         <button onClick={() => setMode('selection')} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 font-bold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
         </button>
      </div>
      
      <div className="text-center space-y-2 max-w-md">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-4">
            <Wand2 className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Collez le lien ici</h3>
        <p className="text-zinc-500 font-medium text-sm">Nous allons essayer de récupérer toutes les infos (photos, prix, description...) pour vous.</p>
      </div>

      <form onSubmit={handleScrape} className="w-full max-w-md space-y-4">
        <input 
          autoFocus
          placeholder="https://www.airbnb.fr/rooms/..." 
          value={scrapeUrlInput} 
          onChange={(e) => setScrapeUrlInput(e.target.value)} 
          className="w-full text-lg font-bold border-2 border-zinc-100 bg-zinc-50 rounded-[20px] px-6 py-5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none text-center" 
        />
        <button 
          type="submit" 
          disabled={!scrapeUrlInput || scrapingLoading} 
          className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {scrapingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {scrapingLoading ? 'Analyse en cours...' : 'Lancer la magie'}
        </button>
      </form>
    </div>
  );

  const renderManualForm = () => (
    <>
      <div className="flex items-center justify-between px-10 pt-10 pb-6">
          <div className="flex items-center gap-4">
             {mode === 'manual' && scrapeUrlInput && (
                <button onClick={() => setMode('selection')} className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
             )}
             <div>
                <p className="font-black text-zinc-400 uppercase text-[10px] tracking-[0.3em] leading-none mb-2">Contribution</p>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">Nouvelle proposition</h2>
             </div>
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
                {isMounted && (
                  <GoogleAutocomplete 
                    onPlaceSelected={(place) => { if (place.geometry?.location) { setFormData(prev => ({ ...prev, address: place.formatted_address || '' })); setCoords({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }); } }} 
                    className="w-full px-6 py-5 bg-zinc-50 rounded-[20px] text-sm font-bold border-none focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="Adresse complète..."
                    initialValue={formData.address}
                  />
                )}
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
                
                {formData.image_url && !imageFile ? (
                   <div className="relative w-full h-40 rounded-[32px] overflow-hidden group">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData({...formData, image_url: ''})} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">Image du lien</div>
                   </div>
                ) : (
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
                )}
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
                   <label className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer border-2 ${showOtherAmenitiesField || formData.other_amenities ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl' : 'border-zinc-50 bg-zinc-50 text-zinc-400'}`}>
                      <input type="checkbox" checked={showOtherAmenitiesField} onChange={(e) => setShowOtherAmenitiesField(e.target.checked)} className="hidden" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Autres</span>
                   </label>
                 </div>
                 {(showOtherAmenitiesField || formData.other_amenities) && (
                   <textarea placeholder="Ex: Sauna, vue mer, grand jardin..." value={formData.other_amenities || ''} onChange={(e) => setFormData({...formData, other_amenities: e.target.value})} className="w-full bg-zinc-50 rounded-2xl p-5 text-sm font-bold border-none focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] shadow-inner mt-4" />
                 )}
              </div>
            </div>

            <div className="space-y-3 pb-6">
               <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Notes ou avis</label>
               <textarea placeholder="Partage tes premières impressions..." value={formData.details || ''} onChange={(e) => setFormData({...formData, details: e.target.value})} className="w-full bg-zinc-50 rounded-[32px] p-8 text-base font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900 min-h-[150px] shadow-inner" />
            </div>
          </div>
        </form>

        <div className="p-10 bg-zinc-50/50 border-t border-zinc-100">
          <button type="submit" form="add-house-form" disabled={loading || isConverting} className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
            {loading ? 'Envoi en cours...' : 'Publier la proposition'}
          </button>
        </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col h-full max-h-[95vh] md:h-auto rounded-[40px] bg-white shadow-2xl overflow-hidden border border-zinc-100">
        
        {mode === 'selection' && renderSelection()}
        {mode === 'automatic' && renderAutomatic()}
        {mode === 'manual' && renderManualForm()}
        
      </div>
    </div>
  );
}
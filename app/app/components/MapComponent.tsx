'use client';

import { useEffect, useState } from 'react';
import { HouseWithVotes } from '../../lib/types';

interface MapComponentProps {
  houses: HouseWithVotes[];
  onMarkerClick: (house: HouseWithVotes) => void;
}

export default function MapComponent({ houses, onMarkerClick }: MapComponentProps) {
  const [Leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Charger le CSS et les bibliothèques uniquement côté client
      const load = async () => {
        // @ts-ignore
        await import('leaflet/dist/leaflet.css');
        const L = await import('leaflet');
        const ReactLeaflet = await import('react-leaflet');
        
        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        setLeaflet({ ...ReactLeaflet, customIcon });
      };
      load();
    }
  }, []);

  if (!Leaflet) {
    return <div className="h-full w-full bg-zinc-50 flex items-center justify-center text-[10px] font-black uppercase text-zinc-300 tracking-[0.3em]">Chargement des données cartographiques...</div>;
  }

  const { MapContainer, TileLayer, Marker, Popup, customIcon } = Leaflet;
  const defaultCenter: [number, number] = [46.603354, 1.888334];

  return (
    <MapContainer center={defaultCenter} zoom={6} className="h-full w-full rounded-xl z-0" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {houses.map((house) => (
        house.lat && house.lng ? (
          <Marker 
            key={house.id} 
            position={[house.lat, house.lng]} 
            icon={customIcon}
            eventHandlers={{ click: () => onMarkerClick(house) }}
          >
            <Popup>
              <div className="text-center p-2 min-w-[120px]">
                <h3 className="font-black text-xs mb-1 uppercase tracking-tight text-zinc-900">{house.title}</h3>
                <p className="text-xs font-bold text-indigo-600 mb-2">{house.price}€</p>
                <button onClick={() => onMarkerClick(house)} className="w-full py-2 bg-zinc-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-600 transition-colors">Détails</button>
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
}
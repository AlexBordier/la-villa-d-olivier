'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { HouseWithVotes } from '../../lib/types';
import L from 'leaflet';

// Fix pour les icônes Leaflet par défaut qui manquent souvent dans les builds Webpack/Next
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = L.icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapComponentProps {
  houses: HouseWithVotes[];
  onMarkerClick: (house: HouseWithVotes) => void;
}

export default function MapComponent({ houses, onMarkerClick }: MapComponentProps) {
  
  // Centre par défaut (France approximatif ou centre des maisons)
  const defaultCenter: [number, number] = [46.603354, 1.888334];
  const zoom = 6;

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={zoom} 
      className="h-full w-full rounded-xl z-0"
    >
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
            eventHandlers={{
              click: () => onMarkerClick(house),
            }}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold">{house.title}</h3>
                <p className="text-sm">{house.price}€</p>
                <button 
                  onClick={() => onMarkerClick(house)}
                  className="mt-2 text-xs text-blue-600 underline"
                >
                  Voir détails
                </button>
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
}

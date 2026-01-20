'use client';

import { useEffect, useRef } from 'react';

interface GoogleAutocompleteProps {
  onPlaceSelected: (place: any) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export default function GoogleAutocomplete({ onPlaceSelected, defaultValue, placeholder, className }: GoogleAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCompleteRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    const initAutocomplete = () => {
      if (!active || !inputRef.current || !window.google?.maps?.places) return;

      try {
        autoCompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'fr' },
          fields: ['address_components', 'geometry', 'formatted_address'],
        });

        autoCompleteRef.current.addListener('place_changed', () => {
          const place = autoCompleteRef.current?.getPlace();
          if (place && active) onPlaceSelected(place);
        });
      } catch (err) {
        console.error("Erreur init Google Autocomplete:", err);
      }
    };

    const loadScript = () => {
      if (typeof window === 'undefined') return;
      
      if (window.google?.maps?.places) {
        initAutocomplete();
        return;
      }

      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.id = 'google-maps-script';
        script.async = true;
        document.head.appendChild(script);
        script.onload = () => { if (active) initAutocomplete(); };
      } else {
        existingScript.addEventListener('load', () => { if (active) initAutocomplete(); });
      }
    };

    loadScript();

    return () => {
      active = false;
      // On évite de toucher à window.google ici pour prévenir les crashs au démontage
    };
  }, [onPlaceSelected]);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
    />
  );
}

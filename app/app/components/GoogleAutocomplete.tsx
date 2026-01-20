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
  const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const loadScript = (url: string, callback: () => void) => {
      if (typeof window === 'undefined') return;
      
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.id = 'google-maps-script';
        document.head.appendChild(script);
        script.onload = () => {
          if (callback) callback();
        };
      } else {
        if (callback) callback();
      }
    };

    loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`,
      () => {
        if (inputRef.current) {
          autoCompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'fr' },
            fields: ['address_components', 'geometry', 'formatted_address'],
          });

          autoCompleteRef.current.addListener('place_changed', () => {
            const place = autoCompleteRef.current?.getPlace();
            if (place) onPlaceSelected(place);
          });
        }
      }
    );
  }, [onPlaceSelected]);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
    />
  );
}

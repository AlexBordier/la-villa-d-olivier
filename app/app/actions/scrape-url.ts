'use server';

import * as cheerio from 'cheerio';
import he from 'he';

export type ScrapedData = {
  title?: string;
  description?: string;
  image_url?: string;
  price?: number;
  address?: string;
  lat?: number;
  lng?: number;
  bedrooms?: number;
  beds?: number;
  has_pool?: boolean;
  has_jacuzzi?: boolean;
  has_bbq?: boolean;
  other_amenities?: string;
};

export async function scrapeUrl(url: string): Promise<{ success: boolean; data?: ScrapedData; error?: string }> {
  if (!url) return { success: false, error: "URL manquante" };

  try {
    // 1. Récupération du HTML avec des headers "navigateur" pour éviter les blocages (403)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 0 } // Pas de cache pour le scraping
    });

    if (!response.ok) {
      return { success: false, error: `Erreur HTTP: ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const data: ScrapedData = {};

    // --- STRATÉGIE 1 : JSON-LD (Données structurées - Prioritaire pour LeBonCoin, Abritel...) ---
    const scripts = $('script[type="application/ld+json"]');
    
    scripts.each((_, script) => {
      try {
        const jsonContent = $(script).html();
        if (!jsonContent) return;
        
        const jsonData = JSON.parse(jsonContent);
        // On cherche un objet de type VacationRental, Product, ou Accommodation
        const entities = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const entity of entities) {
          if (['VacationRental', 'Accommodation', 'Product', 'Place'].includes(entity['@type']) || entity['@type']?.includes('Lodging')) {
            
            // Titre
            if (entity.name && !data.title) data.title = he.decode(entity.name);
            
            // Description
            if (entity.description && !data.description) {
              // Nettoyage des balises HTML basiques dans la description
              data.description = he.decode(entity.description.replace(/<[^>]*>?/gm, ' ')).trim();
            }

            // Image
            if (entity.image) {
              if (Array.isArray(entity.image) && entity.image.length > 0) {
                data.image_url = entity.image[0];
              } else if (typeof entity.image === 'string') {
                data.image_url = entity.image;
              }
            }

            // Adresse
            if (entity.address) {
              const addr = entity.address;
              const parts = [];
              if (addr.streetAddress) parts.push(addr.streetAddress);
              if (addr.postalCode) parts.push(addr.postalCode);
              if (addr.addressLocality) parts.push(addr.addressLocality);
              if (parts.length > 0) data.address = parts.join(', ');
            }

            // GPS
            if (entity.geo || (entity.latitude && entity.longitude)) {
              const lat = entity.geo?.latitude || entity.latitude;
              const lng = entity.geo?.longitude || entity.longitude;
              if (lat) data.lat = parseFloat(lat);
              if (lng) data.lng = parseFloat(lng);
            }
            // Fallback GPS au niveau racine (LeBonCoin le met parfois à la racine)
            if (!data.lat && jsonData.latitude) data.lat = parseFloat(jsonData.latitude);
            if (!data.lng && jsonData.longitude) data.lng = parseFloat(jsonData.longitude);

            // Équipements (AmenityFeature)
            if (entity.amenityFeature) {
              const amenities = Array.isArray(entity.amenityFeature) 
                ? entity.amenityFeature.map((a: any) => a.name ? a.name.toLowerCase() : '') 
                : [];
              
              if (amenities.some((a: string) => a.includes('pool') || a.includes('piscine') || a.includes('swimming_pool'))) data.has_pool = true;
              if (amenities.some((a: string) => a.includes('jacuzzi') || a.includes('spa') || a.includes('hot tub'))) data.has_jacuzzi = true;
              if (amenities.some((a: string) => a.includes('bbq') || a.includes('barbecue') || a.includes('grill'))) data.has_bbq = true;
            }
            
            // Capacité (Occupancy)
            if (entity.occupancy && entity.occupancy.value) {
                // Mapping approximatif: Capacité = often max beds/guests
                data.beds = parseInt(entity.occupancy.value); 
            }
          }
        }
      } catch (e) {
        console.error("Erreur parsing JSON-LD", e);
      }
    });

    // --- STRATÉGIE 2 : OpenGraph (Fallback standard) ---
    if (!data.title) {
      data.title = $('meta[property="og:title"]').attr('content') || $('title').text();
    }
    if (!data.description) {
      data.description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    }
    if (!data.image_url) {
      data.image_url = $('meta[property="og:image"]').attr('content');
    }

    // --- STRATÉGIE 3 : Analyse sémantique simple sur le texte (Regex) ---
    // Si on n'a pas trouvé via JSON-LD, on cherche dans la description brute
    const fullText = (data.title + ' ' + data.description).toLowerCase();

    if (data.has_pool === undefined) data.has_pool = /piscine|pool|bassin/i.test(fullText);
    if (data.has_jacuzzi === undefined) data.has_jacuzzi = /jacuzzi|spa|bain à remous/i.test(fullText);
    if (data.has_bbq === undefined) data.has_bbq = /barbecue|bbq|plancha/i.test(fullText);

    // Extraction Prix (très approximatif, on cherche "X €" ou "X EUR")
    // Souvent difficile car dynamique, mais on tente
    if (!data.price) {
        const priceMatch = html.match(/(\d+[\s.,]?\d*)\s?€/);
        if (priceMatch) {
            // On ne prend que si ça semble cohérent (pas une année 2024)
            const p = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'));
            if (p > 50 && p < 10000) data.price = p; 
        }
    }

    // Extraction Chambres (ex: "3 chambres")
    if (!data.bedrooms) {
        const bedRoomMatch = fullText.match(/(\d+)\s?chambre/i);
        if (bedRoomMatch) data.bedrooms = parseInt(bedRoomMatch[1]);
    }
    
    // Nettoyage final
    if (data.title) data.title = data.title.substring(0, 100); // Limite DB
    
    return { success: true, data };

  } catch (error: any) {
    console.error("Scraping error:", error);
    return { success: false, error: error.message };
  }
}

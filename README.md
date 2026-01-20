# 🏡 La Villa d'Olivier

Plateforme collaborative pour organiser des vacances entre amis (groupe de 11 personnes). Permet de centraliser des propositions de maisons, de les visualiser sur une carte et de voter collectivement.

## 🚀 Fonctionnalités

- **Authentification simplifiée** : Pas de mot de passe, choix du membre via une interface dédiée.
- **Tableau de Bord** : 
  - **Podium** : Mise en avant automatique des 3 maisons les mieux notées.
  - **Vue Liste** : Grille contrastée des propositions avec détails rapides.
  - **Vue Carte** : Géolocalisation interactive via Leaflet.
- **Gestion des Maisons** :
  - Ajout avec **Google Places Autocomplete** pour des adresses précises.
  - Upload d'images direct avec support du format **HEIC/AVIF/PNG/JPG**.
  - Édition complète et suppression sécurisée.
- **Système de Vote** : Notation sur 4 niveaux avec commentaires détaillés des membres.

## 🛠 Tech Stack

- **Frontend** : Next.js 15+ (App Router), Tailwind CSS, Lucide React.
- **Backend/Base de données** : Supabase (PostgreSQL).
- **Stockage** : Supabase Storage (Bucket public `vacances`).
- **Cartographie** : React Leaflet & Google Places API.
- **Déploiement** : Vercel.

## 📖 Installation & Maintenance

### Pré-requis
- Node.js & npm.
- Un projet Supabase avec les tables `app_users`, `houses`, `votes`.
- Une clé API Google Cloud (Places API activée).

### Configuration locale
Créez un fichier `app/.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=votre_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_cle_google
```

### Déploiement
Le projet est configuré pour un déploiement automatique sur Vercel.
Pour un déploiement manuel via la CLI :
```bash
npx vercel --prod
```

### Base de données (Supabase CLI)
Pour synchroniser la structure :
```bash
npx supabase db push
```

---
*Projet stabilisé et finalisé en Janvier 2026.*

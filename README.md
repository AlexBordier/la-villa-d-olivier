# 🏡 La Villa d'Olivier

Plateforme collaborative haut de gamme pour l'organisation de vacances en groupe. Conçue pour simplifier le choix, la visualisation et le vote des maisons de vacances.

## 🌟 Points Forts du Produit

- **UI Premium** : Design minimaliste, contrasté et aéré inspiré des standards modernes.
- **Podium Dynamique** : Mise en avant automatique du Top 3 des villas selon les votes du groupe.
- **Expérience Mobile First** : Entièrement responsive, optimisé pour la saisie et la consultation sur smartphone.
- **Intelligence Géographique** : Autocomplete Google Places pour des adresses précises et un placement automatique sur carte.
- **Gestion d'Images Avancée** : Support natif du format HEIC (iPhone), AVIF, WebP, PNG et JPG avec conversion automatique.

## 🛠 Architecture Technique

- **Frontend** : Next.js 15 (App Router)
- **Langage** : TypeScript (Typage strict pour la maintenance)
- **Style** : Tailwind CSS (Système de design Zinc/Indigo)
- **Base de données** : Supabase (PostgreSQL)
- **Stockage** : Supabase Storage (Bucket `vacances` avec RLS ouvertes)
- **Cartographie** : Leaflet & Google Maps API
- **Déploiement** : Vercel (CI/CD)

## 📁 Structure du Projet

```text
├── app/                  # Application Next.js
│   ├── app/              # Routes et Pages
│   │   ├── components/   # Composants UI (Dashboard, Modales, Map)
│   │   ├── context/      # Gestion de l'état utilisateur
│   │   └── lib/          # Client Supabase
│   └── lib/              # Types TypeScript partagés
├── supabase/             # Configuration Backend
│   └── migrations/       # Historique de la structure DB & Storage
└── README.md             # Documentation principale
```

## 🔧 Maintenance & Déploiement

### Variables d'environnement nécessaires
```env
NEXT_PUBLIC_SUPABASE_URL=      # URL API Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Clé publique Supabase
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY= # Clé Google Cloud (Places + Maps)
```

### Commandes utiles
- `npm run dev` : Lancer le développement local.
- `npm run build` : Vérifier la compilation production.
- `npx vercel --prod` : Déployer manuellement sur Vercel.
- `npx supabase db push` : Synchroniser la structure de la base de données.

## 🔐 Sécurité & RLS
Le projet utilise des politiques de sécurité (Row Level Security) sur Supabase pour :
1.  Permettre la lecture publique des maisons et des votes.
2.  Permettre l'upload d'images dans le bucket `vacances`.
3.  Permettre l'ajout et la modification des données par les membres du groupe.

---
*Développé avec précision pour une expérience utilisateur sans faille.*
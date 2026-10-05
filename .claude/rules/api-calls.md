---
paths:
  - 'src/**/*.{js,jsx}'
---

# Appels API et authentification

- **Tout appel HTTP passe par `src/services/api.js`** (instance axios centrale ou un objet `xxxAPI` qui l'utilise). Jamais de `fetch` ni d'`axios` importé directement dans un composant.
- Ne jamais construire d'en-tête `Authorization: Bearer …` à la main : l'intercepteur s'en charge et gère le refresh sur 401.
- **Aucun token** dans `localStorage`, `sessionStorage`, Redux ou un état React. L'access token vit dans `services/api.js`, le refresh token dans un cookie HttpOnly.
- Les erreurs d'API s'affichent via `getApiErrorMessage(error)` (format DRF `{champ: [messages]}` / `{detail}`), jamais `error.message` brut ni un `console.error` seul.
- Coordonnées des boxes échangées avec le backend **normalisées 0–1** ; conversion pixels ↔ normalisé dans des fonctions pures testées.
- Le rôle global (`user.role`) sert à l'affichage et au routage ; le backend reste la source de vérité des droits (gérer 403/404 proprement).
- Un nouvel endpoint s'ajoute dans l'objet `xxxAPI` correspondant de `services/api.js`, sans `/` initial (`'projects/'`).

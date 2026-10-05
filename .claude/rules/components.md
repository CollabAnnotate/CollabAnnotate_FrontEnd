---
paths:
  - 'src/**/*.{js,jsx}'
---

# Composants React

- Fichier `.jsx` dès qu'il contient du JSX ; un composant principal par fichier, nommé comme le fichier.
- **Jamais de composant défini dans le corps d'un autre composant** (règle `react-hooks/static-components`) : le sortir au niveau du module ou dans son propre fichier.
- Pas de `setState` synchrone dans un `useEffect` pour dériver un état d'une prop : calculer pendant le render, ou utiliser une `key`.
- Mises à jour d'état dépendant de l'état précédent : forme fonctionnelle `setItems((prev) => …)`.
- Pas d'effet de bord dans le render (`URL.createObjectURL`, appels réseau) : dans un handler ou un effet avec nettoyage.
- Chaque écran qui charge des données gère les trois états : **chargement**, **erreur** (message lisible), **vide**.
- Logique non visuelle (calculs de coordonnées, filtres, formatage) dans des fonctions pures exportées et testées unitairement.
- Ne pas ajouter de nouvel avertissement ESLint dans un fichier modifié ; corriger ceux de la zone touchée quand c'est simple.
- Ne pas modifier les composants morts (`AnnotationInterface`, `BoundingBoxEditor`, `common/Navigation`, `utils/canvasUtils`, `users/UserProfile.jsx`) en croyant changer l'application.

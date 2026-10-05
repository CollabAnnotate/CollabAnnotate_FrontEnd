---
name: review
description: Étape 4 du workflow TDD frontend — fait relire la branche par /code-review puis applique la checklist propre au dépôt (appels API, tokens, MUI 9, règles React, accessibilité, tests), présente les remarques et corrige après validation. À utiliser après /implement dans CollabAnnotate_FrontEnd.
---

# Review de la branche

## 1. Revues automatiques (en parallèle)

Dans un même message, lancer :

- l'agent **`ui-reviewer`** (règles React, MUI 9, accessibilité, états, appels API) ;
- l'agent **`test-reviewer`** (tests ↔ plan validé ↔ critères de l'issue) ;
- le skill intégré **`/code-review`** sur le diff de la branche (`git diff main...HEAD`).

Ces relecteurs ont un contexte neuf : ils ne partagent pas les angles morts de l'auteur. Ils ne modifient rien. Fusionner leurs rapports en dédoublonnant.

## 2. Checklist CollabAnnotate (vérifier chaque point sur le diff)

- [ ] **API** : appels via `services/api.js` uniquement, pas d'en-tête `Bearer` manuel, aucun token stocké, erreurs affichées via `getApiErrorMessage`.
- [ ] **React** : pas de composant défini dans un composant, pas de `setState` synchrone dans un effet, mises à jour fonctionnelles, pas d'effet de bord dans le render, nettoyage des effets (timers, `URL.createObjectURL`).
- [ ] **États** : chargement, erreur et vide gérés ; l'écran reste utilisable après une erreur.
- [ ] **MUI 9** : `Grid size`, `slotProps`, `sx`, couleurs du thème.
- [ ] **Accessibilité** : `aria-label` sur les `IconButton`, éléments cliquables atteignables au clavier, libellés de formulaire.
- [ ] **Coordonnées** : normalisées 0–1 à l'échange avec l'API, conversions dans des fonctions pures testées.
- [ ] **Tests** : chaque critère d'acceptation a son test, comportement testé (pas l'implémentation), MSW pour le réseau, aucun test affaibli.
- [ ] **Lint** : aucun nouvel avertissement ESLint dans les fichiers touchés, `console.log` retirés.
- [ ] **Contrat d'API** : cohérent avec le backend actuel (ou PR backend mergée).

## 3. ✋ Présenter et attendre la validation

Présenter les remarques classées (bloquant / à corriger / suggestion), chacune avec fichier:ligne et explication pédagogique. **S'arrêter** et attendre que l'utilisateur choisisse ce qu'on corrige.

## 4. Corriger

Pour chaque remarque retenue : test d'abord si c'est un bug, puis correctif. Relancer `npm run test:run`, `npm run lint`, `npm run format`, puis :

```powershell
git commit -am "fix: corrections de review" -m "Refs #<n>"
```

Enchaîner avec `/merge`.

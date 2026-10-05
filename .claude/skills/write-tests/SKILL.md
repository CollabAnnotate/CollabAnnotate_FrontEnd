---
name: write-tests
description: Étape 2 du workflow TDD frontend — écrit les tests Vitest/Testing Library/MSW du plan validé et vérifie qu'ils échouent pour la bonne raison (phase rouge), sans toucher au code de production. À utiliser après /plan-tests dans CollabAnnotate_FrontEnd.
---

# Écrire les tests (phase rouge)

Pré-requis : un plan de tests validé par l'utilisateur (commentaire sur l'issue, `gh issue view <n> --comments`) et la branche de l'issue active.

## 1. Écrire

- Respecter `.claude/rules/testing.md` : `renderWithProviders` (`src/test/render.jsx`), réseau simulé avec MSW (`server.use(...)`, `apiUrl(...)` de `src/test/server.js`), interactions avec `user` (user-event), requêtes par rôle / texte.
- Fichier de test à côté du composant (`Composant.test.jsx`). Un test par ligne du plan, avec le même nom.
- Ne **pas** modifier le code de production à cette étape. Exception : extraire une fonction pure dans un module vide (signature seule) pour pouvoir l'importer.

## 2. Vérifier la phase rouge

```powershell
npm run test:run -- src/chemin/Composant.test.jsx
```

- Chaque nouveau test doit **échouer pour la raison attendue** (texte absent, mauvaise requête envoyée), pas pour une erreur d'import, de provider manquant ou de requête MSW non déclarée.
- Un test qui passe déjà : non-régression (le signaler) ou test faux (le corriger).
- `npm run lint` sans nouvel avertissement dans les fichiers de test, `npm run format`.

## 3. Committer

```powershell
git add src
git commit -m "test: <ce que les tests décrivent>" -m "Refs #<n>"
```

## 4. Rendre compte

Montrer à l'utilisateur le tableau « test → statut (rouge/vert) → raison de l'échec », expliquer ce que chaque test vérifie, puis enchaîner avec `/implement`.

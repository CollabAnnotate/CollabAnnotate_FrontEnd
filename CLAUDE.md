# CLAUDE.md — Frontend CollabAnnotate

SPA React 19 (Vite) + Material UI 9 + Redux Toolkit + Konva, cliente de l'API Django du dépôt séparé `../CollabAnnotate_BackEnd`.

## Workflow de développement

Chaque changement part d'une **GitHub Issue** et suit les skills du dépôt, dans l'ordre :

1. `/plan-tests <n°issue>` — plan des cas de test, commenté sur l'issue (✋ validation de l'utilisateur)
2. `/write-tests` — tests écrits et **rouges** pour la bonne raison
3. `/implement` — code minimal jusqu'au vert, suite complète + lint + format + build
4. `/review` — `/code-review` + checklist du dépôt (✋ validation)
5. `/merge` — PR, CI verte, squash-merge (✋ validation)

### Hooks et agents

- **Hooks**, écrits directement dans la section `hooks` de `.claude/settings.json` :
  - avant une commande Bash ou PowerShell : bloque le push sur `main`, `--force`, `--no-verify`, `git add` de `.env` / `dist/` / `coverage/` et un merge autrement qu'en squash ;
  - avant l'écriture d'un fichier : protège les `.env` ;
  - après l'écriture d'un fichier : passe Prettier sur le fichier modifié ;
  - au démarrage d'une session : rappelle la branche et la PR ouverte.
- Le blocage de `git push` (sans argument) depuis `main` n'est pas couvert par le hook : il reste une règle de `.claude/rules/git.md`.
- **Agents de review** (lecture seule, lancés par `/review`) : `ui-reviewer` et `test-reviewer`.
- Ils ne s'appliquent que si Claude Code est lancé **depuis ce dossier**.

Branches : `feat/<n>-slug`, `fix/<n>-slug`, `chore/<n>-slug` depuis `main`. Commits en Conventional Commits, messages en français. Ne jamais pousser sur `main` directement ni merger sans accord explicite. Un changement qui dépend d'une évolution de l'API attend que la PR backend soit mergée.

## Commandes (Windows / PowerShell)

```powershell
npm install
npm run dev                     # http://localhost:3000 (alias : npm start)
npm run build                   # sortie dans dist/
npm run lint                    # ESLint 10, flat config (eslint.config.js)
npm run format                  # Prettier (format:check en CI)
npm run test:run                # Vitest, exécution unique (npm test = mode watch)
npm run test:run -- -t "nom"    # un test précis
npm run coverage                # couverture (coverage/index.html)
```

- Le port 3000 est imposé (`strictPort`) car c'est l'origine autorisée par le CORS du backend.
- Les fichiers contenant du JSX doivent être en `.jsx` (Vite). Variable d'environnement : `VITE_API_URL` (défaut `http://localhost:8000/api`, voir `src/config.js`).
- Les règles React Compiler de `eslint-plugin-react-hooks` v7 (`static-components`, `immutability`, `refs`, `set-state-in-effect`) sont en `warn` : dette existante, à ne pas aggraver (aucun nouvel avertissement dans un fichier touché).

## Tests

- Vitest + jsdom + Testing Library. Tests à côté du code (`Composant.test.jsx`).
- `src/test/server.js` : serveur **MSW** démarré dans `setupTests.js` avec `onUnhandledRequest: 'error'` ; chaque test déclare ses réponses avec `server.use(http.get(apiUrl('projects/'), ...))`.
- `src/test/render.jsx` : `renderWithProviders(ui, { preloadedState, route })` fournit store neuf (`makeStore`), thème et `MemoryRouter`, et renvoie `user` (user-event).
- Les anciens tests qui remplacent `api.defaults.adapter` restent valides ; les nouveaux utilisent MSW.

## Architecture

- `src/index.jsx` monte `App` avec le store `store/store.js` (slices `auth` et `notifications`, fabrique `makeStore`).
- `App.jsx` lance `restoreSession` au montage et affiche un chargement tant que `state.auth.initialized` est faux ; ensuite, non authentifié → seulement `/login` et `/register`, sinon layout `Navbar` + `Sidebar` et routes protégées par `PrivateRoute` filtrant sur `user.role` (rôle global).
- **Aucun token dans le `localStorage` ni dans Redux** : l'access token vit uniquement dans une variable de module de `services/api.js` (`setAccessToken` / `getAccessToken` / `clearAccessToken`) ; le refresh token est un cookie HttpOnly envoyé grâce à `withCredentials: true`. `restoreSession` refait un access token via `token/refresh/` puis charge `users/me/` ; `logoutUser` appelle `token/logout/`.
- `services/api.js` — instance axios centrale, **à utiliser pour tout appel** : sur 401 elle fait un seul refresh partagé (promesse commune + `navigator.locks` entre onglets), rejoue la requête, ou redirige vers `/login` ; les routes `token/*` ne déclenchent jamais de refresh. `getApiErrorMessage` formate les erreurs DRF.
- Annotation d'images : `components/annotation/` (canvas `react-konva`). Coordonnées échangées avec le backend normalisées 0–1.
- Plusieurs composants ne sont importés nulle part (`AnnotationInterface`, `BoundingBoxEditor`, `common/Navigation`, `utils/canvasUtils`, `users/UserProfile.jsx`) : vérifier avant de les modifier en croyant changer l'app.

Les règles détaillées sont dans `.claude/rules/` (chargées selon les fichiers touchés).

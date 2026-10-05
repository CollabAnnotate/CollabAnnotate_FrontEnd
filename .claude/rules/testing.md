---
paths:
  - 'src/**/*.test.{js,jsx}'
  - 'src/test/**'
---

# Tests (Vitest + Testing Library + MSW)

- Tester le **comportement vu par l'utilisateur**, pas l'implémentation : requêtes par rôle et texte (`getByRole('button', { name: /enregistrer/i })`), pas par classe CSS ni état interne.
- Rendu avec `renderWithProviders(ui, { preloadedState, route })` de `src/test/render.jsx` ; interactions avec l'objet `user` renvoyé (user-event), `fireEvent` seulement si user-event ne sait pas faire (ex. menus MUI).
- Réseau simulé avec **MSW** : `server.use(http.get(apiUrl('projects/'), () => HttpResponse.json([...])))`. Une requête non déclarée fait échouer le test — c'est voulu.
- Pour vérifier une requête envoyée, capturer le corps dans le handler MSW (`await request.json()`).
- Attendre l'asynchrone avec `findBy…` / `waitFor`, jamais de `setTimeout`.
- Nommage en français qui décrit le comportement : `test('affiche le message du backend si le nom d\'utilisateur est pris', …)`.
- Cas à couvrir : affichage nominal, interaction principale, erreur API (message lisible), état vide / chargement, variation selon le rôle (`preloadedState.auth.user.role`).
- Un bug corrigé = un test de non-régression qui échouait avant le correctif.
- Fonctions pures (coordonnées, formatage) : tests unitaires avec `test.each`.

# Git et GitHub

- Dépôt GitHub : `CollabAnnotate/CollabAnnotate_FrontEnd`, branche par défaut `main`. Le backend est un dépôt séparé (`CollabAnnotate/CollabAnnotate_BackEnd`).
- Une branche par issue, créée depuis `main` à jour : `feat/<n>-slug`, `fix/<n>-slug`, `chore/<n>-slug`, `test/<n>-slug`.
- Commits en **Conventional Commits**, description en français : `test: …`, `feat: …`, `fix: …`, `refactor: …`, `style: …`, `chore: …`, `docs: …`. Référencer l'issue dans le corps (`Refs #12`).
- Ordre attendu dans une PR : commit(s) `test:` (rouges) puis `feat:`/`fix:` (verts), puis corrections de review.
- La PR utilise `.github/pull_request_template.md`, contient `Closes #<n>` et des captures pour tout changement visible. Merge en **squash** uniquement après CI verte **et** accord explicite de l'utilisateur.
- Si la fonctionnalité dépend d'une évolution du backend, la PR backend est mergée d'abord.
- Ne jamais : pousser sur `main`, `--force` sur une branche partagée, `--no-verify`, committer `.env`, `dist/` ou `coverage/`.

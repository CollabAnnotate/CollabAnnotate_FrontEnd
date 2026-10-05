---
name: implement
description: Étape 3 du workflow TDD frontend — écrit le code minimal qui fait passer les tests rouges au vert, puis lance toute la suite, ESLint, Prettier et le build Vite. À utiliser après /write-tests dans CollabAnnotate_FrontEnd (ou seul pour un changement trivial : docs, typo).
---

# Implémenter (phase verte)

## 1. Expliquer avant de coder (consigne d'apprentissage)

Présenter brièvement l'approche : composants et fichiers touchés, concept React utilisé (état, effet, hook, Redux…) et son équivalent Symfony si utile, pourquoi ce choix.

## 2. Coder le minimum

- Faire passer les tests de l'issue **sans** élargir le périmètre (pas de refactor opportuniste : ouvrir une issue à la place).
- Respecter `.claude/rules/` : `api-calls.md`, `mui9.md`, `components.md`.

## 3. Boucle rouge → vert

```powershell
npm run test:run -- src/chemin/Composant.test.jsx   # les tests de l'issue
npm run test:run                                    # toute la suite
npm run lint                                        # pas de nouvel avertissement dans les fichiers touchés
npm run format                                      # Prettier
npm run build
```

Tout doit être vert. Ne jamais modifier un test pour le faire passer sans l'expliquer à l'utilisateur.

## 4. Vérifier dans le navigateur (changement visible)

Lancer `npm run dev` (et le backend) et vérifier le parcours à la main, ou via le skill `run`. Prendre une capture avant / après pour la PR.

## 5. Committer

```powershell
git add -A
git commit -m "<feat|fix|refactor>: <description>" -m "Refs #<n>"
```

Vérifier avec `git status` qu'aucun fichier indésirable (`.env`, `dist/`, `coverage/`) n'est inclus, puis lancer `/review`.

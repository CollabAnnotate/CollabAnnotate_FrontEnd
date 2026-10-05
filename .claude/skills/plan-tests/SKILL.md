---
name: plan-tests
description: Étape 1 du workflow TDD frontend — lit une GitHub Issue et les composants concernés, puis produit le plan des cas de test (affichage, interactions, erreurs API, rôles, états vides) à faire valider avant d'écrire le moindre test. À utiliser au démarrage de toute issue du dépôt CollabAnnotate_FrontEnd.
argument-hint: <numéro d'issue>
---

# Planifier les tests d'une issue (frontend)

Issue : `$ARGUMENTS`

## 1. Comprendre le besoin

1. `gh issue view $ARGUMENTS --comments` : lire le problème et les critères d'acceptation. Si l'issue dépend du backend (« Suite de CollabAnnotate/CollabAnnotate_BackEnd#n »), vérifier que la PR backend est mergée (`gh pr list -R CollabAnnotate/CollabAnnotate_BackEnd --search "<n>" --state merged`) et lire le nouveau format de réponse.
2. Lire les composants, `services/api.js`, les slices concernés et les tests existants à côté. Vérifier que le composant est bien utilisé par l'application (voir les composants morts dans `CLAUDE.md`).
3. Si le comportement attendu est ambigu, poser la question à l'utilisateur **avant** de planifier.

## 2. Préparer la branche

```powershell
git switch main; git pull
git switch -c <type>/$ARGUMENTS-<slug-court>   # type : feat | fix | chore | test
```

## 3. Rédiger le plan

Tableau des cas, en respectant `.claude/rules/testing.md` :

| #   | Fichier de test | Nom du test | Situation (réponses MSW, rôle, route) | Résultat attendu à l'écran |
| --- | --------------- | ----------- | ------------------------------------- | -------------------------- |

Catégories à passer en revue :

- **Affichage nominal** : données chargées et visibles.
- **Interactions** : clics, saisie, soumission, navigation (avec user-event).
- **Erreurs API** : 400 (message du backend lisible), 403/404, 500 — l'écran reste utilisable.
- **États** : chargement, liste vide, formulaire invalide.
- **Rôles** : ce qui change selon `user.role` (annotateur / vérificateur / admin).
- **Fonctions pures** : calculs (coordonnées, filtres) testés unitairement avec `test.each`.
- **Non-régression** : pour un bug, le scénario exact qui le reproduit.

Indiquer pour chaque cas **pourquoi il échouera aujourd'hui** (ou s'il protège contre une régression).

## 4. Expliquer (consigne d'apprentissage)

Avant le plan, expliquer en quelques lignes les concepts React / Testing Library en jeu, avec un parallèle Symfony quand c'est utile (Twig, formulaires, tests fonctionnels WebTestCase…).

## 5. Publier et ✋ attendre la validation

1. Poster le plan en commentaire : `gh issue comment $ARGUMENTS --body-file <fichier>` (fichier dans le scratchpad).
2. Présenter le plan à l'utilisateur et **s'arrêter** : ne rien écrire tant qu'il n'a pas validé ou amendé le plan.
3. Une fois validé : enchaîner avec `/write-tests`.

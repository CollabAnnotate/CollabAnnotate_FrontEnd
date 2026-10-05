# CollabAnnotate Frontend

Interface utilisateur moderne et intuitive pour la plateforme collaborative d'annotation d'images CollabAnnotate.

## 🚀 Technologies utilisées

- React 19 + Vite
- Material UI 9
- Redux Toolkit
- Axios
- React Router

## 📋 Prérequis

- Node.js 20.19+ (ou 22.12+)
- npm
- Backend CollabAnnotate en cours d'exécution

## 🛠 Installation

1. Cloner le repository

```bash
git clone https://github.com/votre-username/CollabAnnotate_FrontEnd.git
cd CollabAnnotate_FrontEnd
```

2. Installer les dépendances

```bash
npm install
```

3. (Optionnel) Configurer l'URL de l'API
   Par défaut, l'application appelle `http://localhost:8000/api`. Pour changer cette URL, copier `.env.example` en `.env` et modifier :

```
VITE_API_URL=http://localhost:8000/api
```

4. Lancer l'application en mode développement

```bash
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## 🌟 Fonctionnalités principales

- **Interface intuitive** : Design moderne et responsive
- **Gestion des projets** : Création et organisation des projets d'annotation
- **Outils d'annotation** : Interface interactive pour l'annotation d'images
- **Collaboration en temps réel** : Visualisation des modifications des autres utilisateurs
- **Tableau de bord** : Suivi de l'avancement et des statistiques
- **Système de validation** : Interface pour la révision et la validation des annotations

## 🎨 Interface utilisateur

- **Page d'accueil** : Vue d'ensemble des projets et activités récentes
- **Espace de travail** : Interface d'annotation avec outils avancés
- **Gestion des projets** : Organisation et suivi des projets
- **Validation** : Interface dédiée aux vérificateurs
- **Profil utilisateur** : Gestion des préférences et statistiques personnelles

## 🔧 Scripts disponibles

- `npm run dev` (ou `npm start`) : Lance le serveur de développement Vite
- `npm test` : Exécute les tests (Vitest, mode watch) ; `npm test -- --run` pour une exécution unique
- `npm run lint` : Analyse le code avec ESLint
- `npm run build` : Compile l'application pour la production dans `dist/`
- `npm run preview` : Sert localement le build de production

## 🔗 Liens utiles

- [Documentation Backend](../CollabAnnotate_BackEnd/README.md)
- [Guide de contribution](CONTRIBUTING.md)
- [Documentation API](API.md)

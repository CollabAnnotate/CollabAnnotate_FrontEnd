// Faux backend pour les tests : MSW intercepte les requêtes HTTP envoyées par axios.
// Chaque test déclare les réponses dont il a besoin avec server.use(...).
import { setupServer } from 'msw/node';
import config from '../config';

export const server = setupServer();

// URL absolue d'un endpoint de l'API : apiUrl('projects/') → http://localhost:8000/api/projects/
export const apiUrl = (path) => `${config.API_URL}/${path}`;

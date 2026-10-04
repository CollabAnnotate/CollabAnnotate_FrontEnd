import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Envoie le cookie HttpOnly du refresh token vers l'API
  withCredentials: true
});

// Access token gardé uniquement en mémoire : jamais dans le localStorage, où
// n'importe quel script (XSS) pourrait le lire. Perdu au rechargement de la page,
// il est alors restauré via le cookie de refresh (voir restoreSession).
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;
export const clearAccessToken = () => {
  accessToken = null;
};

// Gestion du token
api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Routes d'authentification : un 401 sur elles ne doit jamais déclencher de refresh
const AUTH_URLS = ['token/', 'token/refresh/', 'token/logout/'];

// Refresh en cours, partagé par toutes les requêtes qui reçoivent un 401 en même temps.
// Le backend fait tourner les refresh tokens et blackliste l'ancien : deux refresh
// parallèles avec le même cookie feraient échouer le second.
let refreshPromise = null;

// Le cookie est commun à tous les onglets : un verrou navigateur évite que deux
// onglets rafraîchissent en même temps avec le même cookie.
const withRefreshLock = (callback) =>
  navigator.locks ? navigator.locks.request('token-refresh', callback) : callback();

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = withRefreshLock(() => authAPI.refreshToken())
      .then(({ data }) => {
        setAccessToken(data.access);
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const clearSessionAndRedirect = () => {
  clearAccessToken();
  window.location.href = '/login';
};

// Gestion des erreurs de réponse
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !AUTH_URLS.includes(originalRequest.url);

    if (shouldRefresh) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        // Réessayer la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token expiré ou blacklisté : déconnexion
        clearSessionAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Transforme une erreur DRF en message lisible. DRF renvoie selon les cas
// {detail}, {error}, une liste, ou un objet {champ: [messages]}.
export const getApiErrorMessage = (error, fallback = 'Une erreur est survenue') => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.join(' ');
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  const messages = Object.entries(data).map(([field, value]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value);
    return field === 'non_field_errors' ? text : `${field} : ${text}`;
  });
  return messages.length ? messages.join(' — ') : fallback;
};

// API Auth
export const authAPI = {
  login: (credentials) => {
    return api.post('token/', credentials);
  },
  register: (userData) => {
    return api.post('register/', userData);
  },
  // Le refresh token voyage dans le cookie HttpOnly : pas de corps à envoyer
  refreshToken: () => {
    return api.post('token/refresh/');
  },
  logout: () => {
    return api.post('token/logout/');
  },
  verifyToken: (token) => {
    return api.post('token/verify/', { token });
  }
};

// API Projects
export const projectsAPI = {
  getProjects: () => api.get('projects/'),
  createProject: (data) => api.post('projects/', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  }),
  getProject: (id) => api.get(`projects/${id}/`),
  updateProject: (id, data) => api.put(`projects/${id}/`, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  }),
  deleteProject: (id) => api.delete(`projects/${id}/`),
  getProjectStats: (id) => api.get(`projects/${id}/stats/`),
  getProjectImages: (id) => api.get(`projects/${id}/get_images/`),
  getProjectAnnotations: (id) => api.get(`projects/${id}/get_annotations/`),
  addImages: (id, formData) => api.post(`projects/${id}/add_images/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  detectObjects: (projectId, data) => api.post(`projects/${projectId}/detect_objects/`, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  }),
  publishProject: (id) => api.post(`projects/${id}/publish/`, {}, {
    headers: {
      'Content-Type': 'application/json'
    }
  }),
  unpublishProject: (id) => api.post(`projects/${id}/unpublish/`, {}, {
    headers: {
      'Content-Type': 'application/json'
    }
  }),
};

// API Annotations
export const annotationAPI = {
  getAnnotations: (dataitemId) => api.get(`/annotations/?dataitem=${dataitemId}`),
  createAnnotation: (data) => api.post('/annotations/', data),
  updateAnnotation: (id, data) => api.patch(`/annotations/${id}/`, data),
  deleteAnnotation: (id) => api.delete(`/annotations/${id}/`),
  getAnnotationHistory: (id) => api.get(`/annotation-history/?annotation=${id}`),
  detectObjects: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('detect/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  validateAnnotation: (id, data) => api.post(`annotations/${id}/validate/`, data),
  getPendingValidations: () => api.get('annotations/review/'),
};

// API Users
export const usersAPI = {
  // Back-office réservé aux administrateurs
  getUsers: () => api.get('admin/users/'),
  createUser: (data) => api.post('admin/users/', data),
  updateUser: (id, data) => api.patch(`admin/users/${id}/`, data),
  deleteUser: (id) => api.delete(`admin/users/${id}/`),
  // Compte de l'utilisateur connecté
  getCurrentUser: () => api.get('users/me/'),
  updateProfile: (data) => api.patch('users/me/', data, {
    headers: {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    }
  }),
  changePassword: (data) => api.post('users/me/change-password/', data)
};

// API Datasets
export const datasetAPI = {
  getDatasets: () => api.get('datasets/'),
  createDataset: (data) => api.post('datasets/', data),
  getDataset: (id) => api.get(`datasets/${id}/`),
  updateDataset: (id, data) => api.put(`datasets/${id}/`, data),
  deleteDataset: (id) => api.delete(`datasets/${id}/`),
  uploadData: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`datasets/${id}/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
};

export default api;
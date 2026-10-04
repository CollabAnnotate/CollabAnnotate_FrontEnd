import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Gestion du token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Routes d'authentification : un 401 sur elles ne doit jamais déclencher de refresh
const AUTH_URLS = ['token/', 'token/refresh/'];

// Refresh en cours, partagé par toutes les requêtes qui reçoivent un 401 en même temps.
// Le backend fait tourner les refresh tokens et blackliste l'ancien : deux refresh
// parallèles avec le même token feraient échouer le second.
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refresh_token');
    refreshPromise = authAPI.refreshToken({ refresh: refreshToken })
      .then(({ data }) => {
        localStorage.setItem('token', data.access);
        // Rotation : l'ancien refresh token est désormais blacklisté
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const clearSessionAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
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
      !AUTH_URLS.includes(originalRequest.url) &&
      localStorage.getItem('refresh_token');

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

// API Auth
export const authAPI = {
  login: (credentials) => {
    return api.post('token/', credentials);
  },
  register: (userData) => {
    return api.post('register/', userData);
  },
  refreshToken: (refresh) => {
    return api.post('token/refresh/', refresh);
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
  getUsers: () => api.get('users/'),
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
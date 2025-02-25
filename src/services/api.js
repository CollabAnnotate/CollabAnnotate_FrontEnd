import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';

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

// Gestion des erreurs de réponse
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Si l'erreur est 401 et que nous n'avons pas déjà tenté de rafraîchir le token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Tentative de rafraîchissement du token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await authAPI.refreshToken({ refresh: refreshToken });
          const newToken = response.data.access;
          
          // Mise à jour du token dans le localStorage
          localStorage.setItem('token', newToken);
          
          // Mise à jour du header d'autorisation pour la requête originale
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Réessayer la requête originale avec le nouveau token
          return api(originalRequest);
        }
      } catch (refreshError) {
        // En cas d'échec du rafraîchissement, déconnexion
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API Auth
export const authAPI = {
  login: (credentials) => api.post('token/', credentials),
  register: (userData) => api.post('register/', userData),
  refreshToken: () => api.post('token/refresh/'),
  verifyToken: (token) => api.post('token/verify/', { token }),
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
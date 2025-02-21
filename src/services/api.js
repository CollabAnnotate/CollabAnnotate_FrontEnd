import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Gestion améliorée du token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await axios.post(`${API_URL}token/refresh/`, { refresh: refreshToken });
        localStorage.setItem('token', response.data.access);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access;
        
        processQueue(null, response.data.access);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// API Auth
export const authAPI = {
  login: (credentials) => api.post('/token/', credentials),
  register: (userData) => api.post('/register/', userData),
  refreshToken: () => api.post('/token/refresh/'),
  verifyToken: (token) => api.post('/token/verify/', { token }),
};

// API Projects
export const projectsAPI = {
  getProjects: () => api.get('/projects/'),
  createProject: (data) => api.post('/projects/', data),
  getProject: (id) => api.get(`/projects/${id}/`),
  updateProject: (id, data) => api.put(`/projects/${id}/`, data),
  deleteProject: (id) => api.delete(`/projects/${id}/`),
  getProjectStats: (id) => api.get(`/projects/${id}/stats/`),
  exportProjectReport: (id) => api.get(`/projects/${id}/export/`, { responseType: 'blob' }),
};

// API Annotations
export const annotationAPI = {
  detectObjects: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/detect/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  saveAnnotation: (data) => api.post('/annotations/', data),
  getAnnotations: (imageId) => api.get(`/annotations/?image=${imageId}`),
  updateAnnotation: (id, data) => {
    return api.patch(`/annotations/${id}/`, {
      ...data,
      modification_type: 'manual_bbox_edit'
    });
  },
  updateBoundingBox: (id, coordinates) => {
    return api.patch(`/annotations/${id}/`, {
      x_min: coordinates.x_min,
      y_min: coordinates.y_min,
      x_max: coordinates.x_max,
      y_max: coordinates.y_max,
      modification_type: 'manual_bbox_edit'
    });
  },
  deleteAnnotation: (id) => api.delete(`/annotations/${id}/`),
  getPendingValidations: () => api.get('/annotations/review/'),
  validateAnnotation: (id, data) => api.post(`/annotations/${id}/validate/`, data),
  getAnnotationHistory: (annotationId) => api.get(`/annotations/${annotationId}/history/`),
  createAnnotation: (data) => api.post('/annotations/', data)
};

// API Users
export const usersAPI = {
  getUsers: () => api.get('/users/'),
  createUser: (data) => api.post('/users/', data),
  updateUser: (id, data) => api.put(`/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/users/${id}/`),
  getCurrentUser: () => api.get('/users/me/'),
  updateProfile: (data) => api.put('/users/me/', data),
  changePassword: (data) => api.post('/users/change-password/', data),
};

// API Datasets
export const datasetAPI = {
  getDatasets: () => api.get('/datasets/'),
  createDataset: (data) => api.post('/datasets/', data),
  getDataset: (id) => api.get(`/datasets/${id}/`),
  updateDataset: (id, data) => api.put(`/datasets/${id}/`, data),
  deleteDataset: (id) => api.delete(`/datasets/${id}/`),
  uploadData: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/datasets/${id}/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
const config = {
  // URL de l'API Django, surchargeable via VITE_API_URL dans .env
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
};

export default config;

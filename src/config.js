const config = {
  // URL de l'API Django, surchargeable via VITE_API_URL dans .env
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  TOKEN_KEY: 'collabannotate_token',
  USER_KEY: 'collabannotate_user',
};

export default config;

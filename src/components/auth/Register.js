import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; 
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Container
} from '@mui/material';
import { authAPI } from '../../services/api';
import api from '../../services/api';
import { setCredentials } from '../../store/authSlice';

const Register = () => { 
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Obtenir la fonction dispatch
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'annotateur'
  });

  const roles = [
    { value: 'annotateur', label: 'Annotateur' },
    { value: 'verificateur', label: 'Vérificateur' },
    { value: 'admin', label: 'Administrateur' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (response.data.token) {
        // Store tokens in localStorage
        localStorage.setItem('token', response.data.token.access);
        localStorage.setItem('refresh_token', response.data.token.refresh);
        
        // Update API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token.access}`;

        // Update Redux store
        dispatch(setCredentials({
          token: response.data.token.access,
          refresh: response.data.token.refresh,
          user: response.data.user,
          role: response.data.user.role,
        }));

        navigate('/dashboard');
      } else {
        navigate('/login', { 
          state: { message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' }
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : err.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      
      // Clean up any existing tokens on error
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      api.defaults.headers.common['Authorization'] = null;
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Inscription
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              variant="outlined"
              margin="normal"
              required
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              autoComplete="username"
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              variant="outlined"
              margin="normal"
              required
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
            />

            <TextField
              fullWidth
              select
              label="Rôle"
              variant="outlined"
              margin="normal"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              variant="outlined"
              margin="normal"
              required
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
            />

            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              type="password"
              variant="outlined"
              margin="normal"
              required
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "S'inscrire"
              )}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
              disabled={loading}
            >
              Déjà inscrit ? Se connecter
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
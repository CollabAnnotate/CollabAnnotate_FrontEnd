import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../../services/api";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
} from "@mui/material";
import { authAPI } from "../../services/api";
import { setCredentials } from "../../store/authSlice";


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authAPI.login(credentials);
      const data = response.data;
      
      // Check if we have either the legacy format or the new format
      const token = data.token || data.access;
      const user = data.user || {
        username: credentials.username,
        role: data.role || 'annotateur'
      };
      
      if (!token) {
        throw new Error('Format de réponse invalide: token manquant');
      }
      
      // Store tokens in localStorage
      localStorage.setItem('token', token.access);
      localStorage.setItem('refresh_token', token.refresh);
      
      // Set authorization header for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token.access}`;
      
      // Update Redux store with user data and tokens
      dispatch(
        setCredentials({
          token: token.access,
          refresh: token.refresh,
          user: user,
          role: user.role,
        })
      );

      // Navigate to dashboard or previous location
      navigate(location.state?.from || '/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Identifiants incorrects. Veuillez vérifier votre nom d\'utilisateur et mot de passe.'
      );
      // Clean up any existing tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      api.defaults.headers.common['Authorization'] = null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            LabelFlow
          </Typography>

          {location.state?.message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {location.state.message}
            </Alert>
          )}

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
              value={credentials.username}
              onChange={handleChange}
              name="username"
              disabled={loading}
              autoComplete="username"
            />

            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              variant="outlined"
              margin="normal"
              value={credentials.password}
              onChange={handleChange}
              name="password"
              disabled={loading}
              autoComplete="current-password"
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
                "Se connecter"
              )}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate("/register")}
              sx={{ mt: 2 }}
              disabled={loading}
            >
              Créer un compte
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
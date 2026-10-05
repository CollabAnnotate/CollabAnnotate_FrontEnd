import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Container,
  CircularProgress
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { PhotoCamera } from '@mui/icons-material';
import { usersAPI, getApiErrorMessage } from '../../services/api';
import { updateUser, selectCurrentUser, selectAuthStatus, selectAuthError } from '../../store/authSlice';

const UserProfile = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    role: currentUser?.role || '',
    first_name: currentUser?.first_name || '',
    last_name: currentUser?.last_name || '',
    bio: currentUser?.bio || '',
    profile_picture: null
  });
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profile_picture: file
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess('');

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });

    const resultAction = await dispatch(updateUser(data));
    if (updateUser.fulfilled.match(resultAction)) {
      setSuccess('Profil mis à jour avec succès');
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setSuccess('');
    setPasswordError('');
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('La confirmation ne correspond pas au nouveau mot de passe');
      return;
    }

    try {
      await usersAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setSuccess('Mot de passe mis à jour avec succès');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err) {
      setPasswordError(getApiErrorMessage(err, 'Erreur lors du changement de mot de passe'));
    }
  };

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Chargement du profil...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
          Mon Profil
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid
              size={12}
              sx={{
                display: "flex",
                justifyContent: "center"
              }}>
              <Box sx={{ position: 'relative', textAlign: 'center' }}>
                <Avatar
                  src={formData.profile_picture ? URL.createObjectURL(formData.profile_picture) : currentUser.profile_picture}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mb: 2,
                    mx: 'auto',
                    border: '4px solid',
                    borderColor: 'primary.main' 
                  }}
                />
                <input
                  accept="image/*"
                  type="file"
                  id="profile-picture"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profile-picture">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                    size="small"
                    sx={{ mt: 1 }}
                    disabled={status === 'loading'}
                  >
                    Changer la photo
                  </Button>
                </label>
              </Box>
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
              <TextField
                fullWidth
                label="Prénom"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                variant="outlined"
                disabled={status === 'loading'}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
              <TextField
                fullWidth
                label="Nom"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                variant="outlined"
                disabled={status === 'loading'}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Nom d'utilisateur"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                variant="outlined"
                disabled={status === 'loading'}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="outlined"
                disabled={status === 'loading'}
              />
            </Grid>

            <Grid size={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Rôle</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Rôle"
                  disabled
                >
                  <MenuItem value="annotateur">Annotateur</MenuItem>
                  <MenuItem value="verificateur">Vérificateur</MenuItem>
                  <MenuItem value="admin">Administrateur</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                multiline
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                variant="outlined"
                placeholder="Parlez-nous un peu de vous..."
                disabled={status === 'loading'}
              />
            </Grid>

            <Grid size={12}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
                size="large"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Sauvegarde en cours...' : 'Sauvegarder les modifications'}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Box sx={{ my: 4 }}>
          <Typography variant="h5" gutterBottom color="primary">
            Changer le mot de passe
          </Typography>

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError('')}>
              {passwordError}
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Mot de passe actuel"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  required
                  variant="outlined"
                  disabled={status === 'loading'}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Nouveau mot de passe"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  required
                  variant="outlined"
                  disabled={status === 'loading'}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirmer le nouveau mot de passe"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  required
                  variant="outlined"
                  disabled={status === 'loading'}
                />
              </Grid>

              <Grid size={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="secondary" 
                  fullWidth
                  size="large"
                  disabled={status === 'loading' || 
                           !passwordData.current_password || 
                           !passwordData.new_password ||
                           passwordData.new_password !== passwordData.confirm_password}
                >
                  {status === 'loading' ? 'Modification en cours...' : 'Changer le mot de passe'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserProfile;

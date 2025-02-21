import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    darkMode: false,
    autoSave: true,
    language: 'fr'
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Paramètres mis à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour des paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Paramètres
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <List>
            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                  />
                }
                label="Notifications par email"
              />
            </ListItem>
            <Divider />

            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={() => handleToggle('darkMode')}
                  />
                }
                label="Mode sombre"
              />
            </ListItem>
            <Divider />

            <ListItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoSave}
                    onChange={() => handleToggle('autoSave')}
                  />
                }
                label="Sauvegarde automatique"
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Sauvegarder'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Settings;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { annotationAPI } from '../../services/api';

import ListItemButton from '@mui/material/ListItemButton';

const RevisionInterface = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadAnnotationsForReview();
  }, []);

  const loadAnnotationsForReview = async () => {
    setLoading(true);
    try {
      const response = await annotationAPI.getPendingValidations();
      setAnnotations(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des annotations à réviser');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (status) => {
    if (!selectedAnnotation) {
      setError('Veuillez sélectionner une annotation à valider');
      return;
    }

    if (!['validé', 'rejeté'].includes(status)) {
      setError('Statut de validation invalide');
      return;
    }

    setLoading(true);
    try {
      await annotationAPI.validateAnnotation(selectedAnnotation.id, {
        status,
        comment: comment.trim(),
      });

      // Mettre à jour la liste des annotations
      setAnnotations(annotations.filter((a) => a.id !== selectedAnnotation.id));
      setSelectedAnnotation(null);
      setComment('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la validation de l'annotation");
    } finally {
      setLoading(false);
    }
  };

  const renderImage = (annotation) => {
    if (!annotation) return null;

    // Le conteneur prend exactement la taille de l'image : les coordonnées
    // normalisées (0-1) de la boîte tombent ainsi pile sur l'image.
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={annotation.image_url}
            alt={`Annotation ${annotation.label}`}
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '400px',
            }}
          />
          {/* Afficher la boîte englobante */}
          <Box
            sx={{
              position: 'absolute',
              left: `${annotation.x_min * 100}%`,
              top: `${annotation.y_min * 100}%`,
              width: `${(annotation.x_max - annotation.x_min) * 100}%`,
              height: `${(annotation.y_max - annotation.y_min) * 100}%`,
              border: '2px solid #ff0000',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid
          size={{
            xs: 12,
            md: 8,
          }}
        >
          <Paper sx={{ p: 2, position: 'relative' }}>
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <CircularProgress />
              </Box>
            )}
            {selectedAnnotation ? (
              renderImage(selectedAnnotation)
            ) : (
              <Typography variant="body1" align="center">
                Sélectionnez une annotation à réviser
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Annotations à réviser
            </Typography>
            <List>
              {annotations.map((annotation) => (
                <ListItemButton
                  key={annotation.id}
                  selected={selectedAnnotation?.id === annotation.id}
                  onClick={() => setSelectedAnnotation(annotation)}
                >
                  <ListItemText
                    primary={`Label: ${annotation.label}`}
                    secondary={`Confiance: ${(annotation.confidence * 100).toFixed(1)}%`}
                  />
                </ListItemButton>
              ))}
            </List>

            {selectedAnnotation && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Validation
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Commentaire"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => handleValidate('validé')}
                    fullWidth
                  >
                    Valider
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => handleValidate('rejeté')}
                    fullWidth
                  >
                    Rejeter
                  </Button>
                </Box>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RevisionInterface;

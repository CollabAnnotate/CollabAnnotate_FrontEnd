import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Grid,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  AutoFixHigh as AutoDetectIcon,
  Compare as CompareIcon
} from '@mui/icons-material';
import { annotationAPI } from '../../services/api';
import ImageAnnotator from './ImageAnnotator';

const AnnotationInterface = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [comment, setComment] = useState('');
  const [mode, setMode] = useState('view'); // 'view', 'add', 'edit', 'delete'
  const [labelDialog, setLabelDialog] = useState(false);
  const [availableLabels] = useState(['person', 'car', 'dog', 'cat', 'bicycle']);
  const [tempAnnotation, setTempAnnotation] = useState(null);
  const [yoloDetections, setYoloDetections] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [qualityMetrics, setQualityMetrics] = useState({
    precision: 0,
    recall: 0,
    f1Score: 0
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Gestionnaire de mise à jour des annotations
  const handleUpdateAnnotation = async (updatedAnnotation, modificationType) => {
    try {
      setLoading(true);
      const response = await annotationAPI.updateAnnotation(updatedAnnotation.id, {
        ...updatedAnnotation,
        modification_type: modificationType
      });
      
      // Mettre à jour l'état local avec la nouvelle annotation
      setAnnotations(annotations.map(ann => 
        ann.id === updatedAnnotation.id ? response.data : ann
      ));

      setSnackbar({
        open: true,
        message: 'Annotation mise à jour avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'annotation:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la mise à jour de l\'annotation',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Remplacer le rendu du canvas par ImageAnnotator
  const renderAnnotationArea = () => (
    <Box sx={{ width: '100%', height: '70vh', position: 'relative' }}>
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1
        }}>
          <CircularProgress />
        </Box>
      )}
      
      <ImageAnnotator
        image={currentImage}
        annotations={mode === 'compare' ? yoloDetections : annotations}
        onAnnotationChange={handleUpdateAnnotation}
      />
    </Box>
  );

  useEffect(() => {
    if (currentImage) {
      loadAnnotations();
    }
  }, [currentImage]);

  const loadAnnotations = async () => {
    setLoading(true);
    try {
      const [annotationsResponse, detectionsResponse] = await Promise.all([
        annotationAPI.getAnnotations(currentImage.id),
        annotationAPI.getYoloDetections(currentImage.id)
      ]);
      
      setAnnotations(annotationsResponse.data);
      setYoloDetections(detectionsResponse.data.detections);
      
      // Calculate quality metrics
      const metrics = calculateQualityMetrics(annotationsResponse.data, detectionsResponse.data.detections);
      setQualityMetrics(metrics);
    } catch (err) {
      setError('Erreur lors du chargement des annotations');
    } finally {
      setLoading(false);
    }
  };

  const calculateQualityMetrics = (annotations, detections) => {
    // Implement IOU-based metrics calculation
    // This is a simplified example
    const matches = annotations.filter(ann => 
      detections.some(det => calculateIOU(ann, det) > 0.5)
    );

    const precision = matches.length / detections.length || 0;
    const recall = matches.length / annotations.length || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return { precision, recall, f1Score };
  };

  const calculateIOU = (box1, box2) => {
    const intersection = {
      x_min: Math.max(box1.x_min, box2.x_min),
      y_min: Math.max(box1.y_min, box2.y_min),
      x_max: Math.min(box1.x_max, box2.x_max),
      y_max: Math.min(box1.y_max, box2.y_max)
    };

    if (intersection.x_max <= intersection.x_min || 
        intersection.y_max <= intersection.y_min) {
      return 0;
    }

    const intersectionArea = (intersection.x_max - intersection.x_min) * 
                            (intersection.y_max - intersection.y_min);
    const box1Area = (box1.x_max - box1.x_min) * (box1.y_max - box1.y_min);
    const box2Area = (box2.x_max - box2.x_min) * (box2.y_max - box2.y_min);
    
    return intersectionArea / (box1Area + box2Area - intersectionArea);
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button
              variant={mode === 'view' ? 'contained' : 'outlined'}
              onClick={() => setMode('view')}
            >
              Voir
            </Button>
            <Button
              variant={mode === 'edit' ? 'contained' : 'outlined'}
              startIcon={<EditIcon />}
              onClick={() => setMode('edit')}
            >
              Éditer
            </Button>
            <Button
              variant={mode === 'compare' ? 'contained' : 'outlined'}
              startIcon={<CompareIcon />}
              onClick={() => setMode('compare')}
            >
              Comparer avec YOLO
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          {renderAnnotationArea()}
        </Grid>

        {/* Liste des annotations */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Annotations
          </Typography>
          <List>
            {annotations.map((ann) => (
              <ListItem
                key={ann.id}
                sx={{
                  bgcolor: selectedLabel === ann.id ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemText
                  primary={`${ann.label} (Confiance: ${(ann.confidence * 100).toFixed(1)}%)`}
                  secondary={`x: ${ann.x_min.toFixed(2)}, y: ${ann.y_min.toFixed(2)}, w: ${(ann.x_max - ann.x_min).toFixed(2)}, h: ${(ann.y_max - ann.y_min).toFixed(2)}`}
                />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      {/* Autres dialogues et composants existants */}
      <Dialog open={labelDialog} onClose={() => setLabelDialog(false)}>
        <DialogTitle>Sélectionner un label</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Label</InputLabel>
            <Select
              value={tempAnnotation?.label || ''}
              onChange={(e) => setTempAnnotation({ ...tempAnnotation, label: e.target.value })}
            >
              {availableLabels.map((label) => (
                <MenuItem key={label} value={label}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLabelDialog(false)}>Annuler</Button>
          <Button
            onClick={() => {
              if (tempAnnotation && tempAnnotation.label) {
                setAnnotations([...annotations, tempAnnotation]);
                setTempAnnotation(null);
                setLabelDialog(false);
              }
            }}
            variant="contained"
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AnnotationInterface;
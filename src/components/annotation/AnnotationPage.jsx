import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
} from '@mui/material';
import {
  CloudUpload,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { annotationAPI } from '../../services/api';

const AnnotationPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [editedAnnotation, setEditedAnnotation] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedAnnotation, setDraggedAnnotation] = useState(null);
  const [resizing, setResizing] = useState(null); // 'nw', 'ne', 'sw', 'se' ou null
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnnotations([]);
      setError('');
    }
  };

  const handleDetection = async () => {
    if (!selectedImage) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await annotationAPI.detectObjects(selectedImage);
      console.log('API Response:', response);

      // La réponse contient un tableau de détections dans response.data.detections
      const detections = response.data.detections || [];

      setAnnotations(
        detections.map((det, index) => ({
          id: index,
          label: det.label || 'Inconnu',
          confidence: det.confidence || 1.0,
          x_min: det.x_min || 0,
          y_min: det.y_min || 0,
          x_max: det.x_max || 1,
          y_max: det.y_max || 1,
        })),
      );

      setSuccess('Détection réussie !');
    } catch (error) {
      console.error('Erreur lors de la détection:', error);
      setError('Erreur lors de la détection des objets');
    } finally {
      setLoading(false);
    }
  };

  const getRelativeCoordinates = (event) => {
    const bounds = containerRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
  };

  const handleMouseDown = (event) => {
    if (!selectedImage) return;

    const coords = getRelativeCoordinates(event);
    setIsDrawing(true);
    setStartPoint(coords);
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;

    const coords = getRelativeCoordinates(event);
    const newAnnotation = {
      id: annotations.length,
      label: 'Nouveau',
      confidence: 1.0,
      x_min: Math.min(startPoint.x, coords.x),
      y_min: Math.min(startPoint.y, coords.y),
      x_max: Math.max(startPoint.x, coords.x),
      y_max: Math.max(startPoint.y, coords.y),
    };

    setAnnotations((prev) => {
      const filtered = prev.filter((a) => a.id !== 'temp');
      return [...filtered, { ...newAnnotation, id: 'temp' }];
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setAnnotations((prev) => {
      const filtered = prev.filter((a) => a.id !== 'temp');
      const temp = prev.find((a) => a.id === 'temp');
      if (temp) {
        return [...filtered, { ...temp, id: prev.length }];
      }
      return filtered;
    });
  };

  const handleBoxMouseDown = (event, annotation) => {
    event.stopPropagation();
    const coords = getRelativeCoordinates(event);
    setIsDragging(true);
    setDragStart(coords);
    setDraggedAnnotation(annotation);

    // Si l'annotation n'est pas déjà sélectionnée, la sélectionner
    if (!selectedAnnotation || selectedAnnotation.id !== annotation.id) {
      handleAnnotationEdit(annotation);
    }

    // Déterminer si on clique sur un coin pour le redimensionnement
    const box = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - box.left;
    const clickY = event.clientY - box.top;
    const cornerSize = 10;

    if (clickX < cornerSize && clickY < cornerSize) setResizing('nw');
    else if (clickX > box.width - cornerSize && clickY < cornerSize) setResizing('ne');
    else if (clickX < cornerSize && clickY > box.height - cornerSize) setResizing('sw');
    else if (clickX > box.width - cornerSize && clickY > box.height - cornerSize) setResizing('se');
    else setResizing(null);
  };

  const handleBoxMouseMove = (event) => {
    if (!isDragging || !editedAnnotation) return;

    event.stopPropagation();
    const coords = getRelativeCoordinates(event);
    const deltaX = coords.x - dragStart.x;
    const deltaY = coords.y - dragStart.y;

    if (resizing) {
      // Redimensionnement
      const newAnnotation = { ...editedAnnotation };
      switch (resizing) {
        case 'nw':
          newAnnotation.x_min = Math.min(
            Math.max(editedAnnotation.x_min + deltaX, 0),
            editedAnnotation.x_max - 0.01,
          );
          newAnnotation.y_min = Math.min(
            Math.max(editedAnnotation.y_min + deltaY, 0),
            editedAnnotation.y_max - 0.01,
          );
          break;
        case 'ne':
          newAnnotation.x_max = Math.max(
            Math.min(editedAnnotation.x_max + deltaX, 1),
            editedAnnotation.x_min + 0.01,
          );
          newAnnotation.y_min = Math.min(
            Math.max(editedAnnotation.y_min + deltaY, 0),
            editedAnnotation.y_max - 0.01,
          );
          break;
        case 'sw':
          newAnnotation.x_min = Math.min(
            Math.max(editedAnnotation.x_min + deltaX, 0),
            editedAnnotation.x_max - 0.01,
          );
          newAnnotation.y_max = Math.max(
            Math.min(editedAnnotation.y_max + deltaY, 1),
            editedAnnotation.y_min + 0.01,
          );
          break;
        case 'se':
          newAnnotation.x_max = Math.max(
            Math.min(editedAnnotation.x_max + deltaX, 1),
            editedAnnotation.x_min + 0.01,
          );
          newAnnotation.y_max = Math.max(
            Math.min(editedAnnotation.y_max + deltaY, 1),
            editedAnnotation.y_min + 0.01,
          );
          break;
      }
      setEditedAnnotation(newAnnotation);
    } else {
      // Déplacement
      const width = editedAnnotation.x_max - editedAnnotation.x_min;
      const height = editedAnnotation.y_max - editedAnnotation.y_min;

      let newX_min = Math.max(0, Math.min(editedAnnotation.x_min + deltaX, 1 - width));
      let newY_min = Math.max(0, Math.min(editedAnnotation.y_min + deltaY, 1 - height));

      setEditedAnnotation({
        ...editedAnnotation,
        x_min: newX_min,
        y_min: newY_min,
        x_max: newX_min + width,
        y_max: newY_min + height,
      });
    }

    setDragStart(coords);
  };

  const handleBoxMouseUp = () => {
    if (isDragging && editedAnnotation) {
      // Mettre à jour l'annotation dans la liste
      setAnnotations((prev) =>
        prev.map((ann) => (ann.id === editedAnnotation.id ? editedAnnotation : ann)),
      );
    }
    setIsDragging(false);
    setDraggedAnnotation(null);
    setResizing(null);
  };

  const handleAnnotationEdit = (annotation) => {
    setSelectedAnnotation(annotation);
    setEditedAnnotation({
      ...annotation,
    });
  };

  const handleAnnotationUpdate = (field, value) => {
    setEditedAnnotation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = () => {
    if (!editedAnnotation) return;

    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === editedAnnotation.id ? editedAnnotation : ann)),
    );
    setSelectedAnnotation(null);
    setEditedAnnotation(null);
    setSuccess('Annotation mise à jour avec succès');
  };

  const handleCancelEdit = () => {
    setSelectedAnnotation(null);
    setEditedAnnotation(null);
  };

  const handleAnnotationDelete = (id) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    if (selectedAnnotation?.id === id) {
      setSelectedAnnotation(null);
    }
  };

  const handleSaveAnnotations = async () => {
    try {
      // Ici vous pouvez ajouter la logique pour sauvegarder les annotations
      setSuccess('Annotations sauvegardées avec succès !');
    } catch (error) {
      setError('Erreur lors de la sauvegarde des annotations');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
          Annotation d'Images
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 8,
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageSelect}
              />
              <label htmlFor="image-upload">
                <Button variant="contained" component="span" startIcon={<CloudUpload />}>
                  Charger une image
                </Button>
              </label>

              {imagePreview && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleDetection}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Détecter les objets'}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleSaveAnnotations}
                    disabled={loading}
                    startIcon={<SaveIcon />}
                  >
                    Sauvegarder
                  </Button>
                </>
              )}
            </Box>

            {imagePreview && (
              <Box
                ref={containerRef}
                sx={{
                  position: 'relative',
                  maxWidth: '100%',
                  cursor: isDrawing ? 'crosshair' : 'default',
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                  },
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => {
                  handleMouseMove(e);
                  handleBoxMouseMove(e);
                }}
                onMouseUp={() => {
                  handleMouseUp();
                  handleBoxMouseUp();
                }}
                onMouseLeave={() => {
                  handleMouseUp();
                  handleBoxMouseUp();
                }}
              >
                <img ref={imageRef} src={imagePreview} alt="Preview" />
                {annotations.map((annotation) => {
                  const isSelected = selectedAnnotation?.id === annotation.id;
                  const annotationToShow = isSelected ? editedAnnotation : annotation;

                  return (
                    <div
                      key={annotation.id}
                      style={{
                        position: 'absolute',
                        left: `${annotationToShow.x_min * 100}%`,
                        top: `${annotationToShow.y_min * 100}%`,
                        width: `${(annotationToShow.x_max - annotationToShow.x_min) * 100}%`,
                        height: `${(annotationToShow.y_max - annotationToShow.y_min) * 100}%`,
                        border: '2px solid red',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        cursor: isSelected ? 'move' : 'pointer',
                        zIndex: isSelected ? 2 : 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnnotationEdit(annotation);
                      }}
                      onMouseDown={(e) => handleBoxMouseDown(e, annotation)}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '-20px',
                          left: '0',
                          backgroundColor: 'red',
                          color: 'white',
                          padding: '2px 4px',
                          fontSize: '12px',
                          borderRadius: '3px',
                          zIndex: 3,
                        }}
                      >
                        {annotationToShow.label} ({Math.round(annotationToShow.confidence * 100)}%)
                      </span>
                      {isSelected && (
                        <>
                          <div
                            className="resize-handle nw"
                            style={{
                              position: 'absolute',
                              top: '-5px',
                              left: '-5px',
                              width: '10px',
                              height: '10px',
                              backgroundColor: 'white',
                              border: '1px solid red',
                              cursor: 'nw-resize',
                              zIndex: 3,
                            }}
                          />
                          <div
                            className="resize-handle ne"
                            style={{
                              position: 'absolute',
                              top: '-5px',
                              right: '-5px',
                              width: '10px',
                              height: '10px',
                              backgroundColor: 'white',
                              border: '1px solid red',
                              cursor: 'ne-resize',
                              zIndex: 3,
                            }}
                          />
                          <div
                            className="resize-handle sw"
                            style={{
                              position: 'absolute',
                              bottom: '-5px',
                              left: '-5px',
                              width: '10px',
                              height: '10px',
                              backgroundColor: 'white',
                              border: '1px solid red',
                              cursor: 'sw-resize',
                              zIndex: 3,
                            }}
                          />
                          <div
                            className="resize-handle se"
                            style={{
                              position: 'absolute',
                              bottom: '-5px',
                              right: '-5px',
                              width: '10px',
                              height: '10px',
                              backgroundColor: 'white',
                              border: '1px solid red',
                              cursor: 'se-resize',
                              zIndex: 3,
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </Box>
            )}
          </Grid>

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Annotations
              </Typography>
              <List>
                {annotations.map((annotation) => (
                  <ListItem key={annotation.id} selected={selectedAnnotation?.id === annotation.id}>
                    <ListItemText
                      primary={annotation.label}
                      secondary={`Confiance: ${Math.round(annotation.confidence * 100)}%`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleAnnotationEdit(annotation)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleAnnotationDelete(annotation.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {selectedAnnotation && editedAnnotation && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Modifier l'annotation
                  </Typography>
                  <TextField
                    fullWidth
                    label="Label"
                    value={editedAnnotation.label}
                    onChange={(e) => handleAnnotationUpdate('label', e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Confiance (%)"
                    value={Math.round(editedAnnotation.confidence * 100)}
                    onChange={(e) =>
                      handleAnnotationUpdate('confidence', Number(e.target.value) / 100)
                    }
                    margin="normal"
                    slotProps={{
                      htmlInput: { min: 0, max: 100 },
                    }}
                  />

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Coordonnées de la boîte
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        label="X Min"
                        type="number"
                        value={Math.round(editedAnnotation.x_min * 100)}
                        onChange={(e) => {
                          const value = Number(e.target.value) / 100;
                          if (value >= 0 && value < editedAnnotation.x_max) {
                            handleAnnotationUpdate('x_min', value);
                          }
                        }}
                        slotProps={{
                          htmlInput: { min: 0, max: 99 },
                        }}
                      />
                    </Grid>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        label="X Max"
                        type="number"
                        value={Math.round(editedAnnotation.x_max * 100)}
                        onChange={(e) => {
                          const value = Number(e.target.value) / 100;
                          if (value <= 1 && value > editedAnnotation.x_min) {
                            handleAnnotationUpdate('x_max', value);
                          }
                        }}
                        slotProps={{
                          htmlInput: { min: 1, max: 100 },
                        }}
                      />
                    </Grid>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        label="Y Min"
                        type="number"
                        value={Math.round(editedAnnotation.y_min * 100)}
                        onChange={(e) => {
                          const value = Number(e.target.value) / 100;
                          if (value >= 0 && value < editedAnnotation.y_max) {
                            handleAnnotationUpdate('y_min', value);
                          }
                        }}
                        slotProps={{
                          htmlInput: { min: 0, max: 99 },
                        }}
                      />
                    </Grid>
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        label="Y Max"
                        type="number"
                        value={Math.round(editedAnnotation.y_max * 100)}
                        onChange={(e) => {
                          const value = Number(e.target.value) / 100;
                          if (value <= 1 && value > editedAnnotation.y_min) {
                            handleAnnotationUpdate('y_max', value);
                          }
                        }}
                        slotProps={{
                          htmlInput: { min: 1, max: 100 },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={handleSaveEdit}
                      startIcon={<SaveIcon />}
                    >
                      Sauvegarder
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="secondary"
                      onClick={handleCancelEdit}
                    >
                      Annuler
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AnnotationPage;

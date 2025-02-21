import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Grid, 
  Paper, 
  Typography, 
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { Stage, Layer, Rect, Transformer, Image as KonvaImage, Group } from 'react-konva';
import { annotationAPI } from '../../services/api';

// Nouvelle fonction de validation
const validateAnnotations = (annotations) => {
  return annotations.every(ann => 
    ann.label.trim() && 
    ann.x_max > ann.x_min && 
    ann.y_max > ann.y_min
  );
};

const BoundingBox = ({ 
  annotation, 
  isSelected, 
  onSelect, 
  onChange,
  imageScale,
  stageRef 
}) => {
  const shapeRef = useRef();
  const transformerRef = useRef();

  useEffect(() => {
    if (isSelected && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e) => {
    if (!onChange) return;

    const node = e.target;
    const stage = node.getStage();
    const scale = imageScale || 1;
    
    // Calculer les nouvelles coordonnées relatives (0-1)
    const newCoords = {
      x_min: node.x() / (stage.width() * scale),
      y_min: node.y() / (stage.height() * scale),
      x_max: (node.x() + node.width() * node.scaleX()) / (stage.width() * scale),
      y_max: (node.y() + node.height() * node.scaleY()) / (stage.height() * scale)
    };

    onChange({
      ...annotation,
      ...newCoords
    });
  };

  const scale = imageScale || 1;
  const width = (annotation.x_max - annotation.x_min) * stageRef.current?.width() * scale || 0;
  const height = (annotation.y_max - annotation.y_min) * stageRef.current?.height() * scale || 0;
  const x = annotation.x_min * stageRef.current?.width() * scale || 0;
  const y = annotation.y_min * stageRef.current?.height() * scale || 0;

  return (
    <>
      <Rect
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={isSelected ? "#00ff00" : "#ff0000"}
        strokeWidth={2}
        fill="transparent"
        onClick={onSelect}
        onTap={onSelect}
        draggable
        onDragEnd={handleDragEnd}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Empêcher les dimensions négatives
            const minSize = 5;
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={false}
        />
      )}
    </>
  );
};

const BoundingBoxEditor = ({ annotation, onUpdate }) => {
  const [coordinates, setCoordinates] = useState({
    x_min: annotation.x_min || 0,
    y_min: annotation.y_min || 0,
    x_max: annotation.x_max || 1,
    y_max: annotation.y_max || 1
  });

  const handleChange = (field, value) => {
    // Convertir en nombre
    const num = parseFloat(value);
    
    // Mettre à jour seulement si c'est un nombre valide
    if (!isNaN(num)) {
      const newCoordinates = { ...coordinates };
      
      // Appliquer les contraintes min/max
      switch (field) {
        case 'x_min':
          newCoordinates.x_min = Math.min(Math.max(num, 0), coordinates.x_max);
          break;
        case 'y_min':
          newCoordinates.y_min = Math.min(Math.max(num, 0), coordinates.y_max);
          break;
        case 'x_max':
          newCoordinates.x_max = Math.min(Math.max(num, coordinates.x_min), 1);
          break;
        case 'y_max':
          newCoordinates.y_max = Math.min(Math.max(num, coordinates.y_min), 1);
          break;
      }
      
      setCoordinates(newCoordinates);
    }
  };

  const handleUpdate = () => {
    onUpdate(coordinates);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="X Min"
            type="number"
            inputProps={{ 
              min: 0, 
              max: coordinates.x_max,
              step: 0.01 
            }}
            value={coordinates.x_min.toString()}
            onChange={(e) => handleChange('x_min', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Y Min"
            type="number"
            inputProps={{ 
              min: 0, 
              max: coordinates.y_max,
              step: 0.01 
            }}
            value={coordinates.y_min.toString()}
            onChange={(e) => handleChange('y_min', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="X Max"
            type="number"
            inputProps={{ 
              min: coordinates.x_min, 
              max: 1,
              step: 0.01 
            }}
            value={coordinates.x_max.toString()}
            onChange={(e) => handleChange('x_max', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Y Max"
            type="number"
            inputProps={{ 
              min: coordinates.y_min, 
              max: 1,
              step: 0.01 
            }}
            value={coordinates.y_max.toString()}
            onChange={(e) => handleChange('y_max', e.target.value)}
            margin="normal"
          />
        </Grid>
      </Grid>
      <Button 
        variant="contained"
        onClick={handleUpdate}
        sx={{ mt: 2 }}
      >
        Mettre à jour
      </Button>
    </Box>
  );
};

const ImageAnnotator = ({ onSave }) => {
  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const stageRef = useRef(null);

  // Fonction pour générer un ID unique
  const generateId = () => `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Fonction pour gérer le chargement d'une image
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Charger l'image pour l'affichage
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target.result;
        img.onload = () => {
          setImageElement(img);
        };
      };
      reader.readAsDataURL(file);

      // Envoyer l'image au serveur pour la détection
      const response = await annotationAPI.detectObjects(file);
      
      // Ajouter des IDs aux détections et mettre à jour les annotations
      if (response.data && response.data.detections) {
        const detectionsWithIds = response.data.detections.map(detection => ({
          ...detection,
          id: generateId()
        }));
        setAnnotations(detectionsWithIds);
      } else {
        setAnnotations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError('Erreur lors du chargement de l\'image. Veuillez réessayer.');
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer la suppression d'une annotation
  const handleAnnotationDelete = (annotationId) => {
    setAnnotations(prevAnnotations => 
      prevAnnotations.filter(ann => ann.id !== annotationId)
    );
    setSelectedId(null);
  };

  // Fonction pour gérer la mise à jour d'une annotation
  const handleAnnotationUpdate = (updatedAnnotation) => {
    setAnnotations(prevAnnotations =>
      prevAnnotations.map(ann =>
        ann.id === updatedAnnotation.id ? updatedAnnotation : ann
      )
    );
  };

  // Fonction pour gérer la sélection d'une annotation
  const handleSelect = (id) => {
    setSelectedId(id === selectedId ? null : id);
  };

  // Fonction pour gérer l'ouverture du dialogue d'édition
  const handleEditClick = (annotation, event) => {
    event.stopPropagation();
    setEditingAnnotation(annotation);
    setEditDialogOpen(true);
  };

  // Fonction pour gérer la fermeture du dialogue d'édition
  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setEditingAnnotation(null);
  };

  // Fonction pour gérer la mise à jour depuis le dialogue
  const handleDialogUpdate = (updatedAnnotation) => {
    handleAnnotationUpdate(updatedAnnotation);
    handleCloseDialog();
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Interface d'Annotation
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <input
              accept="image/*"
              type="file"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button
                variant="contained"
                component="span"
                disabled={loading}
                size="large"
              >
                CHARGER UNE IMAGE
              </Button>
            </label>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper 
            sx={{ 
              width: '100%', 
              height: '600px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5'
            }}
          >
            {loading && (
              <CircularProgress 
                sx={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }} 
              />
            )}
            
            <Stage
              ref={stageRef}
              width={window.innerWidth * 0.6}
              height={600}
              onMouseDown={e => {
                if (e.target === e.target.getStage()) {
                  setSelectedId(null);
                }
              }}
            >
              <Layer>
                {imageElement && (
                  <KonvaImage
                    image={imageElement}
                    width={window.innerWidth * 0.6}
                    height={600}
                  />
                )}
                
                {annotations.map((ann) => (
                  <BoundingBox
                    key={ann.id}
                    annotation={ann}
                    isSelected={ann.id === selectedId}
                    onSelect={() => handleSelect(ann.id)}
                    onChange={handleAnnotationUpdate}
                    imageScale={1}
                    stageRef={stageRef}
                  />
                ))}
              </Layer>
            </Stage>
          </Paper>
        </Grid>

        {/* Panneau latéral */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Annotations
            </Typography>
            
            {/* Liste des annotations */}
            <List>
              {annotations.map((ann) => (
                <ListItem
                  key={`list-item-${ann.id}`}
                  selected={ann.id === selectedId}
                  onClick={() => handleSelect(ann.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemText
                    primary={ann.label}
                    secondary={`Confiance: ${(ann.confidence * 100).toFixed(1)}%`}
                  />
                  {ann.id === selectedId && (
                    <Box>
                      <IconButton 
                        key={`edit-btn-${ann.id}`}
                        size="small"
                        onClick={(e) => handleEditClick(ann, e)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        key={`delete-btn-${ann.id}`}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnnotationDelete(ann.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialogue d'édition */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Modifier l'annotation
        </DialogTitle>
        <DialogContent>
          {editingAnnotation && (
            <>
              <TextField
                fullWidth
                label="Label"
                value={editingAnnotation.label}
                onChange={(e) => setEditingAnnotation({
                  ...editingAnnotation,
                  label: e.target.value
                })}
                margin="normal"
              />
              <BoundingBoxEditor 
                annotation={editingAnnotation}
                onUpdate={(updatedCoords) => {
                  setEditingAnnotation({
                    ...editingAnnotation,
                    ...updatedCoords
                  });
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Annuler
          </Button>
          <Button 
            onClick={() => handleDialogUpdate(editingAnnotation)}
            variant="contained"
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageAnnotator;

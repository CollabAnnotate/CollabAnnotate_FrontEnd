import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { projectsAPI, annotationAPI } from '../../services/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [editedAnnotation, setEditedAnnotation] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const getRelativeCoordinates = (event) => {
    if (!imageRef.current) return { x: 0, y: 0 };

    const rect = imageRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height
    };
  };

  const handleBoxMouseDown = (e, annotation) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    handleAnnotationEdit(annotation);
  };

  const handleBoxMouseMove = (e) => {
    if (!isDragging || !selectedAnnotation || !editedAnnotation) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const deltaX = x - dragStart.x / rect.width;
    const deltaY = y - dragStart.y / rect.height;

    if (resizing) {
      let newAnnotation = { ...editedAnnotation };

      switch (resizing) {
        case 'nw':
          newAnnotation = {
            ...newAnnotation,
            x_min: Math.min(Math.max(x, 0), newAnnotation.x_max - 0.01),
            y_min: Math.min(Math.max(y, 0), newAnnotation.y_max - 0.01)
          };
          break;
        case 'ne':
          newAnnotation = {
            ...newAnnotation,
            x_max: Math.max(Math.min(x, 1), newAnnotation.x_min + 0.01),
            y_min: Math.min(Math.max(y, 0), newAnnotation.y_max - 0.01)
          };
          break;
        case 'sw':
          newAnnotation = {
            ...newAnnotation,
            x_min: Math.min(Math.max(x, 0), newAnnotation.x_max - 0.01),
            y_max: Math.max(Math.min(y, 1), newAnnotation.y_min + 0.01)
          };
          break;
        case 'se':
          newAnnotation = {
            ...newAnnotation,
            x_max: Math.max(Math.min(x, 1), newAnnotation.x_min + 0.01),
            y_max: Math.max(Math.min(y, 1), newAnnotation.y_min + 0.01)
          };
          break;
        default:
          break;
      }

      setEditedAnnotation(newAnnotation);
    } else {
      // Déplacement de la boîte
      const width = editedAnnotation.x_max - editedAnnotation.x_min;
      const height = editedAnnotation.y_max - editedAnnotation.y_min;
      
      let newX_min = editedAnnotation.x_min + deltaX;
      let newY_min = editedAnnotation.y_min + deltaY;
      
      // Empêcher la boîte de sortir des limites
      if (newX_min < 0) newX_min = 0;
      if (newY_min < 0) newY_min = 0;
      if (newX_min + width > 1) newX_min = 1 - width;
      if (newY_min + height > 1) newY_min = 1 - height;
      
      setEditedAnnotation({
        ...editedAnnotation,
        x_min: newX_min,
        y_min: newY_min,
        x_max: newX_min + width,
        y_max: newY_min + height
      });
    }

    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleBoxMouseUp = () => {
    if (isDragging && editedAnnotation) {
      // Mettre à jour l'annotation dans le tableau principal
      setAnnotations(prevAnnotations => 
        prevAnnotations.map(ann => 
          ann.id === editedAnnotation.id ? editedAnnotation : ann
        )
      );
    }
    setIsDragging(false);
    setResizing(null);
  };

  const handleAnnotationEdit = (annotation) => {
    setSelectedAnnotation(annotation);
    setEditedAnnotation({ ...annotation }); // Créer une copie pour l'édition
  };

  const handleAnnotationUpdate = (field, value) => {
    if (editedAnnotation) {
      const updatedAnnotation = { ...editedAnnotation, [field]: value };
      setEditedAnnotation(updatedAnnotation);
      
      // Mettre à jour immédiatement dans le tableau principal
      setAnnotations(prevAnnotations => 
        prevAnnotations.map(ann => 
          ann.id === updatedAnnotation.id ? updatedAnnotation : ann
        )
      );
    }
  };

  const handleSaveEdit = () => {
    if (editedAnnotation) {
      // Mettre à jour l'annotation dans le tableau principal
      setAnnotations(prevAnnotations => 
        prevAnnotations.map(ann => 
          ann.id === editedAnnotation.id ? editedAnnotation : ann
        )
      );
      
      // Réinitialiser l'état d'édition
      setSelectedAnnotation(null);
      setEditedAnnotation(null);
    }
  };

  const handleCancelEdit = () => {
    // Restaurer l'annotation originale
    if (selectedAnnotation) {
      setAnnotations(prevAnnotations => 
        prevAnnotations.map(ann => 
          ann.id === selectedAnnotation.id ? selectedAnnotation : ann
        )
      );
    }
    setSelectedAnnotation(null);
    setEditedAnnotation(null);
  };

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectRes, statsRes, imagesRes] = await Promise.all([
        projectsAPI.getProject(id),
        projectsAPI.getProjectStats(id),
        projectsAPI.getProjectImages(id)
      ]);

      setProject(projectRes.data);
      setStats(statsRes.data);
      setImages(imagesRes.data);
    } catch (err) {
      console.error('Erreur lors du chargement du projet:', err);
      setError('Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id === 'new') {
      // Si c'est un nouveau projet, initialiser un projet vide
      setProject({
        name: '',
        description: '',
        status: 'draft',
        visibility: 'private',
        allow_community_annotations: true
      });
      setStats({
        total_images: 0,
        total_annotations: 0,
        pending_annotations: 0
      });
      setImages([]);
      setLoading(false);
    } else {
      // Si c'est un projet existant, charger les données
      fetchProjectData();
    }
  }, [id, fetchProjectData]);

  const handleSave = async () => {
    try {
      const projectData = {
        name: project.name,
        description: project.description,
        allow_community_annotations: project.allow_community_annotations,
        status: project.status || 'draft',
        visibility: project.visibility || 'private'
      };

      if (id === 'new') {
        const response = await projectsAPI.createProject(projectData);
        navigate(`/projects/${response.data.id}`);
      } else {
        await projectsAPI.updateProject(id, projectData);
        await fetchProjectData();
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde du projet');
    }
  };

  const handleChange = (field, value) => {
    setProject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const response = await projectsAPI.addImages(id, formData);
      // Mettre à jour la liste des images avec les nouvelles images
      setImages(prevImages => [...prevImages, ...response.data]);
    } catch (error) {
      console.error('Erreur lors de l\'upload des images:', error);
      setError('Erreur lors de l\'upload des images');
    }
  };

  const handlePublishToggle = async () => {
    try {
      if (project.status === 'published') {
        await projectsAPI.unpublishProject(id);
      } else {
        await projectsAPI.publishProject(id);
      }
      await fetchProjectData();
    } catch (err) {
      setError('Erreur lors du changement de statut du projet');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
      try {
        await projectsAPI.deleteProject(id);
        navigate('/projects', { state: { message: 'Projet supprimé avec succès' } });
      } catch (error) {
        console.error('Erreur lors de la suppression du projet:', error);
        setError('Erreur lors de la suppression du projet');
      }
    }
  };

  const handleAnnotationSave = async (annotations) => {
    try {
      await Promise.all(annotations.map(annotation => 
        annotationAPI.createAnnotation({
          dataitem: selectedImage.id,  
          label: annotation.label,
          x_min: annotation.x_min,
          y_min: annotation.y_min,
          x_max: annotation.x_max,
          y_max: annotation.y_max
        })
      ));
      
      // Rafraîchir les données
      const imagesRes = await projectsAPI.getProjectImages(id);
      setImages(imagesRes.data);
      setSelectedImage(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des annotations:', error);
      setError('Erreur lors de la sauvegarde des annotations');
    }
  };

  const handleImageSelect = async (image) => {
    setSelectedImage(image);
    setCurrentTab(1); // Basculer vers l'onglet Annotations
    
    // Créer l'URL de prévisualisation
    const imageUrl = `${process.env.REACT_APP_API_URL}${image.file}`;
    setImagePreview(imageUrl);
    
    try {
      // Récupérer les annotations existantes
      const annotationsRes = await annotationAPI.getAnnotations(image.id);
      setAnnotations(annotationsRes.data);
      
      // Appeler la détection YOLO
      const response = await projectsAPI.detectObjects(id, {
        image_id: image.id
      });
      
      // Fusionner les détections avec les annotations existantes
      const yoloAnnotations = response.data.map(detection => ({
        ...detection,
        id: `yolo-${Date.now()}-${Math.random()}`,
        type: 'yolo',
        data_item: image.id
      }));
      
      setAnnotations(prev => [...prev, ...yoloAnnotations]);
    } catch (error) {
      console.error('Erreur lors du chargement des annotations:', error);
      setError('Erreur lors du chargement des annotations');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!project) return <Alert severity="info">Projet non trouvé</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Onglets de navigation */}
        <Grid item xs={12}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Informations" />
            <Tab label="Images & Annotations" />
            <Tab label="Statistiques" />
          </Tabs>
        </Grid>

        {/* Contenu des onglets */}
        <Grid item xs={12}>
          {/* Onglet Informations */}
          {currentTab === 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informations du projet
              </Typography>
              <TextField
                fullWidth
                label="Nom du projet"
                value={project?.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description"
                value={project?.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                margin="normal"
                multiline
                rows={4}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={project?.allow_community_annotations || false}
                    onChange={(e) => handleChange('allow_community_annotations', e.target.checked)}
                  />
                }
                label="Autoriser les annotations communautaires"
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                >
                  Sauvegarder
                </Button>
                {id !== 'new' && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDelete}
                    startIcon={<DeleteIcon />}
                  >
                    Supprimer
                  </Button>
                )}
              </Box>
            </Paper>
          )}

          {/* Onglet Images & Annotations */}
          {currentTab === 1 && (
            <Box>
              {/* Section upload d'images */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Images du projet
                </Typography>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<AddIcon />}
                  >
                    Ajouter des images
                  </Button>
                </label>
              </Paper>

              {/* Liste des images */}
              {!selectedImage ? (
                <Grid container spacing={2}>
                  {images.map((image) => (
                    <Grid item xs={12} sm={6} md={4} key={image.id}>
                      <Paper
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => handleImageSelect(image)}
                      >
                        <Box
                          component="img"
                          src={image.image_url || `${process.env.REACT_APP_API_URL}${image.file}`}
                          alt={`Image ${image.id}`}
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 1
                          }}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {image.name || `Image ${image.id}`}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                /* Interface d'annotation */
                <Box>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Annotation de l'image
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        setSelectedImage(null);
                        setAnnotations([]);
                        setSelectedAnnotation(null);
                        setEditedAnnotation(null);
                      }}
                    >
                      Retour aux images
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Paper sx={{ p: 2, height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box
                          ref={containerRef}
                          sx={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseMove={handleBoxMouseMove}
                          onMouseUp={handleBoxMouseUp}
                          onMouseLeave={handleBoxMouseUp}
                        >
                          <img 
                            ref={imageRef} 
                            src={selectedImage?.image_url || `${process.env.REACT_APP_API_URL}${selectedImage?.file}`}
                            alt="Preview" 
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0
                            }}
                          >
                            {annotations.map((annotation, index) => {
                              const isSelected = selectedAnnotation?.id === annotation.id;
                              const annotationToShow = isSelected ? editedAnnotation : annotation;
                              
                              return (
                                <div
                                  key={index}
                                  style={{
                                    position: 'absolute',
                                    left: `${annotationToShow.x_min * 100}%`,
                                    top: `${annotationToShow.y_min * 100}%`,
                                    width: `${(annotationToShow.x_max - annotationToShow.x_min) * 100}%`,
                                    height: `${(annotationToShow.y_max - annotationToShow.y_min) * 100}%`,
                                    border: '2px solid red',
                                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                    cursor: isSelected ? 'move' : 'pointer',
                                    zIndex: isSelected ? 2 : 1
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAnnotationEdit(annotation);
                                  }}
                                  onMouseDown={(e) => handleBoxMouseDown(e, annotation)}
                                >
                                  <div style={{
                                    position: 'absolute',
                                    top: '-24px',
                                    left: '0',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    padding: '2px 6px',
                                    fontSize: '12px',
                                    borderRadius: '3px',
                                    zIndex: 3
                                  }}>
                                    {annotationToShow.label} ({Math.round(annotationToShow.confidence * 100)}%)
                                  </div>
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
                                          border: '2px solid red', 
                                          cursor: 'nw-resize',
                                          zIndex: 3 
                                        }} 
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          setResizing('nw');
                                          handleBoxMouseDown(e, annotation);
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
                                          border: '2px solid red', 
                                          cursor: 'ne-resize',
                                          zIndex: 3 
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          setResizing('ne');
                                          handleBoxMouseDown(e, annotation);
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
                                          border: '2px solid red', 
                                          cursor: 'sw-resize',
                                          zIndex: 3 
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          setResizing('sw');
                                          handleBoxMouseDown(e, annotation);
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
                                          border: '2px solid red', 
                                          cursor: 'se-resize',
                                          zIndex: 3 
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          setResizing('se');
                                          handleBoxMouseDown(e, annotation);
                                        }}
                                      />
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Annotations
                        </Typography>
                        
                        {/* Liste des annotations */}
                        <List>
                          {annotations.map((annotation) => (
                            <ListItem
                              key={annotation.id}
                              secondaryAction={
                                <IconButton edge="end" onClick={() => handleAnnotationEdit(annotation)}>
                                  <EditIcon />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={annotation.label}
                                secondary={`Confiance: ${Math.round(annotation.confidence * 100)}%`}
                              />
                            </ListItem>
                          ))}
                        </List>

                        {/* Formulaire d'édition */}
                        {selectedAnnotation && editedAnnotation && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
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
                              onChange={(e) => handleAnnotationUpdate('confidence', Number(e.target.value) / 100)}
                              margin="normal"
                              InputProps={{ inputProps: { min: 0, max: 100 } }}
                            />

                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                              Coordonnées de la boîte
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
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
                                  InputProps={{ inputProps: { min: 0, max: 99 } }}
                                />
                              </Grid>
                              <Grid item xs={6}>
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
                                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                                />
                              </Grid>
                              <Grid item xs={6}>
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
                                  InputProps={{ inputProps: { min: 0, max: 99 } }}
                                />
                              </Grid>
                              <Grid item xs={6}>
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
                                  InputProps={{ inputProps: { min: 1, max: 100 } }}
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
                </Box>
              )}
            </Box>
          )}

          {/* Onglet Statistiques */}
          {currentTab === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statistiques du projet
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Images"
                    secondary={stats?.total_images || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Annotations totales"
                    secondary={stats?.total_annotations || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Annotations en attente"
                    secondary={stats?.pending_annotations || 0}
                  />
                </ListItem>
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDetail;

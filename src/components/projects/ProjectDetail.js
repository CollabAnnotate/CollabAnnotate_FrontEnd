import React, { useState, useEffect } from 'react';
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
  ListItemSecondary,
  IconButton,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Publish as PublishIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { projectsAPI } from '../../services/api';
import ImageAnnotator from '../annotation/ImageAnnotator';

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
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [editing, setEditing] = useState(false);
  const [existingAnnotations, setExistingAnnotations] = useState([]);

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
  }, [id]);

  const fetchProjectData = async () => {
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
  };

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

  const handleAnnotationSave = async (annotations) => {
    try {
      await Promise.all(annotations.map(annotation => 
        projectsAPI.createAnnotation({
          project_id: id,
          image_id: selectedImage.id,
          ...annotation
        })
      ));
      
      // Rafraîchir les données
      const imagesRes = await projectsAPI.getProjectImages(id);
      setImages(imagesRes.data);
      setShowAnnotator(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des annotations:', error);
      setError('Erreur lors de la sauvegarde des annotations');
    }
  };

  const handleImageSelect = async (image) => {
    setSelectedImage(image);
    setShowAnnotator(true);
    setCurrentTab(1); // Basculer vers l'onglet Annotations
    
    try {
      // Appeler la détection YOLO
      const response = await projectsAPI.detectObjects(id, {
        image_id: image.id
      });
      
      // Convertir les détections en annotations
      const yoloAnnotations = response.data.map(detection => ({
        ...detection,
        type: 'yolo', // Marquer comme une annotation YOLO
        data_item: image.id
      }));
      
      // Mettre à jour les annotations existantes
      setExistingAnnotations(yoloAnnotations);
    } catch (error) {
      console.error('Erreur lors de la détection YOLO:', error);
      setError('Erreur lors de la détection automatique des objets');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!project) return <Alert severity="info">Projet non trouvé</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            {id === 'new' ? (
              // Formulaire de création de projet
              <>
                <Typography variant="h4" gutterBottom>Nouveau Projet</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nom du projet"
                      value={project?.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={4}
                      value={project?.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={project?.allow_community_annotations || false}
                          onChange={(e) => handleChange('allow_community_annotations', e.target.checked)}
                        />
                      }
                      label="Autoriser les annotations communautaires"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/projects')}
                      >
                        Annuler
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={!project?.name}
                      >
                        Créer le projet
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </>
            ) : (
              // Affichage des détails du projet
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4">{project?.name}</Typography>
                  <Box>
                    <IconButton onClick={handlePublishToggle} title={project?.status === 'published' ? 'Dépublier' : 'Publier'}>
                      {project?.status === 'published' ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    <IconButton onClick={() => setEditing(true)} title="Modifier">
                      <EditIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography color="textSecondary" gutterBottom>{project?.description}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">
                      Créé le: {project?.created_at ? new Date(project.created_at).toLocaleDateString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">
                      Statut: {project?.status || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">
                      Annotations communautaires: {project?.allow_community_annotations ? 'Autorisées' : 'Désactivées'}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </Grid>

        {id !== 'new' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Tabs
                value={currentTab}
                onChange={(e, newValue) => setCurrentTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab label="Images" />
                <Tab label="Annotations" />
                <Tab label="Statistiques" />
              </Tabs>

              {currentTab === 0 && (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      onChange={handleImageUpload}
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
                  </Box>
                  <Grid container spacing={2}>
                    {images.map((image) => (
                      <Grid item xs={12} sm={6} md={4} key={image.id}>
                        <Paper
                          sx={{
                            p: 1,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => handleImageSelect(image)}
                        >
                          <img
                            src={image.image_url}
                            alt={`Image ${image.id}`}
                            style={{ width: '100%', height: 'auto' }}
                          />
                          <Typography variant="body2">
                            Annotations: {image.annotations_count || 0}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {currentTab === 1 && selectedImage && showAnnotator && (
                <Box>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Annotation de l'image
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        setShowAnnotator(false);
                        setSelectedImage(null);
                      }}
                    >
                      Fermer
                    </Button>
                  </Box>
                  <ImageAnnotator
                    image={selectedImage}
                    onSave={handleAnnotationSave}
                    existingAnnotations={existingAnnotations}
                  />
                </Box>
              )}

              {currentTab === 1 && !selectedImage && (
                <Alert severity="info">
                  Sélectionnez une image dans l'onglet "Images" pour commencer l'annotation
                </Alert>
              )}

              {currentTab === 2 && stats && (
                <Box>
                  <Typography variant="h6" gutterBottom>Statistiques du projet</Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Images totales"
                        secondary={stats.total_images}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Annotations totales"
                        secondary={stats.total_annotations}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Annotations en attente"
                        secondary={stats.pending_annotations}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ProjectDetail;

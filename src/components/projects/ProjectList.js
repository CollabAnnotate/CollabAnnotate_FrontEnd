import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  ButtonGroup,
} from '@mui/material';
import { projectsAPI } from '../../services/api';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects();
      setProjects(response.data);
    } catch (error) {
      setError('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      setError('Le nom du projet est obligatoire');
      return;
    }

    try {
      const response = await projectsAPI.createProject(newProject);
      setOpenDialog(false);
      fetchProjects();
      setNewProject({ name: '', description: '' });
      // Rediriger vers le nouveau projet
      navigate(`/projects/${response.data.id}`);
    } catch (error) {
      setError('Erreur lors de la création du projet');
    }
  };

  const handleAnnotate = (projectId) => {
    navigate(`/projects/${projectId}/annotate`);
  };

  const handleViewDetails = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Projets</Typography>
        <Button 
          variant="contained" 
          onClick={() => setOpenDialog(true)}
        >
          Nouveau Projet
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} key={project.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{project.name}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  {project.description}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Créé le: {new Date(project.created_at).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Statut: {project.status}
                </Typography>
                <Box mt={1}>
                  <Typography variant="body2">
                    Annotations: {project.annotations_count || 0}
                  </Typography>
                  <Typography variant="body2">
                    En attente: {project.pending_annotations_count || 0}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <ButtonGroup variant="text" size="small">
                  <Button 
                    onClick={() => handleViewDetails(project.id)}
                    color="primary"
                  >
                    VOIR LES DÉTAILS
                  </Button>
                  <Button 
                    onClick={() => handleAnnotate(project.id)}
                    color="secondary"
                  >
                    ANNOTER
                  </Button>
                </ButtonGroup>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Nouveau Projet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du projet"
            fullWidth
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleCreateProject} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectList;
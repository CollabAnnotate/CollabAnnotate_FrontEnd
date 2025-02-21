import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { projectsAPI } from '../../services/api';

const ProjectList = () => {
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
      await projectsAPI.createProject(newProject);
      setOpenDialog(false);
      fetchProjects();
      setNewProject({ name: '', description: '' });
    } catch (error) {
      setError('Erreur lors de la création du projet');
    }
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
                <Typography color="textSecondary">
                  {project.description}
                </Typography>
                <Typography variant="body2">
                  Créé le: {new Date(project.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Créer un nouveau projet</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom du projet"
            margin="normal"
            value={newProject.name}
            onChange={(e) => setNewProject({
              ...newProject,
              name: e.target.value
            })}
          />
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={4}
            value={newProject.description}
            onChange={(e) => setNewProject({
              ...newProject,
              description: e.target.value
            })}
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
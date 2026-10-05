import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { projectsAPI } from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalAnnotations: 0,
    pendingValidations: 0,
  });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projectsResponse = await projectsAPI.getProjects();
      setProjects(projectsResponse.data);

      // Calculer les statistiques
      const totalAnnotations = projectsResponse.data.reduce(
        (acc, project) => acc + (project.total_annotations || 0),
        0,
      );

      setStats({
        totalProjects: projectsResponse.data.length,
        totalAnnotations,
        pendingValidations: projectsResponse.data.reduce(
          (acc, project) => acc + (project.pending_annotations || 0),
          0,
        ),
      });
      setError('');
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Tableau de bord
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateProject}>
          Nouveau Projet
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistiques générales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Projets</Typography>
            <Typography variant="h3">{stats.totalProjects}</Typography>
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Annotations</Typography>
            <Typography variant="h3">{stats.totalAnnotations}</Typography>
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">En attente</Typography>
            <Typography variant="h3">{stats.pendingValidations}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Liste des projets */}
      <Typography variant="h5" gutterBottom>
        Projets récents
      </Typography>
      {projects.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">Aucun projet n'a été créé pour le moment.</Typography>
          <Button variant="contained" color="primary" onClick={handleCreateProject} sx={{ mt: 2 }}>
            Créer votre premier projet
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid
              key={project.id}
              size={{
                xs: 12,
                md: 6,
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6">{project.name}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {project.description}
                  </Typography>
                  <Typography variant="body2">
                    Créé le: {new Date(project.created_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Annotations: {project.total_annotations || 0}
                  </Typography>
                  <Typography variant="body2">
                    En attente: {project.pending_annotations || 0}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/projects/${project.id}`)}>
                    Voir les détails
                  </Button>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => navigate(`/projects/${project.id}/annotate`)}
                  >
                    Annoter
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;

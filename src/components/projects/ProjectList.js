import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Image as ImageIcon,
  Edit as EditIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Launch as LaunchIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { projectsAPI } from '../../services/api';

const ProjectCard = ({ project }) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 2 }}>
        <Typography variant="h5" component="div" gutterBottom noWrap>
          {project.name}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '4.5em'
          }}
        >
          {project.description}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label={`${project.total_images || 0} images`}
            icon={<ImageIcon />}
            sx={{ bgcolor: 'primary.light' }}
          />
          <Chip
            size="small"
            label={`${project.total_annotations || 0} annotations`}
            icon={<EditIcon />}
            sx={{ bgcolor: 'secondary.light' }}
          />
          <Chip
            size="small"
            label={project.visibility}
            icon={project.visibility === 'public' ? <PublicIcon /> : <LockIcon />}
            sx={{ bgcolor: 'info.light' }}
          />
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          component={Link}
          to={`/projects/${project.id}`}
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<LaunchIcon />}
        >
          Ouvrir
        </Button>
      </CardActions>
    </Card>
  );
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

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

  const filteredProjects = projects.filter((project) => {
    if (visibilityFilter === 'all') return true;
    if (visibilityFilter === 'public' && project.visibility === 'public') return true;
    if (visibilityFilter === 'private' && project.visibility === 'private') return true;
    return false;
  }).filter((project) => {
    return project.name.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'created_at') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'updated_at') return new Date(a.updated_at) - new Date(b.updated_at);
    return 0;
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Mes Projets
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nouveau Projet
        </Button>
      </Box>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Rechercher"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Visibilité</InputLabel>
              <Select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                label="Visibilité"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Privé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Trier par</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Trier par"
              >
                <MenuItem value="name">Nom</MenuItem>
                <MenuItem value="created_at">Date de création</MenuItem>
                <MenuItem value="updated_at">Dernière modification</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Liste des projets */}
      <Grid container spacing={3}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <ProjectCard project={project} />
          </Grid>
        ))}
      </Grid>

      {/* Dialog de création de projet */}
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
    </Container>
  );
};

export default ProjectList;
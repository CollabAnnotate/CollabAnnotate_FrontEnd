import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { projectsAPI } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ReportGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [stats, setStats] = useState({
    annotationStats: [],
    validationStats: [],
    qualityMetrics: {}
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getProjects();
      setProjects(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des projets');
    }
  };

  const fetchProjectStats = async (projectId) => {
    setLoading(true);
    try {
      const response = await projectsAPI.getProjectStats(projectId);
      setStats(response.data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (event) => {
    const projectId = event.target.value;
    setSelectedProject(projectId);
    if (projectId) {
      fetchProjectStats(projectId);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await projectsAPI.exportProjectReport(selectedProject);
      // Créer un lien pour télécharger le PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport_${selectedProject}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Erreur lors de l\'export du rapport');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Génération de Rapports
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Sélectionner un projet</InputLabel>
        <Select
          value={selectedProject}
          onChange={handleProjectChange}
          label="Sélectionner un projet"
        >
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : selectedProject ? (
        <>
          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Statistiques d'annotation
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.annotationStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Distribution des validations
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.validationStats}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {stats.validationStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid size={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Métriques de qualité
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={4}>
                    <Typography variant="subtitle1">
                      Précision: {stats.qualityMetrics.precision?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="subtitle1">
                      Rappel: {stats.qualityMetrics.recall?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="subtitle1">
                      F1-Score: {stats.qualityMetrics.f1Score?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleExportPDF}
              disabled={loading}
            >
              Exporter en PDF
            </Button>
          </Box>
        </>
      ) : (
        <Typography align="center" color="textSecondary">
          Sélectionnez un projet pour voir les statistiques
        </Typography>
      )}
    </Box>
  );
};

export default ReportGeneration;
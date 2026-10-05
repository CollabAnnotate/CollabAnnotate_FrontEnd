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

// Validées, rejetées, en attente
const VALIDATION_COLORS = ['#2e7d32', '#d32f2f', '#ed6c02'];

// Affiche un ratio (0-1) en pourcentage, ou N/A s'il n'est pas encore calculable
const formatPercent = (value) =>
  value === null || value === undefined ? 'N/A' : `${(value * 100).toFixed(1)} %`;

const QualityMetric = ({ label, value, help }) => (
  <Grid size={{ xs: 12, md: 4 }}>
    <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
    <Typography variant="h5">{formatPercent(value)}</Typography>
    <Typography variant="caption" color="text.secondary">{help}</Typography>
  </Grid>
);

const ReportGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getProjects();
      setProjects(response.data);
    } catch {
      setError('Erreur lors du chargement des projets');
    }
  };

  const fetchProjectStats = async (projectId) => {
    setLoading(true);
    try {
      const response = await projectsAPI.getProjectStats(projectId);
      setStats(response.data);
      setError('');
    } catch {
      setStats(null);
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

  const projectName = projects.find((p) => p.id === selectedProject)?.name;
  const hasValidations = stats?.validation_breakdown.some((entry) => entry.value > 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Rapport{projectName ? ` — ${projectName}` : 's'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 3, displayPrint: 'none' }}>
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
      ) : stats ? (
        <>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Annotations par classe
                </Typography>
                {stats.annotations_by_label.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.annotations_by_label}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Annotations" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">Aucune annotation pour ce projet.</Typography>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  État des validations
                </Typography>
                {hasValidations ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.validation_breakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {stats.validation_breakdown.map((entry, index) => (
                          <Cell key={entry.name} fill={VALIDATION_COLORS[index % VALIDATION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary">Aucune annotation à valider.</Typography>
                )}
              </Paper>
            </Grid>

            <Grid size={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Indicateurs de qualité
                </Typography>
                <Grid container spacing={2}>
                  <QualityMetric
                    label="Taux d'acceptation"
                    value={stats.quality.acceptance_rate}
                    help="Annotations validées parmi celles révisées"
                  />
                  <QualityMetric
                    label="Confiance moyenne"
                    value={stats.quality.average_confidence}
                    help="Confiance moyenne des annotations"
                  />
                  <QualityMetric
                    label="Avancement"
                    value={stats.quality.completion_rate}
                    help={`Images annotées sur ${stats.total_images}`}
                  />
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', displayPrint: 'none' }}>
            {/* L'impression du navigateur propose « Enregistrer en PDF » */}
            <Button variant="contained" onClick={() => window.print()}>
              Imprimer / Exporter en PDF
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

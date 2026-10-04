import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  Button,
} from '@mui/material';
import api from '../../services/api';
import ProjectCollaborators from '../collaboration/ProjectCollaborators';
import ProjectInvitations from '../collaboration/ProjectInvitations';

const Project = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`projects/${projectId}/`);
      setProject(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération du projet:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!project) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Chargement du projet...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {project.name}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            marginBottom: "16px"
          }}>
          {project.description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary">
            Modifier le projet
          </Button>
          {project.status === 'draft' && (
            <Button variant="outlined" color="primary">
              Publier
            </Button>
          )}
        </Box>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Annotations" />
          <Tab label="Collaborateurs" />
          <Tab label="Invitations" />
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && (
          <Typography>
            [Composant d'annotations existant]
          </Typography>
        )}
        {activeTab === 1 && <ProjectCollaborators projectId={projectId} />}
        {activeTab === 2 && <ProjectInvitations />}
      </Box>
    </Container>
  );
};

export default Project;

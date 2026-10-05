import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from '../../services/api';

const ROLE_LABELS = {
  viewer: 'Lecteur',
  annotator: 'Annotateur',
  editor: 'Éditeur',
  admin: 'Administrateur',
};

const ProjectCollaborators = ({ projectId }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCollaborators();
  }, [projectId]);

  const fetchCollaborators = async () => {
    try {
      const response = await api.get(`project-collaborators/?project=${projectId}`);
      setCollaborators(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des collaborateurs:', error);
    }
  };

  const handleInvite = async () => {
    try {
      await api.post('project-invitations/', {
        project: projectId,
        invited_email: inviteEmail,
        role: inviteRole,
      });
      setOpenInviteDialog(false);
      setInviteEmail('');
      setInviteRole('viewer');
      setError('');
      // Rafraîchir la liste des collaborateurs
      fetchCollaborators();
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data);
      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Erreur lors de l'envoi de l'invitation",
      );
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await api.delete(`project-collaborators/${collaboratorId}/`);
      fetchCollaborators();
    } catch (error) {
      console.error('Erreur lors de la suppression du collaborateur:', error);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Collaborateurs</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenInviteDialog(true)}
        >
          Inviter
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Date d'ajout</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {collaborators.map((collaborator) => (
              <TableRow key={collaborator.id}>
                <TableCell>{collaborator.user.username}</TableCell>
                <TableCell>{ROLE_LABELS[collaborator.role]}</TableCell>
                <TableCell>{new Date(collaborator.added_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)}>
        <DialogTitle>Inviter un collaborateur</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <TextField
            select
            margin="dense"
            label="Rôle"
            fullWidth
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Annuler</Button>
          <Button onClick={handleInvite} variant="contained">
            Inviter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectCollaborators;

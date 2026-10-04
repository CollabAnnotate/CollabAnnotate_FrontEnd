import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from '@mui/material';
import api from '../../services/api';

const STATUS_LABELS = {
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Rejetée',
  expired: 'Expirée',
};

const STATUS_COLORS = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  expired: 'default',
};

const ProjectInvitations = () => {
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await api.get('project-invitations/');
      setInvitations(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des invitations:', error);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await api.post(`project-invitations/${invitationId}/accept/`);
      fetchInvitations();
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      await api.post(`project-invitations/${invitationId}/reject/`);
      fetchInvitations();
    } catch (error) {
      console.error('Erreur lors du rejet de l\'invitation:', error);
    }
  };

  const renderActions = (invitation) => {
    if (invitation.status === 'pending') {
      return (
        <>
          <Button
            color="primary"
            onClick={() => handleAcceptInvitation(invitation.id)}
            sx={{ mr: 1 }}
          >
            Accepter
          </Button>
          <Button
            color="error"
            onClick={() => handleRejectInvitation(invitation.id)}
          >
            Refuser
          </Button>
        </>
      );
    }
    return null;
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Invitations aux projets
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Projet</TableCell>
              <TableCell>Invité par</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.project_name}</TableCell>
                <TableCell>{invitation.invited_by_username}</TableCell>
                <TableCell>{invitation.role}</TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABELS[invitation.status]}
                    color={STATUS_COLORS[invitation.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(invitation.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{renderActions(invitation)}</TableCell>
              </TableRow>
            ))}
            {invitations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucune invitation
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProjectInvitations;

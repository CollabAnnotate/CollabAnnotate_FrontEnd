import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { usersAPI, getApiErrorMessage } from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'annotateur',
  });

  const roles = [
    { value: 'annotateur', label: 'Annotateur' },
    { value: 'verificateur', label: 'Vérificateur' },
    { value: 'admin', label: 'Administrateur' },
  ];
  const roleLabel = (value) => roles.find((role) => role.value === value)?.label || value;

  const openDialog = (user = null) => {
    setEditingUser(user);
    setFormData(
      user
        ? { username: user.username, email: user.email, role: user.role }
        : { username: '', email: '', password: '', role: 'annotateur' },
    );
    setDialogError('');
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des utilisateurs'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await usersAPI.updateUser(editingUser.id, formData);
      } else {
        await usersAPI.createUser(formData);
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setDialogError(getApiErrorMessage(err, 'Erreur lors de la sauvegarde'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await usersAPI.deleteUser(userId);
        setError('');
        fetchUsers();
      } catch (err) {
        setError(getApiErrorMessage(err, 'Erreur lors de la suppression'));
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Utilisateurs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => openDialog()}
        sx={{ mb: 2 }}
      >
        Ajouter un utilisateur
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom d'utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{roleLabel(user.role)}</TableCell>
                <TableCell>
                  <IconButton
                    aria-label={`Modifier ${user.username}`}
                    onClick={() => openDialog(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    aria-label={`Supprimer ${user.username}`}
                    onClick={() => handleDelete(user.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editingUser ? 'Modifier' : 'Ajouter'} un utilisateur</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {dialogError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              margin="normal"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value,
                })
              }
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
              }
            />
            {!editingUser && (
              <TextField
                fullWidth
                label="Mot de passe"
                type="password"
                margin="normal"
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
              />
            )}
            <TextField
              fullWidth
              select
              label="Rôle"
              margin="normal"
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value,
                })
              }
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Sauvegarder'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useSelector } from 'react-redux';

// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';


// Main Components
import Dashboard from './components/dashboard/Dashboard';
import ImageAnnotator from './components/annotation/ImageAnnotator';
import RevisionInterface from './components/revision/RevisionInterface';
import ReportGeneration from './components/reports/ReportGeneration';
import UserManagement from './components/users/UserManagement';
import ProjectList from './components/projects/ProjectList';
import UserProfile from './components/users/UserProfile';
import Settings from './components/settings/Settings';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Composant pour les routes protégées
  const PrivateRoute = ({ children, roles }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (roles && !roles.includes(user?.role)) {
      return <Navigate to="/dashboard" />;
    }

    return children;
  };

  // Si l'utilisateur n'est pas authentifié, afficher uniquement les routes d'auth
  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* Navbar */}
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Sidebar */}
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: 8, // Pour compenser la hauteur de la navbar
            width: '100%'
          }}
        >
          <Routes>
            {/* Route Dashboard - accessible à tous les utilisateurs authentifiés */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Route Annotation - accessible aux annotateurs et admins */}
            <Route
              path="/annotation"
              element={
                <PrivateRoute roles={['annotateur', 'admin']}>
                  <ImageAnnotator />
                </PrivateRoute>
              }
            />

            {/* Route Révision - accessible aux vérificateurs et admins */}
            <Route
              path="/revision"
              element={
                <PrivateRoute roles={['verificateur', 'admin']}>
                  <RevisionInterface />
                </PrivateRoute>
              }
            />

            {/* Route Rapports - accessible uniquement aux admins */}
            <Route
              path="/reports"
              element={
                <PrivateRoute roles={['admin']}>
                  <ReportGeneration />
                </PrivateRoute>
              }
            />

            {/* Route Gestion des utilisateurs - accessible uniquement aux admins */}
            <Route
              path="/users"
              element={
                <PrivateRoute roles={['admin']}>
                  <UserManagement />
                </PrivateRoute>
              }
            />

            {/* Route Création de projet - accessible à tous les utilisateurs authentifiés */}
            <Route
              path="/projects/new"
              element={
                <PrivateRoute>
                  <ProjectList />
                </PrivateRoute>
              }
            />

            {/* Route Profil utilisateur - accessible à tous les utilisateurs authentifiés */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              }
            />

            {/* Route Paramètres - accessible à tous les utilisateurs authentifiés */}
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />

            {/* Redirection par défaut vers le dashboard */}
            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
};

export default App;
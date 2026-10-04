import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import theme from './theme';
import { restoreSession } from './store/authSlice';

// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Main Components
import Dashboard from './components/dashboard/Dashboard';
import ImageAnnotator from './components/annotation/ImageAnnotator';
import AnnotationPage from './components/annotation/AnnotationPage';
import RevisionInterface from './components/revision/RevisionInterface';
import ReportGeneration from './components/reports/ReportGeneration';
import UserManagement from './components/users/UserManagement';
import ProjectList from './components/projects/ProjectList';
import ProjectDetail from './components/projects/ProjectDetail';
import Project from './components/project/Project';
import UserProfile from './components/profile/UserProfile';
import Settings from './components/settings/Settings';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated, initialized, user } = useSelector((state) => state.auth);

  // Au chargement, récupère un access token grâce au cookie HttpOnly de refresh
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  if (!initialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex' }}>
          
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
              mt: 8,
              width: '100%'
            }}
          >
            <Routes>
              {/* Route Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              {/* Route Annotation */}
              <Route
                path="/annotation"
                element={
                  <PrivateRoute>
                    <AnnotationPage />
                  </PrivateRoute>
                }
              />

              {/* Routes Projets */}
              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <ProjectList />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/projects/:id"
                element={
                  <PrivateRoute>
                    <ProjectDetail />
                  </PrivateRoute>
                }
              />

              <Route
                path="/projects/:id/annotate"
                element={
                  <PrivateRoute roles={['annotateur', 'admin']}>
                    <ImageAnnotator />
                  </PrivateRoute>
                }
              />

              <Route
                path="/projects/:projectId"
                element={
                  <PrivateRoute>
                    <Project />
                  </PrivateRoute>
                }
              />

              {/* Route Révision */}
              <Route
                path="/revision"
                element={
                  <PrivateRoute roles={['verificateur', 'admin']}>
                    <RevisionInterface />
                  </PrivateRoute>
                }
              />

              {/* Route Rapports */}
              <Route
                path="/reports"
                element={
                  <PrivateRoute roles={['admin']}>
                    <ReportGeneration />
                  </PrivateRoute>
                }
              />

              {/* Route Gestion des utilisateurs */}
              <Route
                path="/users"
                element={
                  <PrivateRoute roles={['admin']}>
                    <UserManagement />
                  </PrivateRoute>
                }
              />

              {/* Route Profil utilisateur */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                }
              />

              {/* Route Paramètres */}
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />

              {/* Redirection par défaut vers le dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
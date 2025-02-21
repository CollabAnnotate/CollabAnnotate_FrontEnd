import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Dashboard from './components/dashboard/Dashboard';
import ImageAnnotator from './components/annotation/ImageAnnotator';
import ProjectList from './components/projects/ProjectList';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, role } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

const routes = [
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute roles={['annotateur', 'verificateur', 'admin']}>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/annotation',
    element: (
      <ProtectedRoute roles={['annotateur', 'verificateur', 'admin']}>
        <ImageAnnotator />
      </ProtectedRoute>
    )
  },
  {
    path: '/projects',
    element: (
      <ProtectedRoute roles={['annotateur', 'verificateur', 'admin']}>
        <ProjectList />
      </ProtectedRoute>
    )
  }
];

export default routes;
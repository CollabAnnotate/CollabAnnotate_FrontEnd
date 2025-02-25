import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Dashboard from './components/dashboard/Dashboard';
import ImageAnnotator from './components/annotation/ImageAnnotator';
import ProjectList from './components/projects/ProjectList';
import UserProfile from './components/profile/UserProfile';
import AnnotationPage from './components/annotation/AnnotationPage';

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
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute roles={['annotateur', 'verificateur', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'annotation',
        element: (
          <ProtectedRoute roles={['annotateur', 'verificateur', 'admin']}>
            <AnnotationPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'projects',
        element: (
          <ProtectedRoute roles={['annotateur', 'verificateur', 'admin']}>
            <ProjectList />
          </ProtectedRoute>
        )
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute roles={['annotateur', 'verificateur', 'admin']}>
            <UserProfile />
          </ProtectedRoute>
        )
      }
    ]
  }
];

export default routes;
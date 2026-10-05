import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Image as ImageIcon,
  CheckCircle as ValidationIcon,
  Assessment as ReportIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['annotateur', 'verificateur', 'admin'],
    },
    {
      text: 'Annotation',
      icon: <ImageIcon />,
      path: '/annotation',
      roles: ['annotateur', 'admin'],
    },
    {
      text: 'Révision',
      icon: <ValidationIcon />,
      path: '/revision',
      roles: ['verificateur', 'admin'],
    },
    {
      text: 'Rapports',
      icon: <ReportIcon />,
      path: '/reports',
      roles: ['admin'],
    },
    {
      text: 'Utilisateurs',
      icon: <UsersIcon />,
      path: '/users',
      roles: ['admin'],
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.role));

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          Menu
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate('/settings')}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Paramètres" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;

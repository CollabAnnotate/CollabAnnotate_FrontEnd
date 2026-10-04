import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Badge,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/authSlice';
import { selectNotifications, selectUnreadCount } from '../../store/notificationsSlice';

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const notifications = useSelector(selectNotifications) || [];
  const unreadCount = useSelector(selectUnreadCount) || 0;

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClick = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
        displayPrint: 'none',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ 
            flexGrow: 1,
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FFFFFF 30%, #E3F2FD 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          CollabAnnotate
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit" 
              onClick={handleNotificationsClick}
              sx={{
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Menu utilisateur */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Menu utilisateur">
              <IconButton
                onClick={handleMenu}
                sx={{
                  p: 0,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Avatar 
                  alt={user?.username || 'User'} 
                  src={user?.avatar}
                  sx={{ 
                    width: 40, 
                    height: 40,
                    border: '2px solid white',
                  }}
                >
                  {user?.username?.[0]?.toUpperCase() || <AccountCircle />}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Menu Notifications */}
        <Menu
          anchorEl={notificationsAnchor}
          open={Boolean(notificationsAnchor)}
          onClose={handleNotificationsClose}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                width: 320,
                maxHeight: 400,
                overflow: 'auto',
              },
            },
          }}
        >
          {notifications.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2">Aucune notification</Typography>
            </MenuItem>
          ) : (
            notifications.map((notification) => (
              <MenuItem 
                key={notification.id}
                onClick={() => {
                  handleNotificationsClose();
                  // Marquer comme lu et rediriger si nécessaire
                }}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2">
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: "text.secondary"
                  }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: "text.secondary"
                  }}>
                    {new Date(notification.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>

        {/* Menu utilisateur */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                minWidth: 180,
              },
            },
          }}
        >
          <MenuItem 
            onClick={() => {
              handleClose();
              navigate('/profile');
            }}
            sx={{
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
              },
            }}
          >
            <ProfileIcon sx={{ mr: 1 }} />
            <Typography>Profil</Typography>
          </MenuItem>
          <MenuItem 
            onClick={() => {
              handleClose();
              navigate('/settings');
            }}
            sx={{
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
              },
            }}
          >
            <SettingsIcon sx={{ mr: 1 }} />
            <Typography>Paramètres</Typography>
          </MenuItem>
          <MenuItem 
            onClick={handleLogout}
            sx={{
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.contrastText',
              },
            }}
          >
            <LogoutIcon sx={{ mr: 1 }} />
            <Typography>Déconnexion</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
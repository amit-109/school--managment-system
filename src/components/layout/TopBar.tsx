import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Notifications,
  Brightness4,
  Brightness7,
  Person,
  Settings,
  Logout,
  Translate,
} from '@mui/icons-material';
import { Select, FormControl } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../Auth/store';
import { logoutUserAsync } from '../Auth/store';
import TokenManager from '../Auth/tokenManager';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userRole: string | null;
  userRoles: string[];
}
import toast from 'react-hot-toast';

const muiTheme = createTheme(); // Default MUI theme, can be customized

interface TopBarProps {
  role: string;
  setRole: (role: string) => void;
  user: { username: string } | null;
  theme: string;
  toggleTheme: () => void;
  language: string;
  toggleLanguage: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

export default function TopBar({
  role,
  setRole,
  user,
  theme,
  toggleTheme,
  language,
  toggleLanguage,
  sidebarOpen,
  setSidebarOpen
}: TopBarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: any) => state.auth);
  const refreshToken = authState.refreshToken;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setRole(event.target.value);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Brightness7 />;
      case 'dark': return <Brightness4 />;
      case 'system': return <Brightness4 />; // Or custom icon
      default: return <Brightness7 />;
    }
  };

  const handleLogoutClick = async () => {
    handleProfileMenuClose();

    try {
      // Get refresh token before clearing
      const refreshToken = TokenManager.getInstance().getRefreshToken() || '';
      
      // Call logout API with refresh token
      await dispatch(logoutUserAsync(refreshToken)).unwrap();
      
      toast.success('Logged out successfully!');
    } catch (error) {
      // Even if API call fails, tokens are cleared in the thunk
      toast.success('Logged out successfully!');
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { md: 'none' } }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/src/assets/logo.svg" 
              alt="School Management System" 
              style={{ 
                height: '42px',
                opacity: '0.95',
                marginLeft: '8px'
              }} 
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <IconButton sx={{ ml: 1 }} color="inherit" onClick={toggleLanguage}>
              <Translate />
            </IconButton>

            <IconButton sx={{ ml: 1 }} color="inherit" onClick={toggleTheme}>
              {getThemeIcon()}
            </IconButton>

            <IconButton sx={{ ml: 1 }} color="inherit">
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Box>

          <Tooltip title="Account settings">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ bgcolor: '#ff6b35', color: 'white', border: '2px solid #ff6b35' }}>
                <Person />
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem>
              <Avatar /> Profile
            </MenuItem>
            <MenuItem>
              <FormControl fullWidth size="small">
                <Select
                  value={role}
                  onChange={handleRoleChange}
                  size="small"
                >
                  <MenuItem value="superadmin">Super Admin</MenuItem>
                  <MenuItem value="admin">Admin (Principal)</MenuItem>
                  <MenuItem value="operator">Operator</MenuItem>
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem>
              <Settings sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogoutClick}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
}

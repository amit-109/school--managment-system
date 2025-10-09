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
  Switch,
  FormControlLabel,
  CssBaseline,
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

const muiTheme = createTheme(); // Default MUI theme, can be customized

export default function TopBar({
  role,
  setRole,
  user,
  onLogout,
  theme,
  toggleTheme,
  language,
  toggleLanguage,
  sidebarOpen,
  setSidebarOpen
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Brightness7 />;
      case 'dark': return <Brightness4 />;
      case 'system': return <Brightness4 />; // Or custom icon
      default: return <Brightness7 />;
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
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
            <Typography variant="h6" noWrap component="div" sx={{ mr: 2 }}>
              EduManage Pro
            </Typography>
            <Typography variant="caption" sx={{ px: 1, py: 0.5, bgcolor: 'secondary.main', color: 'secondary.contrastText', borderRadius: 1 }}>
              v2.0
            </Typography>
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
                  onChange={(e) => setRole(e.target.value)}
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
            <MenuItem onClick={onLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
}

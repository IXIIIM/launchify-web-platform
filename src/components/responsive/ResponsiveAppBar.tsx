import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface ResponsiveAppBarProps {
  title: string;
  logo?: React.ReactNode;
  menuItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }>;
  actions?: React.ReactNode;
  userMenu?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }>;
  userAvatar?: string;
  userName?: string;
  onMenuOpen?: () => void;
  position?: 'fixed' | 'absolute' | 'sticky' | 'static' | 'relative';
  color?: 'default' | 'inherit' | 'primary' | 'secondary' | 'transparent';
}

/**
 * A responsive app bar component that adapts to different screen sizes
 * On mobile, it shows a hamburger menu
 * On desktop, it shows navigation links
 */
const ResponsiveAppBar: React.FC<ResponsiveAppBarProps> = ({
  title,
  logo,
  menuItems = [],
  actions,
  userMenu = [],
  userAvatar,
  userName,
  onMenuOpen,
  position = 'fixed',
  color = 'primary'
}) => {
  const { isMobile, isTablet } = useDeviceDetect();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  return (
    <AppBar position={position} color={color}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo and title - always visible */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            {logo}
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ ml: logo ? 1 : 0 }}
            >
              {title}
            </Typography>
          </Box>
          
          {/* Mobile menu button */}
          {(isMobile || isTablet) && menuItems.length > 0 && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={onMenuOpen}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Desktop navigation */}
          {!isMobile && !isTablet && (
            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              {menuItems.map((item, index) => (
                <Button
                  key={`menu-item-${index}`}
                  color="inherit"
                  onClick={item.onClick}
                  startIcon={item.icon}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
          
          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Action buttons */}
          {actions && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              {actions}
            </Box>
          )}
          
          {/* User menu */}
          {userMenu.length > 0 && (
            <Box sx={{ flexShrink: 0 }}>
              <Tooltip title={userName || "Account settings"}>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={userName} src={userAvatar}>
                    {!userAvatar && userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {userMenu.map((item, index) => (
                  <MenuItem 
                    key={`user-menu-item-${index}`} 
                    onClick={() => {
                      handleCloseUserMenu();
                      item.onClick();
                    }}
                  >
                    {item.icon && (
                      <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        {item.icon}
                      </Box>
                    )}
                    <Typography textAlign="center">{item.label}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default ResponsiveAppBar; 
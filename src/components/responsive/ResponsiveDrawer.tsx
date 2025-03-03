import React from 'react';
import {
  Drawer,
  DrawerProps,
  IconButton,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface ResponsiveDrawerProps extends Omit<DrawerProps, 'open'> {
  open: boolean;
  onClose: () => void;
  drawerWidth?: number | string;
  mobileDrawerWidth?: number | string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}

/**
 * A responsive drawer component that adapts to different screen sizes
 * On mobile, it takes full width and has a close button
 * On desktop, it can be permanent or temporary based on props
 */
const ResponsiveDrawer: React.FC<ResponsiveDrawerProps> = ({
  open,
  onClose,
  drawerWidth = 280,
  mobileDrawerWidth = '100%',
  showCloseButton = true,
  variant = 'temporary',
  anchor = 'left',
  children,
  ...rest
}) => {
  const theme = useTheme();
  const { isMobile } = useDeviceDetect();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  
  // Determine drawer width based on screen size
  const width = isMobile ? mobileDrawerWidth : drawerWidth;
  
  // Determine drawer variant based on screen size and props
  const drawerVariant = isMobile ? 'temporary' : variant;
  
  return (
    <Drawer
      variant={drawerVariant}
      open={open}
      onClose={onClose}
      anchor={anchor}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
        },
      }}
      {...rest}
    >
      {showCloseButton && isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={onClose} edge="end" aria-label="close drawer">
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      {children}
    </Drawer>
  );
};

export default ResponsiveDrawer; 
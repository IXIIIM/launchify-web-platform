import React from 'react';
import { Box, Container, Grid, Paper, useTheme, Drawer, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface ResponsiveLayoutProps {
  /** Main content to display in the center area */
  children: React.ReactNode;
  /** Optional sidebar content */
  sidebar?: React.ReactNode;
  /** Optional header content */
  header?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Title to display in the header */
  title?: string;
  /** Maximum width of the container */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  /** Whether the sidebar should be open by default on mobile */
  defaultSidebarOpen?: boolean;
  /** Width of the sidebar on desktop */
  sidebarWidth?: number | string;
  /** Whether the layout should take full height */
  fullHeight?: boolean;
  /** Whether the content should be contained in a Paper component */
  paperContent?: boolean;
  /** Custom styles for the main content area */
  contentSx?: React.CSSProperties;
  /** Custom styles for the sidebar */
  sidebarSx?: React.CSSProperties;
  /** Custom styles for the header */
  headerSx?: React.CSSProperties;
  /** Custom styles for the footer */
  footerSx?: React.CSSProperties;
}

/**
 * A responsive layout component that adapts to different screen sizes
 * Provides a flexible layout with optional sidebar, header, and footer
 * On mobile, the sidebar becomes a drawer that can be toggled
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  header,
  footer,
  title,
  maxWidth = 'lg',
  defaultSidebarOpen = false,
  sidebarWidth = 240,
  fullHeight = false,
  paperContent = false,
  contentSx,
  sidebarSx,
  headerSx,
  footerSx
}) => {
  const theme = useTheme();
  const { isMobile } = useDeviceDetect();
  const [sidebarOpen, setSidebarOpen] = React.useState(defaultSidebarOpen);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  // Calculate content height
  const getContentHeight = () => {
    if (!fullHeight) return 'auto';
    
    let height = '100vh';
    
    // Subtract header height if present
    if (header || title) {
      height = `calc(${height} - ${theme.spacing(8)})`;
    }
    
    // Subtract footer height if present
    if (footer) {
      height = `calc(${height} - ${theme.spacing(6)})`;
    }
    
    return height;
  };
  
  // Render header
  const renderHeader = () => {
    if (!header && !title) return null;
    
    return (
      <AppBar 
        position="static" 
        color="default" 
        elevation={0}
        sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          ...headerSx 
        }}
      >
        <Toolbar>
          {sidebar && isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleSidebar}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {title && (
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
          )}
          
          {header}
        </Toolbar>
      </AppBar>
    );
  };
  
  // Render sidebar for desktop
  const renderDesktopSidebar = () => {
    if (!sidebar || isMobile) return null;
    
    return (
      <Box
        component="aside"
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          height: getContentHeight(),
          overflow: 'auto',
          ...sidebarSx
        }}
      >
        {sidebar}
      </Box>
    );
  };
  
  // Render sidebar for mobile (drawer)
  const renderMobileSidebar = () => {
    if (!sidebar || !isMobile) return null;
    
    return (
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={closeSidebar}
        sx={{
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={closeSidebar}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ ...sidebarSx }}>
          {sidebar}
        </Box>
      </Drawer>
    );
  };
  
  // Render footer
  const renderFooter = () => {
    if (!footer) return null;
    
    return (
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          ...footerSx
        }}
      >
        {footer}
      </Box>
    );
  };
  
  // Render main content
  const renderContent = () => {
    const content = paperContent ? (
      <Paper 
        elevation={1} 
        sx={{ 
          p: 2, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          ...contentSx 
        }}
      >
        {children}
      </Paper>
    ) : (
      <Box 
        sx={{ 
          p: 2, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          ...contentSx 
        }}
      >
        {children}
      </Box>
    );
    
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: getContentHeight(),
          overflow: 'auto'
        }}
      >
        {content}
      </Box>
    );
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: fullHeight ? '100vh' : 'auto',
        width: '100%'
      }}
    >
      {renderHeader()}
      
      {renderMobileSidebar()}
      
      <Container 
        maxWidth={maxWidth} 
        disableGutters 
        sx={{ 
          display: 'flex', 
          flexGrow: 1,
          px: { xs: 1, sm: 2 }
        }}
      >
        {renderDesktopSidebar()}
        {renderContent()}
      </Container>
      
      {renderFooter()}
    </Box>
  );
};

export default ResponsiveLayout; 
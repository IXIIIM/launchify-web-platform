import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface ResponsiveContainerProps extends BoxProps {
  mobileStyles?: React.CSSProperties;
  tabletStyles?: React.CSSProperties;
  desktopStyles?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * A container component that applies different styles based on the current screen size
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  mobileStyles = {},
  tabletStyles = {},
  desktopStyles = {},
  children,
  sx = {},
  ...rest
}) => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetect();
  
  // Determine which styles to apply based on screen size
  const responsiveStyles = React.useMemo(() => {
    if (isMobile) return mobileStyles;
    if (isTablet) return tabletStyles;
    return desktopStyles;
  }, [isMobile, isTablet, desktopStyles, mobileStyles, tabletStyles]);
  
  return (
    <Box
      sx={{
        ...responsiveStyles,
        ...sx
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

export default ResponsiveContainer; 
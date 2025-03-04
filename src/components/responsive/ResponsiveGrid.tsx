import React from 'react';
import { Grid, GridProps } from '@mui/material';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface ResponsiveGridProps extends Omit<GridProps, 'container'> {
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  spacing?: number;
  children: React.ReactNode;
}

/**
 * A responsive grid component that adjusts the number of columns based on screen size
 */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 4,
  spacing = 2,
  children,
  ...rest
}) => {
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Determine number of columns based on screen size
  const columns = React.useMemo(() => {
    if (isMobile) return mobileColumns;
    if (isTablet) return tabletColumns;
    return desktopColumns;
  }, [isMobile, isTablet, mobileColumns, tabletColumns, desktopColumns]);
  
  // Calculate grid item width based on number of columns
  const itemWidth = 12 / columns;
  
  // Clone children and add grid item props
  const gridItems = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    
    return (
      <Grid item xs={12} sm={columns <= 1 ? 12 : 6} md={itemWidth} {...child.props.gridItemProps}>
        {child}
      </Grid>
    );
  });
  
  return (
    <Grid container spacing={spacing} {...rest}>
      {gridItems}
    </Grid>
  );
};

export default ResponsiveGrid; 
import React, { useState } from 'react';
import { Box, Skeleton, Typography, useTheme } from '@mui/material';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  mobileWidth?: number | string;
  mobileHeight?: number | string;
  tabletWidth?: number | string;
  tabletHeight?: number | string;
  desktopWidth?: number | string;
  desktopHeight?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  borderRadius?: number | string;
  aspectRatio?: number | string;
  fallbackSrc?: string;
  showPlaceholder?: boolean;
  placeholderColor?: string;
  caption?: string;
  onClick?: () => void;
  sx?: React.CSSProperties;
}

/**
 * A responsive image component that adapts to different screen sizes
 * Provides loading state, error handling, and responsive sizing
 */
const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  width,
  height,
  mobileWidth,
  mobileHeight,
  tabletWidth,
  tabletHeight,
  desktopWidth,
  desktopHeight,
  objectFit = 'cover',
  borderRadius = 0,
  aspectRatio,
  fallbackSrc,
  showPlaceholder = true,
  placeholderColor,
  caption,
  onClick,
  sx = {}
}) => {
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useDeviceDetect();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Determine responsive dimensions
  const responsiveWidth = React.useMemo(() => {
    if (isMobile && mobileWidth) return mobileWidth;
    if (isTablet && tabletWidth) return tabletWidth;
    if (isDesktop && desktopWidth) return desktopWidth;
    return width || '100%';
  }, [isMobile, isTablet, isDesktop, mobileWidth, tabletWidth, desktopWidth, width]);
  
  const responsiveHeight = React.useMemo(() => {
    if (isMobile && mobileHeight) return mobileHeight;
    if (isTablet && tabletHeight) return tabletHeight;
    if (isDesktop && desktopHeight) return desktopHeight;
    return height || 'auto';
  }, [isMobile, isTablet, isDesktop, mobileHeight, tabletHeight, desktopHeight, height]);
  
  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };
  
  // Determine image source
  const imageSrc = hasError && fallbackSrc ? fallbackSrc : src;
  
  return (
    <Box
      sx={{
        position: 'relative',
        width: responsiveWidth,
        height: responsiveHeight,
        aspectRatio: aspectRatio,
        borderRadius,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...sx
      }}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {isLoading && showPlaceholder && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: placeholderColor || theme.palette.action.hover
          }}
        />
      )}
      
      {/* Image */}
      <Box
        component="img"
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        sx={{
          width: '100%',
          height: '100%',
          objectFit,
          display: isLoading ? 'none' : 'block'
        }}
      />
      
      {/* Caption */}
      {caption && (
        <Typography
          variant="caption"
          component="figcaption"
          sx={{
            mt: 1,
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          {caption}
        </Typography>
      )}
    </Box>
  );
};

export default ResponsiveImage; 
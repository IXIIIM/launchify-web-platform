import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * OptimizedImage component with lazy loading, WebP support, and responsive sizing
 * 
 * Features:
 * - Lazy loading for images outside viewport
 * - WebP format support with fallback
 * - Responsive image sizing with srcset
 * - Blur-up loading effect
 * - Intersection Observer for performance
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  sizes = '100vw',
  priority = false,
  onLoad,
  onError,
  placeholder = 'empty',
  blurDataURL,
  objectFit = 'cover',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Generate WebP version of the image if not already WebP
  const isWebP = src.endsWith('.webp');
  const webpSrc = isWebP ? src : src.replace(/\.(jpe?g|png)$/i, '.webp');
  
  // Generate srcset for responsive images
  const generateSrcSet = (imageSrc: string) => {
    if (!width) return undefined;
    
    const widths = [0.5, 1, 1.5, 2].map(scale => Math.round(width * scale));
    return widths
      .map(w => {
        const scaledSrc = imageSrc.replace(/\.(jpe?g|png|webp)$/i, `_${w}.$1`);
        return `${scaledSrc} ${w}w`;
      })
      .join(', ');
  };
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) {
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Load images 200px before they enter viewport
        threshold: 0.01,
      }
    );
    
    observer.observe(imgRef.current);
    
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);
  
  // Handle image load event
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  // Handle image error event
  const handleError = () => {
    if (onError) onError();
  };
  
  // Determine image styles based on loading state and placeholder
  const imageStyles: React.CSSProperties = {
    objectFit,
    opacity: isLoaded || priority ? 1 : 0,
    transition: 'opacity 0.5s ease-in-out',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
  };
  
  // Determine placeholder styles
  const placeholderStyles: React.CSSProperties = placeholder === 'blur' && blurDataURL ? {
    backgroundImage: `url(${blurDataURL})`,
    backgroundSize: objectFit,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    filter: 'blur(20px)',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  } : {};
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : 'auto' }}
    >
      {placeholder === 'blur' && blurDataURL && (
        <div style={placeholderStyles} aria-hidden="true" />
      )}
      
      {(isInView || priority) && (
        <picture>
          {/* WebP format */}
          <source 
            type="image/webp" 
            srcSet={generateSrcSet(webpSrc)} 
            sizes={sizes} 
          />
          
          {/* Original format as fallback */}
          <source 
            srcSet={generateSrcSet(src)} 
            sizes={sizes} 
          />
          
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            style={imageStyles}
            decoding="async"
          />
        </picture>
      )}
      
      {!isInView && !priority && (
        <div 
          ref={imgRef} 
          style={{ 
            width: width ? `${width}px` : '100%', 
            height: height ? `${height}px` : '200px',
            backgroundColor: '#f0f0f0'
          }} 
        />
      )}
    </div>
  );
};

export default OptimizedImage; 
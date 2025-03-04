/**
 * Utility functions for image optimization and WebP conversion
 */

/**
 * Generate optimized image URL with specified width
 * @param src Original image URL
 * @param width Desired width in pixels
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (src: string, width: number): string => {
  if (!src) return '';
  
  // Check if the URL is already an optimized version
  if (src.includes('_w')) {
    // Replace existing width parameter
    return src.replace(/_w\d+/, `_w${width}`);
  }
  
  // Add width parameter to the URL
  const urlParts = src.split('.');
  const extension = urlParts.pop();
  return `${urlParts.join('.')}_w${width}.${extension}`;
};

/**
 * Generate WebP version URL of an image
 * @param src Original image URL
 * @returns WebP version URL
 */
export const getWebPUrl = (src: string): string => {
  if (!src) return '';
  
  // If already WebP, return as is
  if (src.endsWith('.webp')) return src;
  
  // Convert to WebP
  const urlParts = src.split('.');
  urlParts.pop(); // Remove extension
  return `${urlParts.join('.')}.webp`;
};

/**
 * Generate responsive image srcset
 * @param src Original image URL
 * @param widths Array of widths to include in srcset
 * @returns srcset string for responsive images
 */
export const generateSrcSet = (src: string, widths: number[] = [320, 640, 960, 1280, 1920]): string => {
  if (!src) return '';
  
  return widths
    .map(width => `${getOptimizedImageUrl(src, width)} ${width}w`)
    .join(', ');
};

/**
 * Generate responsive image sizes attribute
 * @param sizes Array of media query and size pairs
 * @returns sizes attribute string
 */
export const generateSizes = (
  sizes: Array<{ media: string; size: string }> = [
    { media: '(max-width: 640px)', size: '100vw' },
    { media: '(max-width: 1024px)', size: '50vw' },
    { media: '(min-width: 1025px)', size: '33vw' }
  ]
): string => {
  return sizes
    .map(({ media, size }) => `${media ? `${media} ` : ''}${size}`)
    .join(', ');
};

/**
 * Generate a low-quality image placeholder
 * @param src Original image URL
 * @param width Width of the placeholder
 * @returns Low-quality placeholder URL
 */
export const getLowQualityPlaceholder = (src: string, width: number = 20): string => {
  if (!src) return '';
  
  // Generate a very small version of the image
  const urlParts = src.split('.');
  const extension = urlParts.pop();
  return `${urlParts.join('.')}_w${width}_q20.${extension}`;
};

/**
 * Check if the browser supports WebP format
 * @returns Promise that resolves to true if WebP is supported
 */
export const supportsWebP = async (): Promise<boolean> => {
  if (!window || !window.createImageBitmap) return false;
  
  const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  const blob = await fetch(webpData).then(r => r.blob());
  
  return createImageBitmap(blob).then(() => true, () => false);
};

/**
 * Get the best image format based on browser support
 * @param formats Array of available formats in order of preference
 * @returns Promise that resolves to the best supported format
 */
export const getBestImageFormat = async (
  formats: string[] = ['webp', 'avif', 'jpg', 'png']
): Promise<string> => {
  const supportsAvif = false; // AVIF detection would go here
  const webpSupported = await supportsWebP();
  
  if (formats.includes('avif') && supportsAvif) return 'avif';
  if (formats.includes('webp') && webpSupported) return 'webp';
  if (formats.includes('jpg')) return 'jpg';
  return 'png';
};

/**
 * Calculate the aspect ratio of an image
 * @param width Image width
 * @param height Image height
 * @returns Aspect ratio as a string (e.g., "16/9")
 */
export const calculateAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
};

/**
 * Preload critical images
 * @param urls Array of image URLs to preload
 */
export const preloadCriticalImages = (urls: string[]): void => {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}; 
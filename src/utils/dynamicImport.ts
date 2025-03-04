/**
 * Utility for dynamic imports with retry functionality
 * 
 * This utility helps with code splitting by providing a way to dynamically import
 * modules with retry functionality in case of network errors.
 */

/**
 * Options for dynamic imports
 */
export interface DynamicImportOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Base delay between retries in milliseconds (will be increased exponentially)
   * @default 1000
   */
  retryDelay?: number;
  
  /**
   * Whether to log retry attempts
   * @default true
   */
  logRetries?: boolean;
}

/**
 * Dynamically imports a module with retry functionality
 * 
 * @param importFn - The import function to call
 * @param options - Options for the dynamic import
 * @returns A promise that resolves to the imported module
 */
export function dynamicImport<T>(
  importFn: () => Promise<T>,
  options: DynamicImportOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    logRetries = true,
  } = options;
  
  return new Promise<T>((resolve, reject) => {
    let retryCount = 0;
    
    const tryImport = () => {
      importFn()
        .then(resolve)
        .catch((error) => {
          // Only retry on network errors, not on module errors
          if (
            error instanceof TypeError ||
            error.message?.includes('network') ||
            error.message?.includes('failed to fetch') ||
            error.message?.includes('chunk')
          ) {
            if (retryCount < maxRetries) {
              retryCount++;
              const delay = retryDelay * Math.pow(2, retryCount - 1);
              
              if (logRetries) {
                console.warn(
                  `Failed to load module, retrying (${retryCount}/${maxRetries}) in ${delay}ms...`,
                  error
                );
              }
              
              setTimeout(tryImport, delay);
            } else {
              console.error('Failed to load module after multiple retries:', error);
              reject(error);
            }
          } else {
            // Not a network error, reject immediately
            console.error('Error loading module:', error);
            reject(error);
          }
        });
    };
    
    tryImport();
  });
}

/**
 * Creates a dynamic import function with retry functionality
 * 
 * @param importFn - The import function to call
 * @param options - Options for the dynamic import
 * @returns A function that returns a promise that resolves to the imported module
 */
export function createDynamicImport<T>(
  importFn: () => Promise<T>,
  options: DynamicImportOptions = {}
): () => Promise<T> {
  return () => dynamicImport(importFn, options);
}

/**
 * Preloads a module without rendering it
 * 
 * @param importFn - The import function to call
 * @param options - Options for the dynamic import
 * @returns A promise that resolves when the module is loaded
 */
export function preloadModule<T>(
  importFn: () => Promise<T>,
  options: DynamicImportOptions = {}
): Promise<T> {
  return dynamicImport(importFn, options);
}

/**
 * Preloads multiple modules without rendering them
 * 
 * @param importFns - The import functions to call
 * @param options - Options for the dynamic imports
 * @returns A promise that resolves when all modules are loaded
 */
export function preloadModules<T>(
  importFns: Array<() => Promise<T>>,
  options: DynamicImportOptions = {}
): Promise<T[]> {
  return Promise.all(importFns.map(importFn => preloadModule(importFn, options)));
} 
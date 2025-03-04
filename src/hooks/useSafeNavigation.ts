import { useNavigate } from 'react-router-dom';

/**
 * A hook that provides safe navigation functionality, falling back to window.location
 * when used outside of a Router context.
 * 
 * @returns A function that navigates to the specified path
 */
export const useSafeNavigation = () => {
  try {
    // This will throw an error if not in a Router context
    const navigate = useNavigate();
    
    // Return a wrapper around the navigate function
    return (path: string) => {
      navigate(path);
    };
  } catch (error) {
    // Fallback to window.location when not in a Router context
    return (path: string) => {
      window.location.href = path;
    };
  }
};

export default useSafeNavigation; 
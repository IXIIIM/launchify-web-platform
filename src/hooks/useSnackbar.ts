import { useState, useCallback } from 'react';

export type SnackbarSeverity = 'success' | 'info' | 'warning' | 'error';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
  autoHideDuration?: number;
}

export interface UseSnackbarReturn {
  snackbarState: SnackbarState;
  showSnackbar: (message: string, severity?: SnackbarSeverity, autoHideDuration?: number) => void;
  hideSnackbar: () => void;
}

export const useSnackbar = (): UseSnackbarReturn => {
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 6000, // Default duration: 6 seconds
  });

  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity = 'info', autoHideDuration?: number) => {
      setSnackbarState({
        open: true,
        message,
        severity,
        autoHideDuration: autoHideDuration || 6000,
      });
    },
    []
  );

  const hideSnackbar = useCallback(() => {
    setSnackbarState((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  return {
    snackbarState,
    showSnackbar,
    hideSnackbar,
  };
}; 
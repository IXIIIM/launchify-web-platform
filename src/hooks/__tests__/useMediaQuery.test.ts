<<<<<<< HEAD
// src/hooks/__tests__/useMediaQuery.test.ts
=======
>>>>>>> feature/security-implementation
import { renderHook } from '@testing-library/react-hooks';
import { useMediaQuery, breakpoints } from '../useMediaQuery';
import { act } from 'react-dom/test-utils';

describe('useMediaQuery', () => {
  const createMatchMedia = (matches: boolean) => {
    return (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });
  };

  beforeAll(() => {
    // Store original matchMedia
    Object.defineProperty(window, 'originalMatchMedia', {
      value: window.matchMedia,
      writable: true,
    });
  });

  afterAll(() => {
    // Restore original matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: window.originalMatchMedia,
      writable: true,
    });
  });

  it('should return initial matching state', () => {
    window.matchMedia = createMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('should handle media query changes', () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mockMatchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (type: string, listener: any) => {
        if (type === 'change') listeners.add(listener);
      },
      removeEventListener: (type: string, listener: any) => {
        if (type === 'change') listeners.delete(listener);
      },
      addListener: (listener: any) => listeners.add(listener),
      removeListener: (listener: any) => listeners.delete(listener),
      dispatchEvent: jest.fn(),
    });

    window.matchMedia = mockMatchMedia as any;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      listeners.forEach(listener =>
        listener({
          matches: true,
          media: '(min-width: 768px)',
        } as MediaQueryListEvent)
      );
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listeners on unmount', () => {
    const mockMatchMedia = createMatchMedia(true);
    window.matchMedia = mockMatchMedia;

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    unmount();

    expect(mockMatchMedia('').removeEventListener).toHaveBeenCalled();
  });

  it('should handle SSR gracefully', () => {
    // Simulate SSR environment by removing window.matchMedia
    const originalMatchMedia = window.matchMedia;
    delete (window as any).matchMedia;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    // Restore window.matchMedia
    window.matchMedia = originalMatchMedia;
  });

  it('should update when the query changes', () => {
    const mockMatchMedia = jest.fn().mockImplementation(createMatchMedia(false));
    window.matchMedia = mockMatchMedia;

    const { rerender } = renderHook(
      (query: string) => useMediaQuery(query),
      { initialProps: '(min-width: 768px)' }
    );

    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)');

    // Change the query
    rerender('(min-width: 1024px)');
    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  describe('breakpoints', () => {
    it('should have all expected breakpoints', () => {
      expect(breakpoints).toHaveProperty('xs');
      expect(breakpoints).toHaveProperty('sm');
      expect(breakpoints).toHaveProperty('md');
      expect(breakpoints).toHaveProperty('lg');
      expect(breakpoints).toHaveProperty('xl');
      expect(breakpoints).toHaveProperty('2xl');
      expect(breakpoints).toHaveProperty('portrait');
      expect(breakpoints).toHaveProperty('landscape');
      expect(breakpoints).toHaveProperty('dark');
      expect(breakpoints).toHaveProperty('light');
      expect(breakpoints).toHaveProperty('motion');
      expect(breakpoints).toHaveProperty('hover');
      expect(breakpoints).toHaveProperty('touch');
    });

    it('should handle modern browser API', () => {
      const mockModernMatchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      window.matchMedia = mockModernMatchMedia as any;
      const { result } = renderHook(() => useMediaQuery(breakpoints.md));
      expect(result.current).toBe(false);
    });

    it('should handle legacy browser API', () => {
      const mockLegacyMatchMedia = (query: string) => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      window.matchMedia = mockLegacyMatchMedia as any;
      const { result } = renderHook(() => useMediaQuery(breakpoints.md));
      expect(result.current).toBe(false);
    });
  });
});
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { AnalyticsErrorBoundary } from '../AnalyticsErrorBoundary';

describe('AnalyticsErrorBoundary', () => {
  const originalError = console.error;
  const mockOnError = jest.fn();

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    mockOnError.mockClear();
    (console.error as jest.Mock).mockClear();
  });

  it('should render children when no error occurs', () => {
    const { getByText } = render(
      <AnalyticsErrorBoundary>
        <div>Test Content</div>
      </AnalyticsErrorBoundary>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should render error UI when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error');
      return null;
    };

    const { getByText } = render(
      <AnalyticsErrorBoundary onError={mockOnError}>
        <ThrowError />
      </AnalyticsErrorBoundary>
    );

    expect(getByText('Analytics Error')).toBeInTheDocument();
    expect(getByText('Test error')).toBeInTheDocument();
    expect(mockOnError).toHaveBeenCalled();
  });

  it('should have retry functionality', () => {
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    const ThrowError = () => {
      throw new Error('Test error');
      return null;
    };

    const { getByText } = render(
      <AnalyticsErrorBoundary>
        <ThrowError />
      </AnalyticsErrorBoundary>
    );

    fireEvent.click(getByText('Retry'));
    expect(mockReload).toHaveBeenCalled();
  });
});
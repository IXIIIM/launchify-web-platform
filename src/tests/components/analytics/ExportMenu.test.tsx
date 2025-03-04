import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExportMenu, ExportButton } from '@/components/analytics/ExportMenu';
import * as exportUtils from '@/utils/exportUtils';

// Mock the export utilities
jest.mock('@/utils/exportUtils', () => ({
  exportToCSV: jest.fn(),
  exportToJSON: jest.fn(),
  exportToExcel: jest.fn(),
  exportData: jest.fn()
}));

describe('ExportMenu Component', () => {
  // Define the type for our test data
  type TestData = {
    id: number;
    name: string;
    value: number;
  };

  const mockData: TestData[] = [
    { id: 1, name: 'Test 1', value: 100 },
    { id: 2, name: 'Test 2', value: 200 }
  ];
  
  const mockHeaders: { key: keyof TestData; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'value', label: 'Value' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders export menu button with correct text', () => {
    render(
      <ExportMenu<TestData>
        data={mockData} 
        filename="test-export" 
        headers={mockHeaders}
      />
    );
    
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  test('renders export menu button with custom text', () => {
    render(
      <ExportMenu<TestData>
        data={mockData} 
        filename="test-export" 
        headers={mockHeaders}
        buttonText="Download Data"
      />
    );
    
    expect(screen.getByText('Download Data')).toBeInTheDocument();
  });

  test('renders disabled export menu when specified', () => {
    render(
      <ExportMenu<TestData>
        data={mockData} 
        filename="test-export" 
        headers={mockHeaders}
        disabled={true}
      />
    );
    
    const button = screen.getByText('Export');
    expect(button.closest('button')).toHaveAttribute('disabled');
  });

  test('calls exportData with CSV format when CSV option is clicked', async () => {
    render(
      <ExportMenu<TestData>
        data={mockData} 
        filename="test-export" 
        headers={mockHeaders}
      />
    );
    
    // Open the dropdown
    fireEvent.click(screen.getByText('Export'));
    
    // Click the CSV option
    fireEvent.click(screen.getByText('CSV'));
    
    expect(exportUtils.exportData).toHaveBeenCalledWith(
      mockData,
      'test-export',
      'csv',
      mockHeaders
    );
  });

  test('calls exportData with JSON format when JSON option is clicked', async () => {
    render(
      <ExportMenu<TestData>
        data={mockData} 
        filename="test-export" 
        headers={mockHeaders}
      />
    );
    
    // Open the dropdown
    fireEvent.click(screen.getByText('Export'));
    
    // Click the JSON option
    fireEvent.click(screen.getByText('JSON'));
    
    expect(exportUtils.exportData).toHaveBeenCalledWith(
      mockData,
      'test-export',
      'json',
      mockHeaders
    );
  });

  test('calls exportData with Excel format when Excel option is clicked', async () => {
    render(
      <ExportMenu<TestData>
        data={mockData} 
        filename="test-export" 
        headers={mockHeaders}
      />
    );
    
    // Open the dropdown
    fireEvent.click(screen.getByText('Export'));
    
    // Click the Excel option
    fireEvent.click(screen.getByText('Excel'));
    
    expect(exportUtils.exportData).toHaveBeenCalledWith(
      mockData,
      'test-export',
      'excel',
      mockHeaders
    );
  });
});

describe('ExportButton Component', () => {
  // Define the type for our test data
  type TestData = {
    id: number;
    name: string;
    value: number;
  };

  const mockData: TestData[] = [
    { id: 1, name: 'Test 1', value: 100 },
    { id: 2, name: 'Test 2', value: 200 }
  ];
  
  const mockHeaders: { key: keyof TestData; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'value', label: 'Value' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders export button with correct format label', () => {
    render(
      <ExportButton<TestData>
        data={mockData} 
        filename="test-export" 
        headers={mockHeaders}
        format="csv"
        buttonText="Export as CSV"
      />
    );
    
    expect(screen.getByText('Export as CSV')).toBeInTheDocument();
  });

  test('calls exportData with correct format when clicked', () => {
    render(
      <ExportButton<TestData>
        data={mockData} 
        filename="test-export" 
        headers={mockHeaders}
        format="excel"
        buttonText="Export as Excel"
      />
    );
    
    fireEvent.click(screen.getByText('Export as Excel'));
    
    expect(exportUtils.exportData).toHaveBeenCalledWith(
      mockData,
      'test-export',
      'excel',
      mockHeaders
    );
  });

  test('renders disabled button when specified', () => {
    render(
      <ExportButton<TestData>
        data={mockData} 
        filename="test-export" 
        headers={mockHeaders}
        format="json"
        buttonText="Export as JSON"
        disabled={true}
      />
    );
    
    const button = screen.getByText('Export as JSON');
    expect(button).toHaveAttribute('disabled');
  });
}); 
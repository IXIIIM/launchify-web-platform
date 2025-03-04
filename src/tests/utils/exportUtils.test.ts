import { 
  convertToCSV, 
  exportToCSV, 
  exportToJSON, 
  exportToExcel, 
  exportData,
  prepareTimeSeriesForExport,
  prepareDistributionForExport
} from '@/utils/exportUtils';

// Mock the global URL.createObjectURL and document.createElement
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock the xlsx library
jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn(),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn()
  },
  writeFile: jest.fn()
}));

// Mock document methods
document.createElement = jest.fn().mockImplementation((tag) => {
  if (tag === 'a') {
    return {
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn(),
      style: {},
      download: '',
      href: ''
    };
  }
  return {};
});

describe('exportUtils', () => {
  // Define the type for our test data
  type TestData = {
    id: number;
    name: string;
    value: number;
  };

  const testData: TestData[] = [
    { id: 1, name: 'Test 1', value: 100 },
    { id: 2, name: 'Test 2', value: 200 }
  ];
  
  const testHeaders: { key: keyof TestData; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'value', label: 'Value' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('convertToCSV', () => {
    test('converts data to CSV format with headers', () => {
      const result = convertToCSV(testData, testHeaders);
      
      // Should have header row + 2 data rows
      const lines = result.trim().split('\n');
      expect(lines.length).toBe(3);
      
      // Check header row
      expect(lines[0]).toBe('ID,Name,Value');
      
      // Check data rows
      expect(lines[1]).toBe('1,"Test 1",100');
      expect(lines[2]).toBe('2,"Test 2",200');
    });

    test('converts data to CSV format without headers', () => {
      const result = convertToCSV(testData);
      
      // Should have 2 data rows with default headers
      const lines = result.trim().split('\n');
      expect(lines.length).toBe(3);
      
      // Check header row (should use object keys)
      expect(lines[0]).toBe('id,name,value');
    });

    test('handles empty data array', () => {
      const result = convertToCSV([]);
      expect(result).toBe('');
    });

    test('handles special characters in CSV', () => {
      const specialData = [
        { id: 1, name: 'Test, with comma', value: 100 },
        { id: 2, name: 'Test "with quotes"', value: 200 }
      ];
      
      const result = convertToCSV(specialData, testHeaders);
      const lines = result.trim().split('\n');
      
      // Check that special characters are properly escaped
      expect(lines[1]).toBe('1,"Test, with comma",100');
      expect(lines[2]).toBe('2,"Test ""with quotes""",200');
    });
  });

  describe('exportToCSV', () => {
    test('creates a CSV file and triggers download', () => {
      exportToCSV(testData, 'test-export', testHeaders);
      
      // Check if Blob was created with correct content type
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/csv;charset=utf-8;'
        })
      );
      
      // Check if download was triggered
      const mockAnchor = document.createElement('a');
      expect(mockAnchor.download).toBe('test-export.csv');
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('exportToJSON', () => {
    test('creates a JSON file and triggers download', () => {
      exportToJSON(testData, 'test-export');
      
      // Check if Blob was created with correct content type
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application/json;charset=utf-8;'
        })
      );
      
      // Check if download was triggered
      const mockAnchor = document.createElement('a');
      expect(mockAnchor.download).toBe('test-export.json');
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('exportToExcel', () => {
    test('creates an Excel file and triggers download', () => {
      exportToExcel(testData, 'test-export', testHeaders);
      
      // Check if Excel file was created
      expect(require('xlsx').utils.aoa_to_sheet).toHaveBeenCalled();
      expect(require('xlsx').utils.book_new).toHaveBeenCalled();
      expect(require('xlsx').utils.book_append_sheet).toHaveBeenCalled();
      expect(require('xlsx').writeFile).toHaveBeenCalledWith(
        expect.any(Object),
        'test-export.xlsx'
      );
    });
  });

  describe('exportData', () => {
    test('calls exportToCSV when format is csv', () => {
      // Mock the exportToCSV function
      const originalExportToCSV = exportToCSV;
      const mockExportToCSV = jest.fn();
      
      // Replace the original function with our mock
      (global as any).exportToCSV = mockExportToCSV;
      
      exportData(testData, 'csv', 'test-export', testHeaders);
      
      expect(mockExportToCSV).toHaveBeenCalledWith(testData, 'test-export', testHeaders);
      
      // Restore the original function
      (global as any).exportToCSV = originalExportToCSV;
    });

    test('calls exportToJSON when format is json', () => {
      // Mock the exportToJSON function
      const originalExportToJSON = exportToJSON;
      const mockExportToJSON = jest.fn();
      
      // Replace the original function with our mock
      (global as any).exportToJSON = mockExportToJSON;
      
      exportData(testData, 'json', 'test-export', testHeaders);
      
      expect(mockExportToJSON).toHaveBeenCalledWith(testData, 'test-export');
      
      // Restore the original function
      (global as any).exportToJSON = originalExportToJSON;
    });

    test('calls exportToExcel when format is excel', () => {
      // Mock the exportToExcel function
      const originalExportToExcel = exportToExcel;
      const mockExportToExcel = jest.fn();
      
      // Replace the original function with our mock
      (global as any).exportToExcel = mockExportToExcel;
      
      exportData(testData, 'excel', 'test-export', testHeaders);
      
      expect(mockExportToExcel).toHaveBeenCalledWith(testData, 'test-export', testHeaders);
      
      // Restore the original function
      (global as any).exportToExcel = originalExportToExcel;
    });
  });

  describe('prepareTimeSeriesForExport', () => {
    test('formats time series data for export', () => {
      const timeSeriesData = [
        { date: '2023-01-01', value: 100, count: 5 },
        { date: '2023-01-02', value: 200, count: 10 }
      ];
      
      const result = prepareTimeSeriesForExport(timeSeriesData, 'date', ['value', 'count']);
      
      expect(result).toEqual([
        { date: '2023-01-01', value: 100, count: 5 },
        { date: '2023-01-02', value: 200, count: 10 }
      ]);
    });
  });

  describe('prepareDistributionForExport', () => {
    test('formats distribution data for export', () => {
      const distributionData = [
        { category: 'A', count: 10, percentage: 0.25 },
        { category: 'B', count: 30, percentage: 0.75 }
      ];
      
      const result = prepareDistributionForExport(distributionData, 'category', ['count', 'percentage']);
      
      expect(result).toEqual([
        { category: 'A', count: 10, percentage: 0.25 },
        { category: 'B', count: 30, percentage: 0.75 }
      ]);
    });
  });
}); 
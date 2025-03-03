/**
 * Utility functions for exporting data to various formats
 */
import * as XLSX from 'xlsx';

/**
 * Converts data to CSV format
 * @param data Array of objects to convert to CSV
 * @param headers Optional custom headers (if not provided, will use object keys)
 * @returns CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: { key: keyof T; label: string }[]
): string {
  if (!data || !data.length) return '';

  // If headers not provided, use object keys
  const headerKeys = headers ? headers.map(h => h.key) : Object.keys(data[0]) as (keyof T)[];
  const headerLabels = headers ? headers.map(h => h.label) : headerKeys as string[];

  // Create CSV header row
  const headerRow = headerLabels.join(',');

  // Create data rows
  const rows = data.map(item => {
    return headerKeys.map(key => {
      const value = item[key];
      
      // Handle different data types
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return value;
    }).join(',');
  });

  // Combine header and rows
  return [headerRow, ...rows].join('\n');
}

/**
 * Exports data as a CSV file
 * @param data Array of objects to export
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename, 'csv');
}

/**
 * Exports data as a JSON file
 * @param data Data to export as JSON
 * @param filename Filename for the downloaded file
 */
export function exportToJSON(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename, 'json');
}

/**
 * Exports data as an Excel file
 * @param data Array of objects to export
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers
 * @param sheetName Optional name for the Excel sheet
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[],
  sheetName: string = 'Data'
): void {
  if (!data || !data.length) return;

  // Prepare data for Excel
  const headerKeys = headers ? headers.map(h => h.key) : Object.keys(data[0]) as (keyof T)[];
  const headerLabels = headers ? headers.map(h => h.label) : headerKeys as string[];

  // Create worksheet data with headers as first row
  const wsData = [
    headerLabels,
    ...data.map(item => 
      headerKeys.map(key => {
        const value = item[key];
        // Handle null/undefined values
        if (value === null || value === undefined) return '';
        // Return the value as is (xlsx will handle formatting)
        return value;
      })
    )
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Helper function to download a Blob as a file
 * @param blob Blob to download
 * @param filename Filename for the downloaded file
 * @param extension File extension
 */
function downloadBlob(blob: Blob, filename: string, extension: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats data for export based on the specified format
 * @param data Data to format
 * @param format Export format
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers for CSV export
 */
export function exportData<T extends Record<string, any>>(
  data: T[],
  format: 'csv' | 'json' | 'excel',
  filename: string,
  headers?: { key: keyof T; label: string }[]
): void {
  switch (format) {
    case 'csv':
      exportToCSV(data, filename, headers);
      break;
    case 'json':
      exportToJSON(data, filename);
      break;
    case 'excel':
      exportToExcel(data, filename, headers);
      break;
    default:
      console.error(`Unsupported export format: ${format}`);
  }
}

/**
 * Prepares time series data for export
 * @param data Time series data
 * @param dateKey Key containing the date value
 * @param valueKeys Keys containing values to export
 * @returns Formatted data for export
 */
export function prepareTimeSeriesForExport<T extends Record<string, any>>(
  data: T[],
  dateKey: keyof T,
  valueKeys: (keyof T)[]
): Record<string, any>[] {
  return data.map(item => {
    const result: Record<string, any> = {
      [dateKey.toString()]: item[dateKey]
    };
    
    valueKeys.forEach(key => {
      result[key.toString()] = item[key];
    });
    
    return result;
  });
}

/**
 * Prepares distribution data for export
 * @param data Distribution data
 * @param labelKey Key containing the label
 * @param valueKeys Keys containing values to export
 * @returns Formatted data for export
 */
export function prepareDistributionForExport<T extends Record<string, any>>(
  data: T[],
  labelKey: keyof T,
  valueKeys: (keyof T)[]
): Record<string, any>[] {
  return data.map(item => {
    const result: Record<string, any> = {
      [labelKey.toString()]: item[labelKey]
    };
    
    valueKeys.forEach(key => {
      result[key.toString()] = item[key];
    });
    
    return result;
  });
} 
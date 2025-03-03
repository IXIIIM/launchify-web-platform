import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileDown, FileJson, FileSpreadsheet } from 'lucide-react';
import { exportData } from '@/utils/exportUtils';

interface ExportMenuProps<T extends Record<string, any>> {
  /**
   * Data to export
   */
  data: T[];
  
  /**
   * Base filename for the exported file (without extension)
   */
  filename: string;
  
  /**
   * Optional custom headers for CSV export
   */
  headers?: { key: keyof T; label: string }[];
  
  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'ghost';
  
  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg';
  
  /**
   * Additional CSS classes for the button
   */
  className?: string;
  
  /**
   * Whether to disable the export button
   */
  disabled?: boolean;
  
  /**
   * Text to display on the button
   */
  buttonText?: string;
}

/**
 * A dropdown menu for exporting data in various formats
 */
export function ExportMenu<T extends Record<string, any>>({
  data,
  filename,
  headers,
  variant = 'outline',
  size = 'sm',
  className,
  disabled = false,
  buttonText = 'Export'
}: ExportMenuProps<T>) {
  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    exportData(data, format, filename, headers);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={disabled}>
          <Download className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileDown className="mr-2 h-4 w-4" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Export as Excel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>Export as JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A simple button for exporting data in a specific format
 */
export function ExportButton<T extends Record<string, any>>({
  data,
  filename,
  headers,
  format = 'csv',
  variant = 'outline',
  size = 'sm',
  className,
  disabled = false,
  buttonText = 'Export as CSV'
}: ExportMenuProps<T> & { format?: 'csv' | 'json' | 'excel' }) {
  const handleExport = () => {
    exportData(data, format, filename, headers);
  };
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className} 
      disabled={disabled}
      onClick={handleExport}
    >
      <Download className="mr-2 h-4 w-4" />
      {buttonText}
    </Button>
  );
} 
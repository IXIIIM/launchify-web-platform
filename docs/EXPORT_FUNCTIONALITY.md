# Analytics Export Functionality

This document provides an overview of the export functionality implemented for the Launchify Web Platform's analytics features.

## Overview

The export functionality allows users to export analytics data in multiple formats:
- CSV (Comma-Separated Values)
- Excel (XLSX)
- JSON (JavaScript Object Notation)

This feature enhances the analytics capabilities by enabling users to download data for offline analysis, reporting, and integration with other tools.

## Implementation

The export functionality consists of the following components:

### 1. Export Utilities (`src/utils/exportUtils.ts`)

A utility file containing functions for exporting data in various formats:

- `convertToCSV`: Converts an array of objects to CSV format
- `exportToCSV`: Exports data as a CSV file
- `exportToJSON`: Exports data as a JSON file
- `exportToExcel`: Exports data as an Excel file
- `downloadBlob`: Helper function to download a Blob as a file
- `exportData`: Main function that formats data for export based on the specified format
- `prepareTimeSeriesForExport`: Prepares time series data for export
- `prepareDistributionForExport`: Prepares distribution data for export

### 2. Export Menu Component (`src/components/analytics/ExportMenu.tsx`)

A reusable React component that provides a dropdown menu for exporting data:

- `ExportMenu`: A dropdown menu component that offers options to export data in CSV, Excel, and JSON formats
- `ExportButton`: A simple button component for exporting data in a specific format

## Usage

### Using the Export Menu Component

```tsx
import { ExportMenu } from '@/components/analytics/ExportMenu';

// In your component
function AnalyticsComponent() {
  const data = [
    { id: 1, name: 'John', value: 100 },
    { id: 2, name: 'Jane', value: 200 },
    // ...more data
  ];
  
  return (
    <div>
      <h2>Analytics Data</h2>
      {/* Other components */}
      
      <ExportMenu
        data={data}
        filename="analytics-data"
        headers={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'value', label: 'Value' }
        ]}
      />
    </div>
  );
}
```

### Using the Export Button Component

```tsx
import { ExportButton } from '@/components/analytics/ExportMenu';

// In your component
function AnalyticsComponent() {
  const data = [
    { id: 1, name: 'John', value: 100 },
    { id: 2, name: 'Jane', value: 200 },
    // ...more data
  ];
  
  return (
    <div>
      <h2>Analytics Data</h2>
      {/* Other components */}
      
      <ExportButton
        data={data}
        filename="analytics-data"
        format="excel"
        buttonText="Export as Excel"
      />
    </div>
  );
}
```

### Using Export Utilities Directly

```tsx
import { exportData } from '@/utils/exportUtils';

// In your component
function AnalyticsComponent() {
  const data = [
    { id: 1, name: 'John', value: 100 },
    { id: 2, name: 'Jane', value: 200 },
    // ...more data
  ];
  
  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    exportData(
      data,
      format,
      'analytics-data',
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'value', label: 'Value' }
      ]
    );
  };
  
  return (
    <div>
      <h2>Analytics Data</h2>
      {/* Other components */}
      
      <button onClick={() => handleExport('csv')}>Export as CSV</button>
      <button onClick={() => handleExport('excel')}>Export as Excel</button>
      <button onClick={() => handleExport('json')}>Export as JSON</button>
    </div>
  );
}
```

## Preparing Data for Export

The export utilities include helper functions for preparing different types of data for export:

### Time Series Data

```tsx
import { prepareTimeSeriesForExport } from '@/utils/exportUtils';

const timeSeriesData = [
  { date: '2023-01-01', value: 100 },
  { date: '2023-01-02', value: 150 },
  // ...more data
];

const exportableData = prepareTimeSeriesForExport(timeSeriesData);
```

### Distribution Data

```tsx
import { prepareDistributionForExport } from '@/utils/exportUtils';

const distributionData = [
  { category: 'Category A', count: 100 },
  { category: 'Category B', count: 150 },
  // ...more data
];

const exportableData = prepareDistributionForExport(distributionData);
```

## Best Practices

1. **Provide Meaningful Filenames**: Include relevant information in the filename, such as the type of data, date range, or other context.

2. **Include Custom Headers**: When exporting to CSV or Excel, provide custom headers to make the exported data more readable and user-friendly.

3. **Handle Large Datasets**: For large datasets, consider implementing pagination or chunking to avoid performance issues.

4. **Format Data Appropriately**: Use the provided helper functions to format data appropriately for export.

5. **Provide User Feedback**: Inform users when an export is in progress and when it has completed.

## Future Enhancements

Potential future enhancements to the export functionality include:

1. **PDF Export**: Add support for exporting data as PDF files.

2. **Data Filtering**: Allow users to filter data before exporting.

3. **Export Preview**: Provide a preview of the data before exporting.

4. **Scheduled Exports**: Allow users to schedule regular exports.

5. **Email Delivery**: Enable sending exported files via email.

## Dependencies

The export functionality relies on the following dependencies:

- `xlsx`: For Excel file generation
- Browser APIs: `Blob`, `URL.createObjectURL`, and `document.createElement` for file downloads

## Troubleshooting

### Common Issues

1. **File Not Downloading**: Ensure that the browser allows downloads and that the data is not empty.

2. **Formatting Issues in Excel**: Check that the data is properly formatted and that date fields are correctly converted.

3. **Large File Performance**: For very large datasets, consider implementing pagination or chunking to avoid performance issues.

### Browser Compatibility

The export functionality has been tested and confirmed to work in the following browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Conclusion

The export functionality provides a powerful way for users to extract and analyze data from the Launchify Web Platform. By supporting multiple export formats, it enables users to work with the data in their preferred tools and workflows. 
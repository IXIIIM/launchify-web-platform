// Continuing from previous content...
    worksheet['!cols'] = Object.values(colWidths).map(width => ({
      wch: width + 2 // Add padding
    }));

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

// Export singleton instance
export const exportService = new ExportService();
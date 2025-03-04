import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Collapse,
  TablePagination,
  useTheme,
  Chip,
  Skeleton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

export interface Column<T = any> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row: T) => React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  sortable?: boolean;
  hidden?: boolean;
}

interface ResponsiveTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  expandableContent?: (row: T) => React.ReactNode;
  pagination?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  dense?: boolean;
  highlightOnHover?: boolean;
  stripedRows?: boolean;
  showBorders?: boolean;
}

/**
 * A responsive table component that adapts to different screen sizes
 * On mobile, it shows only high priority columns and provides expandable rows
 * On desktop, it shows all columns and provides a more traditional table layout
 */
const ResponsiveTable = <T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  expandableContent,
  pagination = false,
  rowsPerPageOptions = [5, 10, 25],
  defaultRowsPerPage = 10,
  stickyHeader = false,
  maxHeight,
  dense = false,
  highlightOnHover = true,
  stripedRows = false,
  showBorders = true
}: ResponsiveTableProps<T>) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useDeviceDetect();
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  
  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // Handle row expansion
  const handleRowExpand = (rowKey: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };
  
  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filter columns based on device
  const visibleColumns = React.useMemo(() => {
    if (isMobile) {
      return columns.filter(col => !col.hidden && col.priority !== 'low');
    }
    if (isTablet) {
      return columns.filter(col => !col.hidden && col.priority !== 'low');
    }
    return columns.filter(col => !col.hidden);
  }, [columns, isMobile, isTablet]);
  
  // Get paginated data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return data;
    return data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [data, pagination, page, rowsPerPage]);
  
  // Loading state
  if (loading) {
    return (
      <TableContainer component={Paper} sx={{ maxHeight }}>
        <Table stickyHeader={stickyHeader} size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {expandableContent && <TableCell style={{ width: 50 }} />}
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  <Skeleton variant="text" width="80%" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(new Array(5)).map((_, index) => (
              <TableRow key={index}>
                {expandableContent && <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>}
                {visibleColumns.map((column) => (
                  <TableCell key={column.id} align={column.align}>
                    <Skeleton variant="text" width={column.id === 'actions' ? 100 : '80%'} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
  
  // Empty state
  if (!data.length) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight }}>
        <Table 
          stickyHeader={stickyHeader} 
          size={dense ? 'small' : 'medium'}
          sx={{
            borderCollapse: 'separate',
            borderSpacing: showBorders ? undefined : '0 4px',
            '& .MuiTableCell-root': {
              borderBottom: showBorders ? undefined : 'none',
            }
          }}
        >
          <TableHead>
            <TableRow>
              {expandableContent && <TableCell style={{ width: 50 }} />}
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{ fontWeight: 'bold' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => {
              const rowKey = keyExtractor(row);
              const isExpanded = expandedRows[rowKey.toString()] || false;
              
              return (
                <React.Fragment key={rowKey}>
                  <TableRow
                    hover={highlightOnHover}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      backgroundColor: stripedRows && index % 2 ? 'action.hover' : undefined,
                      '&:hover': {
                        backgroundColor: highlightOnHover ? 'action.hover' : undefined,
                      }
                    }}
                  >
                    {expandableContent && (
                      <TableCell>
                        <IconButton
                          aria-label="expand row"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowExpand(rowKey.toString());
                          }}
                        >
                          {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                    )}
                    
                    {visibleColumns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format ? column.format(value, row) : (
                            typeof value === 'object' ? 
                              JSON.stringify(value) : 
                              String(value ?? '')
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {expandableContent && (
                    <TableRow>
                      <TableCell 
                        style={{ paddingBottom: 0, paddingTop: 0 }} 
                        colSpan={visibleColumns.length + 1}
                      >
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2, px: 1 }}>
                            {expandableContent(row)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
};

export default ResponsiveTable; 
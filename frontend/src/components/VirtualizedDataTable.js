import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Pagination
} from '@mui/material';
import {
  Search,
  FilterList,
  Sort,
  Download,
  Refresh,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import performanceOptimizer from '../services/performanceOptimizer';

const VirtualizedDataTable = ({
  data = [],
  columns = [],
  height = 400,
  rowHeight = 52,
  pageSize = 50,
  enableSearch = true,
  enableFiltering = true,
  enableSorting = true,
  enableExport = true,
  loading = false,
  onRowClick,
  onDataChange
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: pageSize });
  const [scrollTop, setScrollTop] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [performanceMode, setPerformanceMode] = useState('balanced');
  
  const containerRef = useRef(null);
  const tableRef = useRef(null);
  const observerRef = useRef(null);

  // Performance optimization settings
  const optimizationSettings = useMemo(() => {
    const settings = performanceOptimizer.getCurrentSettings();
    return {
      renderBuffer: settings.enableAnimations ? 10 : 5,
      updateInterval: settings.mapUpdateInterval,
      maxVisibleRows: Math.min(100, Math.floor(height / rowHeight) + 10)
    };
  }, [height, rowHeight]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filteredData = [...data];

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        filteredData = filteredData.filter(row => {
          const cellValue = row[field];
          if (typeof cellValue === 'string') {
            return cellValue.toLowerCase().includes(value.toLowerCase());
          }
          return cellValue === value;
        });
      }
    });

    // Apply sorting
    if (sortConfig.field) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filteredData;
  }, [data, searchTerm, filters, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = Math.ceil(processedData.length / pageSize);

  // Handle scroll events with throttling
  const handleScroll = useCallback((event) => {
    const { scrollTop: newScrollTop } = event.target;
    setScrollTop(newScrollTop);
    
    // Calculate visible range
    const start = Math.floor(newScrollTop / rowHeight);
    const end = Math.min(
      start + optimizationSettings.maxVisibleRows,
      processedData.length
    );
    
    setVisibleRange({ start, end });
  }, [rowHeight, processedData.length, optimizationSettings.maxVisibleRows]);

  // Handle search
  const handleSearch = useCallback((event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Handle sorting
  const handleSort = useCallback((field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page
  }, []);

  // Handle filtering
  const handleFilter = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset to first page
  }, []);

  // Handle page change
  const handlePageChange = useCallback((event, newPage) => {
    setCurrentPage(newPage);
  }, []);

  // Export data
  const handleExport = useCallback(() => {
    const csvContent = generateCSV(processedData, columns);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `galileosky-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [processedData, columns]);

  // Generate CSV content
  const generateCSV = (data, columns) => {
    const headers = columns.map(col => col.header).join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.field];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  // Performance monitoring
  useEffect(() => {
    const handleMetricsUpdate = (metrics) => {
      // Adjust performance based on metrics
      if (metrics.memoryUsage > 70 || metrics.fps < 30) {
        setPerformanceMode('power_save');
      } else if (metrics.memoryUsage < 30 && metrics.fps > 55) {
        setPerformanceMode('performance');
      } else {
        setPerformanceMode('balanced');
      }
    };

    performanceOptimizer.addEventListener('metricsUpdated', handleMetricsUpdate);

    return () => {
      performanceOptimizer.removeEventListener('metricsUpdated', handleMetricsUpdate);
    };
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Load more data if needed
            const rowIndex = parseInt(entry.target.dataset.index);
            if (rowIndex >= processedData.length - 10) {
              // Trigger load more if available
              if (onDataChange) {
                onDataChange({ type: 'loadMore', index: rowIndex });
              }
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [processedData.length, onDataChange]);

  // Render table header
  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.field}
            style={{
              fontWeight: 'bold',
              backgroundColor: '#f5f5f5',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">{column.header}</Typography>
              {enableSorting && (
                <IconButton
                  size="small"
                  onClick={() => handleSort(column.field)}
                  disabled={loading}
                >
                  <Sort
                    style={{
                      transform: sortConfig.field === column.field && sortConfig.direction === 'desc' 
                        ? 'rotate(180deg)' 
                        : 'none'
                    }}
                  />
                </IconButton>
              )}
            </Box>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  // Render table row
  const renderTableRow = (row, index) => (
    <TableRow
      key={`${row.id || index}-${currentPage}`}
      hover
      onClick={() => onRowClick && onRowClick(row, index)}
      style={{
        cursor: onRowClick ? 'pointer' : 'default',
        height: rowHeight
      }}
      data-index={index}
    >
      {columns.map((column) => (
        <TableCell key={column.field}>
          {column.render ? column.render(row[column.field], row) : row[column.field]}
        </TableCell>
      ))}
    </TableRow>
  );

  // Render performance indicator
  const renderPerformanceIndicator = () => (
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      <Chip
        label={`${performanceMode.replace('_', ' ')}`}
        color={performanceMode === 'power_save' ? 'warning' : performanceMode === 'performance' ? 'success' : 'default'}
        size="small"
      />
      <Typography variant="caption" color="textSecondary">
        Showing {paginatedData.length} of {processedData.length} records
      </Typography>
      {loading && <CircularProgress size={16} />}
    </Box>
  );

  // Render search and filters
  const renderSearchAndFilters = () => (
    <Box display="flex" gap={2} mb={2} flexWrap="wrap">
      {enableSearch && (
        <TextField
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          style={{ minWidth: 200 }}
        />
      )}
      
      {enableFiltering && (
        <FormControl size="small" style={{ minWidth: 120 }}>
          <Select
            value=""
            displayEmpty
            startAdornment={
              <InputAdornment position="start">
                <FilterList />
              </InputAdornment>
            }
          >
            <MenuItem value="" disabled>Filters</MenuItem>
            {columns.map(column => (
              <MenuItem key={column.field} value={column.field}>
                {column.header}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      {enableExport && (
        <Tooltip title="Export to CSV">
          <IconButton onClick={handleExport} disabled={loading || processedData.length === 0}>
            <Download />
          </IconButton>
        </Tooltip>
      )}
      
      <Tooltip title="Refresh">
        <IconButton onClick={() => onDataChange && onDataChange({ type: 'refresh' })} disabled={loading}>
          <Refresh />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box>
      {renderPerformanceIndicator()}
      {renderSearchAndFilters()}
      
      <TableContainer
        ref={containerRef}
        component={Paper}
        style={{ height, overflow: 'auto' }}
        onScroll={handleScroll}
      >
        <Table ref={tableRef} stickyHeader>
          {renderTableHeader()}
          <TableBody>
            {paginatedData.map((row, index) => renderTableRow(row, index))}
          </TableBody>
        </Table>
        
        {paginatedData.length === 0 && !loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={200}
          >
            <Typography variant="body2" color="textSecondary">
              No data available
            </Typography>
          </Box>
        )}
      </TableContainer>
      
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            disabled={loading}
            size="small"
          />
        </Box>
      )}
    </Box>
  );
};

export default VirtualizedDataTable;


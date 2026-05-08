'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

// ─── Types ───

export interface UseDataTableOptions<T> {
  data: T[];
  searchableKeys?: string[];
  defaultPageSize?: number;
  storageKey?: string; // for localStorage persistence
}

export interface UseDataTableReturn<T> {
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;

  // Filters
  activeFilters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;

  // Pagination
  currentPage: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
  totalPages: number;

  // Processed data
  filteredData: T[];
  paginatedData: T[];
  totalRecords: number;
  filteredCount: number;
  startRecord: number;
  endRecord: number;
}

// ─── Hook ───

export function useDataTable<T extends object>({
  data,
  searchableKeys = [],
  defaultPageSize = 10,
  storageKey,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  // ─── Search state ───
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ─── Filter state ───
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const setFilter = useCallback((key: string, value: string) => {
    setActiveFilters((prev) => {
      if (!value || value === 'ALL') {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setCurrentPage(1);
  }, []);

  // ─── Pagination state ───
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dt_pageSize_${storageKey}`);
      return saved ? parseInt(saved, 10) : defaultPageSize;
    }
    return defaultPageSize;
  });

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      setCurrentPage(1);
      if (storageKey && typeof window !== 'undefined') {
        localStorage.setItem(`dt_pageSize_${storageKey}`, String(size));
      }
    },
    [storageKey]
  );

  // ─── Filtered data ───
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter((row) =>
        searchableKeys.some((key) => {
          const value = getNestedValue(row, key);
          return String(value ?? '').toLowerCase().includes(term);
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      result = result.filter((row) => {
        const rowValue = getNestedValue(row, key);
        return String(rowValue) === value;
      });
    });

    return result;
  }, [data, debouncedSearchTerm, searchableKeys, activeFilters]);

  // Reset page when filtered data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, activeFilters]);

  // ─── Paginated data ───
  const totalRecords = data.length;
  const filteredCount = filteredData.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (pageSize === -1) return filteredData; // Show all
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, safeCurrentPage, pageSize]);

  const startRecord = filteredCount === 0 ? 0 : (safeCurrentPage - 1) * (pageSize === -1 ? filteredCount : pageSize) + 1;
  const endRecord = pageSize === -1 ? filteredCount : Math.min(safeCurrentPage * pageSize, filteredCount);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    activeFilters,
    setFilter,
    clearFilters,
    currentPage: safeCurrentPage,
    pageSize,
    setPageSize,
    setCurrentPage,
    totalPages,
    filteredData,
    paginatedData,
    totalRecords,
    filteredCount,
    startRecord,
    endRecord,
  };
}

// ─── Helper ───

function getNestedValue(obj: object, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as any)) {
      return (acc as any)[key];
    }
    return undefined;
  }, obj);
}

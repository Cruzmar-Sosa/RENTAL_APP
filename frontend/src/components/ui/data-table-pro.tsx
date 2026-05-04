'use client';

import * as React from 'react';
import { 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';

// ─── Types ───

export interface DataTableColumn<T> {
  /** Column header label */
  header: string;
  /** Dot-notation key to access value from data row */
  accessorKey: string;
  /** Custom cell renderer */
  cell?: (row: T, index: number) => React.ReactNode;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether to include in exports */
  exportable?: boolean;
  /** Width class override (e.g. "w-48") */
  className?: string;
}

export interface DataTableFilter {
  /** Dot-notation key to filter by */
  key: string;
  /** Label shown in filter dropdown */
  label: string;
  /** Available filter options */
  options: { label: string; value: string }[];
}

export interface DataTableProProps<T> {
  /** Array of data rows */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Filter definitions */
  filters?: DataTableFilter[];
  /** Whether export is enabled */
  exportEnabled?: boolean;
  /** Title for the export report / module name */
  exportTitle?: string;
  /** Filename base for exported files */
  exportFileName?: string;
  /** Search term (controlled) */
  searchTerm: string;
  /** Search change handler */
  onSearchChange: (term: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Current active filters */
  activeFilters: Record<string, string>;
  /** Filter change handler */
  onFilterChange: (key: string, value: string) => void;
  /** Pagination — current page */
  currentPage: number;
  /** Pagination — total pages */
  totalPages: number;
  /** Pagination — page size */
  pageSize: number;
  /** Pagination — set page */
  onPageChange: (page: number) => void;
  /** Pagination — set page size */
  onPageSizeChange: (size: number) => void;
  /** Record counter */
  startRecord: number;
  endRecord: number;
  filteredCount: number;
  totalRecords: number;
  /** The paginated data to render */
  paginatedData: T[];
  /** Full filtered data for exports */
  filteredData: T[];
  /** Loading state */
  isLoading?: boolean;
  /** Empty state icon */
  emptyIcon?: React.ReactNode;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Extra header actions (e.g. "Add New Bike" button) */
  headerActions?: React.ReactNode;
  /** Page title */
  title?: string;
  /** Page subtitle */
  subtitle?: string;
}

// ─── Skeleton ───

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-6 py-5">
              <div className="h-4 bg-gray-100 rounded-lg w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Export Dropdown ───

function ExportDropdown<T extends Record<string, unknown>>({
  data,
  columns,
  title,
  fileName,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  title: string;
  fileName: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportCols = columns
    .filter((c) => c.exportable !== false)
    .map((c) => ({ header: c.header, accessorKey: c.accessorKey }));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border",
          isOpen
            ? "bg-black text-white border-black shadow-lg shadow-black/10"
            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        <Download size={16} />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl shadow-black/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              exportToExcel(data as Record<string, unknown>[], exportCols, fileName);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet size={16} className="text-green-600" />
            Excel (.xlsx)
          </button>
          <div className="border-t border-gray-50" />
          <button
            onClick={() => {
              exportToPDF(data as Record<string, unknown>[], exportCols, title, fileName);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText size={16} className="text-red-500" />
            PDF Report
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page Size Options ───
const PAGE_SIZE_OPTIONS = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: 'All', value: -1 },
];

// ─── Main Component ───

export function DataTablePro<T extends Record<string, unknown>>({
  data,
  columns,
  filters = [],
  exportEnabled = true,
  exportTitle = 'Report',
  exportFileName = 'export',
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  activeFilters,
  onFilterChange,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  startRecord,
  endRecord,
  filteredCount,
  totalRecords,
  paginatedData,
  filteredData,
  isLoading = false,
  emptyIcon,
  emptyTitle = 'No records found',
  emptyMessage = 'Try adjusting your search or filters.',
  headerActions,
  title,
  subtitle,
}: DataTableProProps<T>) {
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      {(title || headerActions) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {title && (
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-black">{title}</h1>
              {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
            </div>
          )}
          {headerActions && <div className="flex items-center gap-3 shrink-0">{headerActions}</div>}
        </div>
      )}

      {/* ─── Toolbar: Search + Filters + Export ─── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition text-sm"
          />
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <>
            <div className="hidden md:block h-8 w-px bg-gray-100" />
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal size={16} className="text-gray-400 shrink-0 hidden md:block" />
              {filters.map((filter) => (
                <select
                  key={filter.key}
                  value={activeFilters[filter.key] || 'ALL'}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-colors appearance-none cursor-pointer pr-8",
                    activeFilters[filter.key]
                      ? "bg-black text-white border-black"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                  )}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${activeFilters[filter.key] ? 'white' : '%23999'}' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                  }}
                >
                  <option value="ALL">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={() => filters.forEach((f) => onFilterChange(f.key, 'ALL'))}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Clear all filters"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </>
        )}

        <div className="hidden md:block h-8 w-px bg-gray-100" />

        {/* Record count badge */}
        <div className="flex items-center gap-2 px-2 shrink-0">
          <span className="text-sm font-medium text-gray-500">Total:</span>
          <span className="text-sm font-bold bg-black text-white px-2.5 py-1 rounded-lg">
            {filteredCount !== totalRecords ? `${filteredCount} / ${totalRecords}` : totalRecords}
          </span>
        </div>

        {/* Export */}
        {exportEnabled && (
          <>
            <div className="hidden md:block h-8 w-px bg-gray-100" />
            <ExportDropdown
              data={filteredData as Record<string, unknown>[]}
              columns={columns as DataTableColumn<Record<string, unknown>>[]}
              title={exportTitle}
              fileName={exportFileName}
            />
          </>
        )}
      </div>

      {/* ─── Table ─── */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      "px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider",
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <TableSkeleton columns={columns.length} />
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors group">
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={cn(
                          "px-6 py-5",
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.className
                        )}
                      >
                        {col.cell
                          ? col.cell(row, rowIdx)
                          : String(getNestedValue(row, col.accessorKey) ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="p-16 text-center space-y-4">
                      {emptyIcon && (
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-gray-300">
                          {emptyIcon}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{emptyTitle}</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mt-2">{emptyMessage}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Footer: Pagination + Record Counter ─── */}
        {!isLoading && filteredCount > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gray-50/30">
            {/* Record counter */}
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-bold text-gray-900">{startRecord}</span>
              {' '}to{' '}
              <span className="font-bold text-gray-900">{endRecord}</span>
              {' '}of{' '}
              <span className="font-bold text-gray-900">{filteredCount}</span>
              {' '}records
              {filteredCount !== totalRecords && (
                <span className="text-gray-400"> (filtered from {totalRecords})</span>
              )}
            </p>

            {/* Page size + Pagination */}
            <div className="flex items-center gap-4">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-2 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer pr-6"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 6px center',
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page numbers */}
                  {generatePageNumbers(currentPage, totalPages).map((page, idx) =>
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-xs">
                        ···
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => onPageChange(page as number)}
                        className={cn(
                          "min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all duration-200",
                          currentPage === page
                            ? "bg-black text-white shadow-sm"
                            : "text-gray-500 hover:bg-gray-100 hover:text-black"
                        )}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}

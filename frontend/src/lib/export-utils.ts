import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to Excel (.xlsx)
 * Uses visible/filtered data with column headers matching the table.
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: { header: string; accessorKey: string }[],
  fileName: string
): void {
  const rows = data.map((row) =>
    columns.reduce<Record<string, unknown>>((acc, col) => {
      acc[col.header] = getNestedValue(row, col.accessorKey);
      return acc;
    }, {})
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, fileName.slice(0, 31));

  // Auto-size columns
  const colWidths = columns.map((col) => ({
    wch: Math.max(
      col.header.length,
      ...data.map((row) => String(getNestedValue(row, col.accessorKey) ?? '').length)
    ) + 2,
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${fileName}_${formatDate()}.xlsx`);
}

/**
 * Export data to PDF with professional report layout.
 * Includes module title, export date, and styled table.
 */
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: { header: string; accessorKey: string }[],
  title: string,
  fileName: string
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // ─── Header ───
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 14, 16, { align: 'right' });

  // ─── Summary line ───
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text(`Total records: ${data.length}`, 14, 36);

  // ─── Table ───
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) =>
    columns.map((col) => String(getNestedValue(row, col.accessorKey) ?? '—'))
  );

  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 15, 15],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    styles: {
      lineColor: [230, 230, 230],
      lineWidth: 0.3,
      overflow: 'linebreak',
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (pageData) => {
      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `Page ${pageData.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
      doc.text(
        `${title} — Report`,
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  doc.save(`${fileName}_${formatDate()}.pdf`);
}

// ─── Helpers ───

/**
 * Access nested object values with dot-notation keys.
 * e.g. getNestedValue({ user: { name: 'John' } }, 'user.name') → 'John'
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function formatDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

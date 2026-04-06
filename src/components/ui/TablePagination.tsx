"use client";

interface TablePaginationProps {
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (count: number) => void;
  pageSizeOptions?: number[];
}

export default function TablePagination({
  totalCount,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50],
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const rangeStart = totalCount === 0 ? 0 : itemsPerPage * (currentPage - 1) + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <span>{totalCount === 0 ? "0–0 of 0" : `${rangeStart}–${rangeEnd} of ${totalCount}`}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="First page">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
          </button>
          <button onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Previous page">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Next page">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Last page">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

const DEFAULT_SIZES = [10, 25, 50, 100];

// Client-side pagination for a list that is already in memory.
//   const { pageItems, paginationProps } = usePagination(rows);
//   rows -> pageItems.map(...)   and   <Pagination {...paginationProps} />
// Goes back to page 1 when `resetKey` changes (e.g. filters/search) and clamps the page
// when the list shrinks (e.g. after a delete).
export const usePagination = (items = [], initialPageSize = 10, resetKey = '') => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const total = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => { setPage(1); }, [resetKey, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const pageItems = useMemo(
    () => (Array.isArray(items) ? items.slice((page - 1) * pageSize, page * pageSize) : []),
    [items, page, pageSize]
  );

  return {
    pageItems,
    page,
    pageSize,
    total,
    paginationProps: { page, pageSize, total, onPageChange: setPage, onPageSizeChange: setPageSize },
  };
};

// Page numbers with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20
const buildPages = (page, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < totalPages - 1) out.push('…');
  out.push(totalPages);
  return out;
};

const Pagination = ({
  page,
  pageSize,
  total,
  totalPages: totalPagesProp, // for server-side paging when only the page count is known
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_SIZES,
  className = '',
}) => {
  const hasTotal = typeof total === 'number';
  const totalPages = totalPagesProp ?? Math.max(1, Math.ceil((total || 0) / pageSize));
  if (hasTotal ? !total : totalPages <= 1) return null;
  // Nothing to paginate and no size choice to offer
  if (hasTotal && total <= Math.min(...pageSizeOptions) && totalPages === 1) {
    return (
      <div className={`px-4 py-3 text-xs font-semibold text-gray-500 ${className}`}>
        Showing {total} of {total} {total === 1 ? 'entry' : 'entries'}
      </div>
    );
  }

  const from = (page - 1) * pageSize + 1;
  const to = hasTotal ? Math.min(total, page * pageSize) : page * pageSize;
  const btn =
    'h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-lg border text-xs font-bold transition-colors';
  const idle = 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50';
  const off = 'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white';

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-100 ${className}`}>
      <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
        {hasTotal ? (
          <span>
            Showing <span className="text-gray-800">{from}–{to}</span> of <span className="text-gray-800">{total}</span>
          </span>
        ) : (
          <span>Page <span className="text-gray-800">{page}</span> of <span className="text-gray-800">{totalPages}</span></span>
        )}
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 focus:outline-none"
            >
              {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button type="button" aria-label="First page" disabled={page === 1} onClick={() => onPageChange(1)} className={`${btn} ${idle} ${off}`}>
          <FiChevronsLeft size={14} />
        </button>
        <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)} className={`${btn} ${idle} ${off}`}>
          <FiChevronLeft size={14} />
        </button>

        {buildPages(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-gray-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
              className={`${btn} ${p === page ? 'border-[#189D91] bg-[#189D91] text-white' : idle}`}
            >
              {p}
            </button>
          )
        )}

        <button type="button" aria-label="Next page" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className={`${btn} ${idle} ${off}`}>
          <FiChevronRight size={14} />
        </button>
        <button type="button" aria-label="Last page" disabled={page === totalPages} onClick={() => onPageChange(totalPages)} className={`${btn} ${idle} ${off}`}>
          <FiChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

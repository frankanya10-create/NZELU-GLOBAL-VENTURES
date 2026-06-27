'use client';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

export default function DataTable({ columns, data, onRowClick, loading, pagination, onPageChange, emptyMessage = 'No data found.' }) {
  const tableRef = useRef(null);

  useEffect(() => {
    if (tableRef.current && data?.length) {
      const rows = tableRef.current.querySelectorAll('tbody tr');
      gsap.fromTo(rows, { opacity: 0, y: 8 }, {
        opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out',
      });
    }
  }, [data]);

  return (
    <div>
      <div className="overflow-x-auto">
        <table ref={tableRef} className="ngv-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={col.className || ''} style={col.width ? { width: col.width } : undefined}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-surface-200 border-t-ngv-700 rounded-full animate-spin" />
                    <span className="text-sm text-surface-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data?.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <p className="text-surface-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data?.map((row, rowIndex) => (
                <tr
                  key={row._id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.render ? col.render(row, rowIndex) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
          <p className="text-sm text-surface-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-surface-700">{pagination.page} / {pagination.pages}</span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

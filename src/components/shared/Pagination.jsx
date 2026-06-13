import React, { useMemo } from 'react'

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const start = Math.min(Math.max(currentPage - 2, 1), totalPages - 4)
  return Array.from({ length: 5 }, (_, index) => start + index)
}

export default function Pagination({
  currentPage = 1,
  pageSize = 10,
  totalRecords = 0,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange
}) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const startRecord = totalRecords === 0 ? 0 : ((safeCurrentPage - 1) * pageSize) + 1
  const endRecord = totalRecords === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalRecords)
  const visiblePages = useMemo(
    () => getVisiblePages(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  )

  return (
    <div className="standard-pagination">
      <div className="pagination-summary">
        Showing {startRecord}-{endRecord} of {totalRecords} Records
      </div>

      <div className="pagination-controls">
        <label className="pagination-page-size">
          <span>Page Size</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        <nav className="pagination-pages" aria-label="Pagination">
          <button
            type="button"
            className="pagination-button pagination-nav"
            disabled={safeCurrentPage === 1 || totalRecords === 0}
            onClick={() => onPageChange?.(safeCurrentPage - 1)}
          >
            Previous
          </button>
          {visiblePages.map((page) => (
            <button
              type="button"
              key={page}
              className={`pagination-button ${page === safeCurrentPage ? 'is-active' : ''}`}
              aria-current={page === safeCurrentPage ? 'page' : undefined}
              onClick={() => onPageChange?.(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="pagination-button pagination-nav"
            disabled={safeCurrentPage === totalPages || totalRecords === 0}
            onClick={() => onPageChange?.(safeCurrentPage + 1)}
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  )
}

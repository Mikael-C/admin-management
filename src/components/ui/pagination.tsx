'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = []

    if (currentPage <= 4) {
      // Near the start
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('ellipsis-end')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      // Near the end
      pages.push(1)
      pages.push('ellipsis-start')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      // Middle
      pages.push(1)
      pages.push('ellipsis-start')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('ellipsis-end')
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {startItem}–{endItem} of {totalItems} entries
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      {/* Entry count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
        Showing <span className="font-medium text-gray-700 dark:text-gray-300">{startItem}</span>–
        <span className="font-medium text-gray-700 dark:text-gray-300">{endItem}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {totalItems.toLocaleString()}
        </span>{' '}
        entries
      </p>

      {/* Page controls */}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
            currentPage === 1
              ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span
                  key={page}
                  className="px-2 py-1.5 text-sm text-gray-400 dark:text-gray-500 select-none"
                >
                  …
                </span>
              )
            }
            const isActive = page === currentPage
            return (
              <button
                key={`page-${page}-${idx}`}
                onClick={() => onPageChange(page as number)}
                className={cn(
                  'min-w-[2rem] rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
            currentPage === totalPages
              ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          )}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}

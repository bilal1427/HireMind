import { cn } from '@/lib/utils';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

const PaginationSizes = {
  sm: {
    button: 'h-7 w-7 text-xs',
    nav: 'h-7 w-7',
    ellipsis: 'h-7 w-7 text-xs',
  },
  md: {
    button: 'h-9 w-9 text-sm',
    nav: 'h-9 w-9',
    ellipsis: 'h-9 w-9 text-sm',
  },
  lg: {
    button: 'h-11 w-11 text-base',
    nav: 'h-11 w-11',
    ellipsis: 'h-11 w-11 text-base',
  },
};

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  size = 'md',
  showFirstLast = true,
  className,
}) {
  const sizeConfig = PaginationSizes[size];

  const getPageNumbers = () => {
    const pages = [];
    const totalNumbers = siblingCount * 2 + 5;

    if (totalPages <= totalNumbers) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);
    const shouldShowLeftDots = leftSibling > 2;
    const shouldShowRightDots = rightSibling < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      for (let i = 1; i <= leftItemCount; i++) {
        pages.push(i);
      }
      pages.push('right-dots');
      pages.push(lastPageIndex);
    } else if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      pages.push(firstPageIndex);
      pages.push('left-dots');
      for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (shouldShowLeftDots && shouldShowRightDots) {
      pages.push(firstPageIndex);
      pages.push('left-dots');
      for (let i = leftSibling; i <= rightSibling; i++) {
        pages.push(i);
      }
      pages.push('right-dots');
      pages.push(lastPageIndex);
    }

    return pages;
  };

  const pages = getPageNumbers();
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1.5', className)}
    >
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={!canGoBack}
          aria-label="First page"
          className={cn(
            'inline-flex items-center justify-center rounded-md border border-surface-200 dark:border-surface-700',
            'text-surface-600 dark:text-surface-400',
            'bg-white dark:bg-surface-900',
            'hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600',
            'transition-all duration-200',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
            sizeConfig.nav
          )}
        >
          <FiChevronsLeft className="w-4 h-4" />
        </button>
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoBack}
        aria-label="Previous page"
        className={cn(
          'inline-flex items-center justify-center rounded-md border border-surface-200 dark:border-surface-700',
          'text-surface-600 dark:text-surface-400',
          'bg-white dark:bg-surface-900',
          'hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600',
          'transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
          sizeConfig.nav
        )}
      >
        <FiChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((page, index) => {
        if (page === 'left-dots' || page === 'right-dots') {
          return (
            <span
              key={`dots-${index}`}
              aria-hidden="true"
              className={cn(
                'inline-flex items-center justify-center text-surface-400 dark:text-surface-500',
                sizeConfig.ellipsis
              )}
            >
              •••
            </span>
          );
        }

        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Page ${page}`}
            className={cn(
              'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
              isActive
                ? 'bg-brand-600 text-white border border-brand-600 shadow-sm hover:bg-brand-700'
                : 'bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600',
              sizeConfig.button
            )}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoForward}
        aria-label="Next page"
        className={cn(
          'inline-flex items-center justify-center rounded-md border border-surface-200 dark:border-surface-700',
          'text-surface-600 dark:text-surface-400',
          'bg-white dark:bg-surface-900',
          'hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600',
          'transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
          sizeConfig.nav
        )}
      >
        <FiChevronRight className="w-4 h-4" />
      </button>

      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoForward}
          aria-label="Last page"
          className={cn(
            'inline-flex items-center justify-center rounded-md border border-surface-200 dark:border-surface-700',
            'text-surface-600 dark:text-surface-400',
            'bg-white dark:bg-surface-900',
            'hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600',
            'transition-all duration-200',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
            sizeConfig.nav
          )}
        >
          <FiChevronsRight className="w-4 h-4" />
        </button>
      )}
    </nav>
  );
}

export { Pagination };

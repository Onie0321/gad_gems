import React from "react";
import { Button } from "./button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  showPageNumbers = true,
  maxPageNumbers = 5,
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const halfMax = Math.floor(maxPageNumbers / 2);

    let startPage = Math.max(1, currentPage - halfMax);
    let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxPageNumbers - 1) {
      startPage = Math.max(1, endPage - maxPageNumbers + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {showPageNumbers && (
          <div className="flex items-center space-x-1">
            {pageNumbers[0] > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={loading}
                >
                  1
                </Button>
                {pageNumbers[0] > 2 && (
                  <div className="flex items-center px-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                )}
              </>
            )}

            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                disabled={loading}
              >
                {page}
              </Button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <div className="flex items-center px-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  disabled={loading}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export const PaginationInfo = ({ pagination, loading = false }) => {
  if (!pagination || pagination.totalItems === 0) return null;

  return (
    <div className="text-sm text-gray-500">
      {loading
        ? "Loading..."
        : `Showing ${pagination.startIndex} to ${pagination.endIndex} of ${pagination.totalItems} entries`}
    </div>
  );
};

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  itemName = "Products",
}: PaginationProps) {
  if (totalItems <= 0) return null;

  // Generate page numbers with intelligent ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always show page 1
    pages.push(1);

    if (currentPage > 3) {
      pages.push("ellipsis-prev");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis-next");
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col items-center gap-4">
      {/* Informational Summary Badge */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-medium flex-wrap justify-center">
        <span>
          Showing{" "}
          <strong className="text-gray-900 font-bold">
            {startIndex + 1}–{endIndex}
          </strong>{" "}
          of <strong className="text-[#cb1e46] font-bold">{totalItems}</strong> {itemName}
        </span>
        <span className="text-gray-300">•</span>
        <span className="bg-red-50 text-[#cb1e46] font-bold px-2.5 py-0.5 rounded-full border border-red-100 text-xs">
          Page {currentPage} of {totalPages} (20 per page)
        </span>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          role="navigation"
          aria-label="Pagination Navigation"
          className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center"
        >
          {/* Jump to First Page */}
          {totalPages > 4 && currentPage > 2 && (
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#cb1e46] hover:border-[#cb1e46] hover:bg-red-50/50 transition cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}

          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className={`inline-flex items-center gap-1 px-3 sm:px-3.5 h-9 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
              currentPage <= 1
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                : "bg-white text-gray-700 border-gray-200 hover:text-[#cb1e46] hover:border-[#cb1e46] hover:bg-red-50/50 active:scale-95 shadow-2xs"
            }`}
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          {/* Numbered Page Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {pages.map((p, idx) => {
              if (typeof p === "string") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-7 sm:w-8 text-center text-gray-400 font-bold select-none text-xs"
                  >
                    •••
                  </span>
                );
              }

              const isActive = p === currentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#cb1e46] text-white shadow-xs border border-[#cb1e46] scale-105"
                      : "bg-white text-gray-700 border border-gray-200 hover:text-[#cb1e46] hover:border-[#cb1e46] hover:bg-red-50/50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className={`inline-flex items-center gap-1 px-3 sm:px-3.5 h-9 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
              currentPage >= totalPages
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                : "bg-[#cb1e46] text-white border-[#cb1e46] hover:bg-[#ad1537] active:scale-95 shadow-xs"
            }`}
            title="Next Page"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Jump to Last Page */}
          {totalPages > 4 && currentPage < totalPages - 1 && (
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#cb1e46] hover:border-[#cb1e46] hover:bg-red-50/50 transition cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
